#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

python3 <<'PY'
from pathlib import Path
from datetime import datetime
import shutil

app_path = Path("backend/src/app.js")
app = app_path.read_text()

if "productRoutes" not in app and "app.use('/api/v1/products'" in app:
    raise SystemExit("Unexpected partial Products API registration.")

if "productRoutes" not in app:
    if "app.get('/api/v1/health'" not in app or "app.use((_req, res) =>" not in app:
        raise SystemExit("Unexpected app.js structure; refusing to patch.")
    app = app.replace(
        "import helmet from 'helmet';",
        "import helmet from 'helmet';\nimport productRoutes from './routes/product.routes.js';",
        1
    )
    app = app.replace(
        "app.get('/api/v1/health'",
        "app.use('/api/v1/products', productRoutes);\n\napp.get('/api/v1/health'",
        1
    )

    old_error = """app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.'
    }
  });
});"""

    new_error = """app.use((err, _req, res, _next) => {
  if (err?.code === 11000) {
    return res.status(409).json({
      error: { code: 'DUPLICATE_VALUE', message: 'SKU or barcode already exists.' }
    });
  }

  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'The supplied data is invalid.' }
    });
  }

  console.error(err);
  return res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.status && err.status < 500
        ? err.message
        : 'An unexpected server error occurred.'
    }
  });
});"""

    if old_error not in app:
        raise SystemExit("Could not locate the existing error handler; refusing to patch.")
    app = app.replace(old_error, new_error, 1)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
if app != app_path.read_text():
    backup = app_path.with_name(app_path.name + f".bak-{stamp}")
    shutil.copy2(app_path, backup)
    app_path.write_text(app)
    print(f"Updated {app_path}; backup: {backup}")

files = {
"backend/src/models/product.model.js": r"""import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true, minlength: 2, maxlength: 120
  },
  sku: {
    type: String, required: true, trim: true, uppercase: true,
    minlength: 2, maxlength: 40, match: /^[A-Z0-9_-]+$/
  },
  barcode: {
    type: String, trim: true, default: undefined, maxlength: 80
  },
  category: {
    type: String, required: true, trim: true, maxlength: 80
  },
  description: {
    type: String, trim: true, default: '', maxlength: 1000
  },
  pricePaisa: {
    type: Number, required: true, min: 0,
    validate: {
      validator: Number.isSafeInteger,
      message: 'pricePaisa must be a safe integer.'
    }
  },
  stockQty: {
    type: Number, required: true, min: 0, default: 0,
    validate: {
      validator: Number.isSafeInteger,
      message: 'stockQty must be a non-negative integer.'
    }
  },
  lowStockThreshold: {
    type: Number, required: true, min: 0, default: 5,
    validate: {
      validator: Number.isSafeInteger,
      message: 'lowStockThreshold must be a non-negative integer.'
    }
  },
  status: {
    type: String, enum: ['active', 'inactive'], default: 'active'
  }
}, {
  timestamps: true,
  versionKey: false
});

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index(
  { barcode: 1 },
  { unique: true, sparse: true }
);
productSchema.index({ name: 1 });
productSchema.index({ category: 1, status: 1 });

export default mongoose.model('Product', productSchema);
""",

"backend/src/validators/product.validator.js": r"""const allowedFields = new Set([
  'name', 'sku', 'barcode', 'category', 'description',
  'pricePaisa', 'stockQty', 'lowStockThreshold', 'status'
]);

export function validateProductInput(body, { partial = false } = {}) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object.'], value: {} };
  }

  for (const key of Object.keys(body)) {
    if (!allowedFields.has(key)) errors.push(`Unknown field: ${key}`);
  }

  const value = {};

  for (const key of ['name', 'sku', 'barcode', 'category', 'description']) {
    if (!(key in body)) continue;
    if (typeof body[key] !== 'string') {
      errors.push(`${key} must be a string.`);
      continue;
    }

    const text = body[key].trim();
    if (key === 'sku') value.sku = text.toUpperCase();
    else if (key === 'barcode' && text === '') value.barcode = undefined;
    else value[key] = text;
  }

  for (const key of ['pricePaisa', 'stockQty', 'lowStockThreshold']) {
    if (!(key in body)) continue;
    const number = body[key];

    if (typeof number !== 'number' || !Number.isSafeInteger(number) || number < 0) {
      errors.push(`${key} must be a non-negative safe integer.`);
    } else {
      value[key] = number;
    }
  }

  if ('status' in body) {
    if (!['active', 'inactive'].includes(body.status)) {
      errors.push('status must be active or inactive.');
    } else {
      value.status = body.status;
    }
  }

  if (!partial) {
    for (const key of ['name', 'sku', 'category', 'pricePaisa']) {
      if (!(key in value) || value[key] === '') {
        errors.push(`${key} is required.`);
      }
    }
  }

  if ('name' in value && (value.name.length < 2 || value.name.length > 120))
    errors.push('name must contain 2 to 120 characters.');
  if ('sku' in value && !/^[A-Z0-9_-]{2,40}$/.test(value.sku))
    errors.push('sku must be 2–40 characters using letters, numbers, underscores or hyphens.');
  if ('barcode' in value && value.barcode !== undefined && (value.barcode.length < 1 || value.barcode.length > 80))
    errors.push('barcode must contain at most 80 characters.');
  if ('category' in value && (value.category.length < 1 || value.category.length > 80))
    errors.push('category must contain 1–80 characters.');
  if ('description' in value && value.description.length > 1000)
    errors.push('description cannot exceed 1000 characters.');

  return { errors, value };
}
""",

"backend/src/controllers/product.controller.js": r"""import mongoose from 'mongoose';
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
""",

"backend/src/routes/product.routes.js": r"""import { Router } from 'express';
import {
  createProduct, listProducts, getProduct, updateProduct
} from '../controllers/product.controller.js';

const router = Router();

router.route('/')
  .get(listProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .patch(updateProduct);

export default router;
"""
}

for name, content in files.items():
    path = Path(name)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if path.read_text() == content:
            print(f"Unchanged: {path}")
            continue
        backup = path.with_name(path.name + f".bak-{stamp}")
        shutil.copy2(path, backup)
        print(f"Backup: {backup}")
    path.write_text(content)
    print(f"Wrote: {path}")

app_path.write_text(app)
PY

printf '\n%s\n' '--- Backend syntax checks ---'
npm --prefix backend run check
node --check backend/src/models/product.model.js
node --check backend/src/validators/product.validator.js
node --check backend/src/controllers/product.controller.js
node --check backend/src/routes/product.routes.js

printf '\n%s\n' '--- API route registration ---'
grep -n "productRoutes\|api/v1/products" backend/src/app.js

printf '\n%s\n' 'Products API files created and syntax checks passed.'
