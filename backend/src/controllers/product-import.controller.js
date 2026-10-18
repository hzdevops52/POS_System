
import mongoose from 'mongoose';
import { parse } from 'csv-parse/sync';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import { validateProductInput } from '../validators/product.validator.js';

const MAX_ROWS = 1000;
const MAX_CSV_LENGTH = 80 * 1024;

const REQUIRED_COLUMNS = ['name', 'sku', 'category', 'price'];
const ALLOWED_COLUMNS = new Set([
  'name',
  'sku',
  'barcode',
  'category',
  'description',
  'price',
  'lowstockthreshold'
]);

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function normalizeCategory(name) {
  return name.trim().toLocaleLowerCase('en');
}

function parsePriceToPaisa(value) {
  const price = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(price)) {
    return null;
  }

  const [whole, fraction = ''] = price.split('.');
  const paisa = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

  return Number.isSafeInteger(paisa) ? paisa : null;
}

export async function importProducts(req, res, next) {
  try {
    const csv = typeof req.body === 'string'
      ? req.body
      : req.body?.csv;

    if (typeof csv !== 'string' || !csv.trim()) {
      throw httpError(
        400,
        'INVALID_CSV',
        'Provide the CSV contents in the csv field.'
      );
    }

    if (Buffer.byteLength(csv, 'utf8') > MAX_CSV_LENGTH) {
      throw httpError(
        413,
        'CSV_TOO_LARGE',
        'CSV content must not exceed 80 KB.'
      );
    }

    let rows;

    try {
      rows = parse(csv, {
        bom: true,
        columns: (headers) => {
          const normalized = headers.map((header) => header.trim());
          const names = normalized.map((header) => header.toLowerCase());

          if (new Set(names).size !== names.length) {
            throw new Error('CSV contains duplicate column names.');
          }

          return normalized;
        },
        skip_empty_lines: true,
        trim: true,
        max_record_size: 10000
      });
    } catch (error) {
      throw httpError(
        400,
        'INVALID_CSV',
        error.message || 'Could not parse CSV.'
      );
    }

    if (!rows.length) {
      throw httpError(400, 'EMPTY_CSV', 'CSV contains no product rows.');
    }

    if (rows.length > MAX_ROWS) {
      throw httpError(
        400,
        'TOO_MANY_ROWS',
        `Import no more than ${MAX_ROWS} products at a time.`
      );
    }

    const headers = Object.keys(rows[0]);
    const headerNames = headers.map((header) => header.toLowerCase());

    const missing = REQUIRED_COLUMNS.filter(
      (column) => !headerNames.includes(column)
    );

    const unknown = headers.filter(
      (header) => !ALLOWED_COLUMNS.has(header.toLowerCase())
    );

    if (missing.length || unknown.length) {
      throw httpError(
        400,
        'INVALID_COLUMNS',
        'CSV columns do not match the import format.',
      );
    }

    // Normalize header casing and reject ambiguous duplicate names.
    rows = rows.map((row) => {
      const normalized = {};

      for (const [key, value] of Object.entries(row)) {
        normalized[key.toLowerCase()] = value;
      }

      return normalized;
    });

    const errors = [];
    const products = [];
    const seenSkus = new Set();
    const seenBarcodes = new Set();
    const categoryNames = new Set();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;

      const sku = String(row.sku ?? '').trim().toUpperCase();
      const barcode = String(row.barcode ?? '').trim();
      const category = String(row.category ?? '').trim();
      const paisa = parsePriceToPaisa(String(row.price ?? ''));

      if (sku) {
        if (seenSkus.has(sku)) {
          errors.push(`Row ${rowNumber}: duplicate SKU "${sku}" in CSV.`);
        }
        seenSkus.add(sku);
      }

      if (barcode) {
        if (seenBarcodes.has(barcode)) {
          errors.push(
            `Row ${rowNumber}: duplicate barcode "${barcode}" in CSV.`
          );
        }
        seenBarcodes.add(barcode);
      }

      if (category) {
        categoryNames.add(category);
      }

      if (paisa === null) {
        errors.push(
          `Row ${rowNumber}: price must be a non-negative amount with at most two decimal places.`
        );
        continue;
      }

      const input = {
        name: String(row.name ?? ''),
        sku,
        category,
        pricePaisa: paisa
      };

      if (row.barcode !== undefined) input.barcode = barcode;
      if (row.description !== undefined) {
        input.description = String(row.description);
      }

      if (row.lowstockthreshold !== undefined &&
          row.lowstockthreshold !== '') {
        if (!/^\d+$/.test(row.lowstockthreshold)) {
          errors.push(
            `Row ${rowNumber}: lowStockThreshold must be a non-negative integer.`
          );
          continue;
        }

        const threshold = Number(row.lowstockthreshold);

        if (!Number.isSafeInteger(threshold)) {
          errors.push(
            `Row ${rowNumber}: lowStockThreshold is too large.`
          );
          continue;
        }

        input.lowStockThreshold = threshold;
      }

      const validation = validateProductInput(input);

      if (validation.errors.length) {
        errors.push(
          ...validation.errors.map(
            (message) => `Row ${rowNumber}: ${message}`
          )
        );
        continue;
      }

      products.push(validation.value);
    }

    // Validate all categories before writing any products.
    const categoryList = [...categoryNames];

    const categories = await Category.find({
      name: { $in: categoryList },
      status: 'active'
    })
      .collation({ locale: 'en', strength: 2 })
      .select('name')
      .lean();

    const activeCategories = new Set(
      categories.map((category) => normalizeCategory(category.name))
    );

    for (let index = 0; index < rows.length; index += 1) {
      const name = String(rows[index].category ?? '').trim();

      if (name && !activeCategories.has(normalizeCategory(name))) {
        errors.push(
          `Row ${index + 2}: category "${name}" does not exist or is inactive.`
        );
      }
    }

    // Check conflicts with products already in the database.
    const skus = [...seenSkus];
    const barcodes = [...seenBarcodes];

    const existing = await Product.find({
      $or: [
        { sku: { $in: skus } },
        ...(barcodes.length
          ? [{ barcode: { $in: barcodes } }]
          : [])
      ]
    })
      .select('sku barcode')
      .lean();

    const existingSkus = new Set(existing.map((product) => product.sku));
    const existingBarcodes = new Set(
      existing.map((product) => product.barcode).filter(Boolean)
    );

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const sku = String(row.sku ?? '').trim().toUpperCase();
      const barcode = String(row.barcode ?? '').trim();

      if (sku && existingSkus.has(sku)) {
        errors.push(`Row ${index + 2}: SKU "${sku}" already exists.`);
      }

      if (barcode && existingBarcodes.has(barcode)) {
        errors.push(
          `Row ${index + 2}: barcode "${barcode}" already exists.`
        );
      }
    }

    if (errors.length) {
      return res.status(400).json({
        error: {
          code: 'IMPORT_VALIDATION_FAILED',
          message: 'No products were imported. Correct the reported errors and retry.',
          details: errors
        }
      });
    }

    // Keep insertion atomic on the replica set used by this project.
    const session = await mongoose.startSession();
    let imported = 0;

    try {
      await session.withTransaction(async () => {
        const result = await Product.insertMany(products, {
          session,
          ordered: true
        });

        imported = result.length;
      });
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      data: {
        imported,
        message: `Successfully imported ${imported} products.`
      }
    });
  } catch (error) {
    next(error);
  }
}
