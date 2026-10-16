const allowedFields = new Set(['name', 'description', 'status']);

export function validateCategoryInput(body, { partial = false } = {}) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object.'], value: {} };
  }

  for (const key of Object.keys(body)) {
    if (!allowedFields.has(key)) errors.push(`Unknown field: ${key}`);
  }

  const value = {};

  if ('name' in body) {
    if (typeof body.name !== 'string') {
      errors.push('name must be a string.');
    } else {
      value.name = body.name.trim();

      if (value.name.length < 2 || value.name.length > 80) {
        errors.push('name must contain 2–80 characters.');
      }
    }
  }

  if ('description' in body) {
    if (typeof body.description !== 'string') {
      errors.push('description must be a string.');
    } else {
      value.description = body.description.trim();

      if (value.description.length > 500) {
        errors.push('description cannot exceed 500 characters.');
      }
    }
  }

  if ('status' in body) {
    if (!['active', 'inactive'].includes(body.status)) {
      errors.push('status must be active or inactive.');
    } else {
      value.status = body.status;
    }
  }

  if (!partial && (!value.name || errors.some((error) => error.startsWith('name ')))) {
    if (!value.name && !errors.some((error) => error === 'name is required.')) {
      errors.push('name is required.');
    }
  }

  return { errors, value };
}
