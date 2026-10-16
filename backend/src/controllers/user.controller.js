import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

const ROLES = ['admin', 'manager', 'cashier'];
const STATUSES = ['active', 'inactive'];
const SAFE_FIELDS = '_id name email role status lastLoginAt createdAt updatedAt';

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function safeUser(user) {
  const result = user.toObject ? user.toObject() : user;
  delete result.passwordHash;
  return result;
}

function validateText(value, field, min, max) {
  if (typeof value !== 'string') {
    throw httpError(400, 'VALIDATION_ERROR', `${field} must be text.`);
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw httpError(400, 'VALIDATION_ERROR',
      `${field} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function validateEmail(value) {
  const email = validateText(value, 'Email', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Enter a valid email address.');
  }
  return email;
}

function validateRole(value) {
  if (!ROLES.includes(value)) {
    throw httpError(400, 'INVALID_ROLE', 'Role must be admin, manager, or cashier.');
  }
  return value;
}

function validateStatus(value) {
  if (!STATUSES.includes(value)) {
    throw httpError(400, 'INVALID_STATUS', 'Status must be active or inactive.');
  }
  return value;
}

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body).filter(key => !allowed.includes(key));
  if (unknown.length) {
    throw httpError(400, 'VALIDATION_ERROR',
      `Unsupported field(s): ${unknown.join(', ')}.`);
  }
}

export async function listUsers(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (!Number.isSafeInteger(page) || page < 1 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw httpError(400, 'INVALID_PAGINATION',
        'page must be positive and limit must be between 1 and 100.');
    }

    const filter = {};

    if (req.query.role !== undefined) {
      filter.role = validateRole(req.query.role);
    }
    if (req.query.status !== undefined) {
      filter.status = validateStatus(req.query.status);
    }
    if (req.query.search !== undefined) {
      const search = String(req.query.search).trim();
      if (search.length > 100) {
        throw httpError(400, 'INVALID_SEARCH', 'Search cannot exceed 100 characters.');
      }
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { name: { $regex: escaped, $options: 'i' } },
          { email: { $regex: escaped, $options: 'i' } }
        ];
      }
    }

    const [users, total] = await Promise.all([
      User.find(filter).select(SAFE_FIELDS)
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    rejectUnknownFields(req.body, ['name', 'email', 'password', 'role', 'status']);

    const name = validateText(req.body.name, 'Name', 2, 100);
    const email = validateEmail(req.body.email);
    const password = req.body.password;
    if (typeof password !== 'string' || password.length < 12 || password.length > 200) {
      throw httpError(400, 'INVALID_PASSWORD',
        'Password must be between 12 and 200 characters.');
    }

    const role = req.body.role === undefined ? 'cashier' : validateRole(req.body.role);
    const status = req.body.status === undefined ? 'active' : validateStatus(req.body.status);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role, status });

    res.status(201).json({ data: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw httpError(400, 'INVALID_ID', 'User ID is invalid.');
    }

    rejectUnknownFields(req.body, ['name', 'email', 'password', 'role', 'status']);
    const keys = Object.keys(req.body);
    if (!keys.length) {
      throw httpError(400, 'VALIDATION_ERROR', 'Provide at least one field to update.');
    }

    const target = await User.findById(req.params.id).select('+passwordHash');
    if (!target) {
      throw httpError(404, 'USER_NOT_FOUND', 'User was not found.');
    }

    if (String(target._id) === String(req.user._id) &&
        keys.some(key => key === 'role' || key === 'status')) {
      throw httpError(400, 'SELF_MODIFICATION_BLOCKED',
        'You cannot change your own role or account status.');
    }

    const changes = {};
    if ('name' in req.body) changes.name = validateText(req.body.name, 'Name', 2, 100);
    if ('email' in req.body) changes.email = validateEmail(req.body.email);
    if ('role' in req.body) changes.role = validateRole(req.body.role);
    if ('status' in req.body) changes.status = validateStatus(req.body.status);

    if ('password' in req.body) {
      const password = req.body.password;
      if (typeof password !== 'string' || password.length < 12 || password.length > 200) {
        throw httpError(400, 'INVALID_PASSWORD',
          'Password must be between 12 and 200 characters.');
      }
      changes.passwordHash = await bcrypt.hash(password, 12);
    }

    const remainsActiveAdmin =
      (changes.role ?? target.role) === 'admin' &&
      (changes.status ?? target.status) === 'active';

    if (target.role === 'admin' && target.status === 'active' && !remainsActiveAdmin) {
      const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
      if (activeAdmins <= 1) {
        throw httpError(409, 'LAST_ACTIVE_ADMIN',
          'The last active administrator cannot be demoted or deactivated.');
      }
    }

    Object.assign(target, changes);
    await target.save();

    const updated = await User.findById(target._id).select(SAFE_FIELDS).lean();
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
