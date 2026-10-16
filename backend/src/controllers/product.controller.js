import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { validateProductInput } from '../validators/product.validator.js';

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export async function createProduct(req, res, next) {
  try {
    const { errors, value } = validateProductInput(req.body);
    if (errors.length) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid product data.', details: errors }
      });
    }

    const product = await Product.create(value);
    return res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (!Number.isSafeInteger(page) || page < 1 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw httpError(400, 'INVALID_PAGINATION', 'page must be positive and limit must be between 1 and 100.');
    }

    const filter = {};
    if (req.query.status !== undefined) {
      if (!['active', 'inactive'].includes(req.query.status)) {
        throw httpError(400, 'INVALID_STATUS', 'status must be active or inactive.');
      }
      filter.status = req.query.status;
    }

    if (req.query.category !== undefined) {
      const category = String(req.query.category).trim();
      if (!category || category.length > 80) {
        throw httpError(400, 'INVALID_CATEGORY', 'category filter must contain 1–80 characters.');
      }
      filter.category = category;
    }

    if (req.query.search !== undefined) {
      const search = String(req.query.search).trim();
      if (search.length > 100) {
        throw httpError(400, 'INVALID_SEARCH', 'search cannot exceed 100 characters.');
      }
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { name: { $regex: escaped, $options: 'i' } },
          { sku: { $regex: escaped, $options: 'i' } },
          { barcode: { $regex: escaped, $options: 'i' } }
        ];
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    return res.json({
      data: products,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw httpError(400, 'INVALID_ID', 'Product ID is invalid.');
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) throw httpError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.');

    return res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw httpError(400, 'INVALID_ID', 'Product ID is invalid.');
    }

    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'stockQty')) {
      throw httpError(
        400,
        'USE_INVENTORY_API',
        'Stock changes must use the inventory receive or adjust endpoints.'
      );
    }

    const { errors, value } = validateProductInput(req.body, { partial: true });
    if (errors.length || Object.keys(value).length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.length ? 'Invalid product data.' : 'Provide at least one valid field to update.',
          details: errors
        }
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!product) throw httpError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.');
    return res.json({ data: product });
  } catch (error) {
    next(error);
  }
}
