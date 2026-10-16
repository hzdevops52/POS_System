import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Sale from '../models/sale.model.js';
import InventoryMovement from '../models/inventory-movement.model.js';

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export async function createSale(req, res, next) {
  const inputItems = req.body?.items;
  const paymentMethod = req.body?.paymentMethod;

  if (!Array.isArray(inputItems) || inputItems.length === 0 || inputItems.length > 100) {
    return res.status(400).json({
      error: { code: 'INVALID_ITEMS', message: 'Provide between 1 and 100 sale items.' }
    });
  }

  if (!['cash', 'card'].includes(paymentMethod)) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYMENT_METHOD', message: 'Payment method must be cash or card.' }
    });
  }

  // A card selection is not proof of payment. Reject it until a real provider is integrated.
  if (paymentMethod === 'card') {
    return res.status(409).json({
      error: {
        code: 'CARD_PAYMENT_NOT_CONFIGURED',
        message: 'Card payments are unavailable until a payment provider or terminal is configured.'
      }
    });
  }

  const amountReceivedPaisa = req.body?.amountReceivedPaisa;
  if (!Number.isSafeInteger(amountReceivedPaisa) || amountReceivedPaisa < 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_CASH_RECEIVED',
        message: 'Enter the cash amount received as a non-negative whole number of paisa.'
      }
    });
  }

  const quantities = new Map();

  for (const item of inputItems) {
    if (!item || !mongoose.isValidObjectId(item.productId) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ITEM',
          message: 'Each item needs a valid productId and a positive whole-number quantity.'
        }
      });
    }

    const id = String(item.productId);
    quantities.set(id, (quantities.get(id) || 0) + item.quantity);

    if (!Number.isSafeInteger(quantities.get(id))) {
      return res.status(400).json({
        error: { code: 'INVALID_QUANTITY', message: 'Combined item quantity is too large.' }
      });
    }
  }

  const session = await mongoose.startSession();

  try {
    let completedSale;

    await session.withTransaction(async () => {
      const ids = [...quantities.keys()];
      const products = await Product.find({ _id: { $in: ids } }).session(session);
      const productById = new Map(products.map(product => [String(product._id), product]));

      if (products.length !== ids.length) {
        throw httpError(400, 'PRODUCT_NOT_FOUND', 'One or more selected products no longer exist.');
      }

      const saleItems = [];
      let subtotalPaisa = 0;

      for (const [productId, quantity] of quantities) {
        const product = productById.get(productId);

        if (product.status !== 'active') {
          throw httpError(409, 'PRODUCT_INACTIVE', `${product.name} is inactive and cannot be sold.`);
        }

        if (product.stockQty < quantity) {
          throw httpError(409, 'INSUFFICIENT_STOCK', `Not enough stock for ${product.name}. Available: ${product.stockQty}.`);
        }

        const lineTotalPaisa = product.pricePaisa * quantity;

        if (!Number.isSafeInteger(lineTotalPaisa) ||
            !Number.isSafeInteger(subtotalPaisa + lineTotalPaisa)) {
          throw httpError(400, 'TOTAL_TOO_LARGE', 'Sale total exceeds the supported amount.');
        }

        subtotalPaisa += lineTotalPaisa;
        saleItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity,
          unitPricePaisa: product.pricePaisa,
          lineTotalPaisa
        });
      }

      // Validate tender before changing inventory or creating any sale records.
      if (amountReceivedPaisa < subtotalPaisa) {
        throw httpError(
          400,
          'INSUFFICIENT_PAYMENT',
          'Cash received must be at least the total due.'
        );
      }

      const changePaisa = amountReceivedPaisa - subtotalPaisa;

      // Conditional stock updates prevent selling inventory that has already run out.
      for (const item of saleItems) {
        const result = await Product.updateOne(
          {
            _id: item.product,
            status: 'active',
            stockQty: { $gte: item.quantity }
          },
          { $inc: { stockQty: -item.quantity } },
          { session }
        );

        if (result.modifiedCount !== 1) {
          throw httpError(409, 'STOCK_CHANGED', `Stock changed for ${item.name}. Refresh products and retry checkout.`);
        }
      }

      const receiptNumber =
        `HZ-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

      const movementRecords = saleItems.map(item => {
        const previousQty = productById.get(String(item.product)).stockQty;
        return {
          product: item.product,
          type: 'sale',
          quantityChange: -item.quantity,
          previousQty,
          newQty: previousQty - item.quantity,
          reason: 'POS checkout',
          reference: receiptNumber
        };
      });

      await InventoryMovement.insertMany(movementRecords, { session });

      const [sale] = await Sale.create([{
        receiptNumber,
        items: saleItems,
        subtotalPaisa,
        totalPaisa: subtotalPaisa,
        paymentMethod,
        amountReceivedPaisa,
        changePaisa,
        status: 'completed'
      }], { session });

      completedSale = sale.toObject();
    });

    return res.status(201).json({ data: completedSale });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

export async function listSales(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (!Number.isSafeInteger(page) || page < 1 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw httpError(400, 'INVALID_PAGINATION', 'page must be positive and limit must be between 1 and 100.');
    }

    const [sales, total] = await Promise.all([
      Sale.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Sale.countDocuments()
    ]);

    return res.json({
      data: sales,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}
