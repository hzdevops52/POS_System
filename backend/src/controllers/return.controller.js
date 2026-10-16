import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Sale from '../models/sale.model.js';
import Return from '../models/return.model.js';
import InventoryMovement from '../models/inventory-movement.model.js';

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function validatePagination(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw httpError(
      400,
      'INVALID_PAGINATION',
      'page must be positive and limit must be between 1 and 100.'
    );
  }

  return { page, limit };
}

export async function findSaleForReturn(req, res, next) {
  try {
    const receiptNumber = String(req.params.receiptNumber ?? '').trim();

    if (!receiptNumber || receiptNumber.length > 100) {
      throw httpError(400, 'INVALID_RECEIPT', 'Provide a valid receipt number.');
    }

    const sale = await Sale.findOne({ receiptNumber }).lean();

    if (!sale) {
      throw httpError(404, 'SALE_NOT_FOUND', 'No sale was found for that receipt number.');
    }

    const previousReturns = await Return.find({ sale: sale._id }).lean();
    const returnedByProduct = new Map();

    for (const record of previousReturns) {
      for (const item of record.items) {
        const id = String(item.product);
        const quantity = (returnedByProduct.get(id) || 0) + item.quantity;

        if (!Number.isSafeInteger(quantity)) {
          throw httpError(500, 'RETURN_DATA_INVALID', 'Returned quantities are invalid.');
        }

        returnedByProduct.set(id, quantity);
      }
    }

    const items = sale.items.map(item => {
      const returnedQuantity = returnedByProduct.get(String(item.product)) || 0;

      return {
        ...item,
        returnedQuantity,
        returnableQuantity: Math.max(0, item.quantity - returnedQuantity)
      };
    });

    return res.json({
      data: {
        ...sale,
        items,
        returnCount: previousReturns.length,
        fullyReturned: items.every(item => item.returnableQuantity === 0)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function findSalesByBarcode(req, res, next) {
  try {
    const barcode = String(req.params.barcode ?? '').trim();

    if (!barcode || barcode.length > 80) {
      throw httpError(400, 'INVALID_BARCODE', 'Provide a valid product barcode.');
    }

    const product = await Product.findOne({ barcode }).lean();

    if (!product) {
      throw httpError(404, 'PRODUCT_NOT_FOUND', 'No product was found for that barcode.');
    }

    const sales = await Sale.find({ 'items.product': product._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .lean();

    const candidates = [];

    for (const sale of sales) {
      const soldItem = sale.items.find(
        item => String(item.product) === String(product._id)
      );

      if (!soldItem) continue;

      const previousReturns = await Return.find({ sale: sale._id }).lean();
      const returnedQuantity = previousReturns.reduce(
        (total, record) => total + record.items.reduce(
          (sum, item) => sum +
            (String(item.product) === String(product._id) ? item.quantity : 0),
          0
        ),
        0
      );

      const returnableQuantity = Math.max(
        0,
        soldItem.quantity - returnedQuantity
      );

      if (returnableQuantity > 0) {
        candidates.push({
          saleId: sale._id,
          receiptNumber: sale.receiptNumber,
          createdAt: sale.createdAt,
          paymentMethod: sale.paymentMethod,
          product: {
            id: product._id,
            name: soldItem.name,
            sku: soldItem.sku,
            barcode,
            soldQuantity: soldItem.quantity,
            returnedQuantity,
            returnableQuantity
          }
        });
      }
    }

    return res.json({
      data: {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          barcode
        },
        candidates
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listReturns(req, res, next) {
  try {
    const { page, limit } = validatePagination(req.query);
    const [returns, total] = await Promise.all([
      Return.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Return.countDocuments()
    ]);

    return res.json({
      data: returns,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

function validateReturnInput(body) {
  const receiptNumber = typeof body?.receiptNumber === 'string'
    ? body.receiptNumber.trim()
    : '';
  const reason = typeof body?.reason === 'string'
    ? body.reason.trim()
    : '';
  const inputItems = body?.items;

  if (!receiptNumber || receiptNumber.length > 100) {
    throw httpError(400, 'INVALID_RECEIPT', 'Provide a valid receipt number.');
  }

  if (!reason || reason.length > 300) {
    throw httpError(400, 'INVALID_REASON', 'Return reason must contain 1–300 characters.');
  }

  if (!Array.isArray(inputItems) || inputItems.length < 1 || inputItems.length > 100) {
    throw httpError(400, 'INVALID_ITEMS', 'Provide between 1 and 100 return items.');
  }

  const quantities = new Map();

  for (const item of inputItems) {
    if (!item || !mongoose.isValidObjectId(item.productId) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw httpError(
        400,
        'INVALID_ITEM',
        'Each item needs a valid productId and a positive whole-number quantity.'
      );
    }

    const id = String(item.productId);
    const quantity = (quantities.get(id) || 0) + item.quantity;

    if (!Number.isSafeInteger(quantity)) {
      throw httpError(400, 'INVALID_QUANTITY', 'Combined return quantity is too large.');
    }

    quantities.set(id, quantity);
  }

  return { receiptNumber, reason, quantities };
}

export async function createReturn(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { receiptNumber, reason, quantities } = validateReturnInput(req.body);
    let completedReturn;

    await session.withTransaction(async () => {
      const sale = await Sale.findOne({ receiptNumber }).session(session);

      if (!sale) {
        throw httpError(404, 'SALE_NOT_FOUND', 'No sale was found for that receipt number.');
      }

      const revisionResult = await Sale.updateOne(
        { _id: sale._id, $or: [{ returnRevision: sale.returnRevision }, { returnRevision: { $exists: false } }] },
        { $inc: { returnRevision: 1 } },
        { session }
      );

      if (revisionResult.modifiedCount !== 1) {
        throw httpError(409, 'RETURN_CONFLICT', 'This receipt is being returned elsewhere. Retry the request.');
      }

      const previousReturns = await Return.find({ sale: sale._id }).session(session);
      const returnedByProduct = new Map();

      for (const record of previousReturns) {
        for (const item of record.items) {
          const id = String(item.product);
          returnedByProduct.set(id, (returnedByProduct.get(id) || 0) + item.quantity);
        }
      }

      const soldByProduct = new Map(
        sale.items.map(item => [String(item.product), item])
      );
      const returnItems = [];
      let totalRefundPaisa = 0;

      for (const [productId, quantity] of quantities) {
        const soldItem = soldByProduct.get(productId);
        const alreadyReturned = returnedByProduct.get(productId) || 0;

        if (!soldItem || quantity > soldItem.quantity - alreadyReturned) {
          throw httpError(
            409,
            'QUANTITY_NOT_RETURNABLE',
            `Requested quantity exceeds the remaining returnable quantity for product ${productId}.`
          );
        }

        const refundPaisa = soldItem.unitPricePaisa * quantity;

        if (!Number.isSafeInteger(refundPaisa) ||
            !Number.isSafeInteger(totalRefundPaisa + refundPaisa)) {
          throw httpError(400, 'REFUND_TOO_LARGE', 'Refund amount exceeds the supported amount.');
        }

        totalRefundPaisa += refundPaisa;
        returnItems.push({
          product: soldItem.product,
          name: soldItem.name,
          sku: soldItem.sku,
          quantity,
          unitPricePaisa: soldItem.unitPricePaisa,
          refundPaisa
        });
      }

      const movementRecords = [];

      for (const item of returnItems) {
        const product = await Product.findById(item.product).session(session);

        if (!product) {
          throw httpError(409, 'PRODUCT_NOT_FOUND', `Product ${item.sku} no longer exists.`);
        }

        const previousQty = product.stockQty;
        const newQty = previousQty + item.quantity;

        if (!Number.isSafeInteger(newQty)) {
          throw httpError(409, 'STOCK_LIMIT', `Stock limit would be exceeded for ${item.name}.`);
        }

        const result = await Product.updateOne(
          { _id: product._id, stockQty: previousQty },
          { $inc: { stockQty: item.quantity } },
          { session }
        );

        if (result.modifiedCount !== 1) {
          throw httpError(409, 'STOCK_CHANGED', `Stock changed for ${item.name}. Retry the return.`);
        }

        movementRecords.push({
          product: product._id,
          type: 'return',
          quantityChange: item.quantity,
          previousQty,
          newQty,
          reason,
          reference: receiptNumber
        });
      }

      await InventoryMovement.insertMany(movementRecords, { session });

      const [savedReturn] = await Return.create([{
        sale: sale._id,
        receiptNumber,
        items: returnItems,
        totalRefundPaisa,
        reason
      }], { session });

      completedReturn = savedReturn.toObject();
    });

    return res.status(201).json({ data: completedReturn });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}
