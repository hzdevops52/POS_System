import Settings from '../models/settings.model.js';

const DEFAULTS = {
  key: 'store',
  storeName: 'HZ Retail',
  address: '',
  phone: '',
  email: '',
  currency: 'PKR',
  receiptFooter: 'Thank you for shopping with us!',
  showAddressOnReceipt: true,
  showContactOnReceipt: true,
  showFooterOnReceipt: true,
  taxEnabled: false,
  taxRate: 0
};

const TEXT_LIMITS = {
  storeName: 100,
  address: 300,
  phone: 40,
  email: 254,
  receiptFooter: 300
};

const BOOLEAN_FIELDS = [
  'showAddressOnReceipt',
  'showContactOnReceipt',
  'showFooterOnReceipt',
  'taxEnabled'
];

const ALLOWED_FIELDS = [
  ...Object.keys(TEXT_LIMITS),
  ...BOOLEAN_FIELDS,
  'currency',
  'taxRate'
];

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Provide a settings object.');
  }

  const unknown = Object.keys(body).filter(key => !ALLOWED_FIELDS.includes(key));
  if (unknown.length) {
    throw httpError(400, 'VALIDATION_ERROR',
      `Unsupported field(s): ${unknown.join(', ')}.`);
  }
  if (!Object.keys(body).length) {
    throw httpError(400, 'VALIDATION_ERROR', 'Provide at least one setting to update.');
  }

  const changes = {};

  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    if (!(field in body)) continue;
    if (typeof body[field] !== 'string') {
      throw httpError(400, 'VALIDATION_ERROR', `${field} must be text.`);
    }
    const value = body[field].trim();
    if (value.length > max || (field === 'storeName' && value.length < 2)) {
      throw httpError(400, 'VALIDATION_ERROR', `${field} has an invalid length.`);
    }
    changes[field] = value;
  }

  if ('email' in changes && changes.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Enter a valid store email address.');
  }

  for (const field of BOOLEAN_FIELDS) {
    if (!(field in body)) continue;
    if (typeof body[field] !== 'boolean') {
      throw httpError(400, 'VALIDATION_ERROR', `${field} must be true or false.`);
    }
    changes[field] = body[field];
  }

  if ('currency' in body) {
    if (body.currency !== 'PKR') {
      throw httpError(400, 'INVALID_CURRENCY', 'Only PKR is currently supported.');
    }
    changes.currency = body.currency;
  }

  if ('taxRate' in body) {
    if (typeof body.taxRate !== 'number' ||
        !Number.isFinite(body.taxRate) ||
        body.taxRate < 0 || body.taxRate > 100) {
      throw httpError(400, 'INVALID_TAX_RATE', 'Tax rate must be between 0 and 100.');
    }
    changes.taxRate = body.taxRate;
  }

  return changes;
}

async function getOrCreateSettings() {
  return Settings.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: DEFAULTS },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function getSettings(_req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    res.json({ data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const changes = validate(req.body);
    await getOrCreateSettings();
    const settings = await Settings.findOneAndUpdate(
      { key: 'store' },
      { $set: changes },
      { new: true, runValidators: true }
    ).lean();

    res.json({ data: settings });
  } catch (error) {
    next(error);
  }
}
