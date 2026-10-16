const allowedFields = new Set([
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
