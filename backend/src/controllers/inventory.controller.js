import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import InventoryMovement from '../models/inventory-movement.model.js';

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw httpError(400, 'VALIDATION_ERROR', `${field} must be a string.`);
  }

  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw httpError(
      400,
      'VALIDATION_ERROR',
      `${field} must contain 1–${maxLength} characters.`
    );
  }
  return text;
}

function validateProductId(value) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw httpError(400, 'INVALID_ID', 'A valid productId is required.');
  }
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

export async function getInventorySummary(_req, res, next) {
  try {
    const [totalProducts, outOfStock, lowStock, units] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ stockQty: 0 }),
      Product.countDocuments({
        stockQty: { $gt: 0 },
        $expr: { $lte: ['$stockQty', '$lowStockThreshold'] }
      }),
      Product.aggregate([
        { $group: { _id: null, total: { $sum: '$stockQty' } } }
      ])
    ]);

    return res.json({
      data: {
        totalProducts,
        outOfStock,
        lowStock,
        totalUnits: units[0]?.total ?? 0
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listInventoryMovements(req, res, next) {
  try {
    const { page, limit } = validatePagination(req.query);
    const filter = {};

    if (req.query.productId !== undefined) {
      validateProductId(req.query.productId);
      filter.product = req.query.productId;
    }

    if (req.query.type !== undefined) {
      if (!['receive', 'adjustment', 'sale', 'return'].includes(req.query.type)) {
        throw httpError(
          400,
          'INVALID_TYPE',
          'type must be receive, adjustment, sale or return.'
        );
      }
      filter.type = req.query.type;
    }

    const [movements, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate('product', 'name sku category')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      InventoryMovement.countDocuments(filter)
    ]);

    return res.json({
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function changeStock(req, res, next, type) {
  const session = await mongoose.startSession();

  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw httpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
    }

    validateProductId(body.productId);

    if (!Number.isSafeInteger(body.quantity) || body.quantity <= 0) {
      throw httpError(
        400,
        'INVALID_QUANTITY',
        'quantity must be a positive safe integer.'
      );
    }

    const reason = type === 'adjustment'
      ? requiredText(body.reason, 'reason', 300)
      : (body.reason === undefined
          ? 'Stock received'
          : requiredText(body.reason, 'reason', 300));

    let reference = '';
    if (body.reference !== undefined) {
      if (typeof body.reference !== 'string' || body.reference.trim().length > 100) {
        throw httpError(
          400,
          'VALIDATION_ERROR',
          'reference must be a string of at most 100 characters.'
        );
      }
      reference = body.reference.trim();
    }

    let result;

    await session.withTransaction(async () => {
      const product = await Product.findById(body.productId).session(session);
      if (!product) {
        throw httpError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.');
      }

      const previousQty = product.stockQty;
      const quantityChange = type === 'receive'
        ? body.quantity
        : body.quantity;

      const newQty = type === 'receive'
        ? previousQty + quantityChange
        : body.direction === 'decrease'
          ? previousQty - quantityChange
          : body.direction === 'increase'
            ? previousQty + quantityChange
            : NaN;

      if (type === 'adjustment' &&
          !['increase', 'decrease'].includes(body.direction)) {
        throw httpError(
          400,
          'INVALID_DIRECTION',
          'direction must be increase or decrease.'
        );
      }

      if (!Number.isSafeInteger(newQty) || newQty < 0) {
        throw httpError(
          400,
          'INSUFFICIENT_STOCK',
          'The requested change would result in an invalid stock quantity.'
        );
      }

      const signedChange = newQty - previousQty;

      const update = await Product.updateOne(
        { _id: product._id, stockQty: previousQty },
        { $set: { stockQty: newQty } },
        { session, runValidators: true }
      );

      if (update.modifiedCount !== 1) {
        throw httpError(
          409,
          'STOCK_CONFLICT',
          'Stock changed concurrently. Please retry the operation.'
        );
      }

      const [movement] = await InventoryMovement.create([{
        product: product._id,
        type,
        quantityChange: signedChange,
        previousQty,
        newQty,
        reason,
        reference
      }], { session });

      result = {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          stockQty: newQty
        },
        movement
      };
    });

    return res.status(type === 'receive' ? 201 : 200).json({ data: result });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

export function receiveStock(req, res, next) {
  return changeStock(req, res, next, 'receive');
}

export function adjustStock(req, res, next) {
  return changeStock(req, res, next, 'adjustment');
}
