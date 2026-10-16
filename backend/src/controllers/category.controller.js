import mongoose from 'mongoose';
import Category from '../models/category.model.js';
import { validateCategoryInput } from '../validators/category.validator.js';

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export async function createCategory(req, res, next) {
  try {
    const { errors, value } = validateCategoryInput(req.body);

    if (errors.length) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid category data.',
          details: errors
        }
      });
    }

    const category = await Category.create(value);
    return res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
}

export async function listCategories(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100
    ) {
      throw httpError(
        400,
        'INVALID_PAGINATION',
        'page must be positive and limit must be between 1 and 100.'
      );
    }

    const filter = {};

    if (req.query.status !== undefined) {
      if (!['active', 'inactive'].includes(req.query.status)) {
        throw httpError(
          400,
          'INVALID_STATUS',
          'status must be active or inactive.'
        );
      }

      filter.status = req.query.status;
    }

    if (req.query.search !== undefined) {
      const search = String(req.query.search).trim();

      if (search.length > 100) {
        throw httpError(
          400,
          'INVALID_SEARCH',
          'search cannot exceed 100 characters.'
        );
      }

      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
          { name: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } }
        ];
      }
    }

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Category.countDocuments(filter)
    ]);

    return res.json({
      data: categories,
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

export async function updateCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw httpError(400, 'INVALID_ID', 'Category ID is invalid.');
    }

    const { errors, value } = validateCategoryInput(req.body, {
      partial: true
    });

    if (errors.length || Object.keys(value).length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.length
            ? 'Invalid category data.'
            : 'Provide at least one valid field to update.',
          details: errors
        }
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!category) {
      throw httpError(404, 'CATEGORY_NOT_FOUND', 'Category was not found.');
    }

    return res.json({ data: category });
  } catch (error) {
    next(error);
  }
}
