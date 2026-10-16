import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

const publicUser = user => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role
});

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => error ? reject(error) : resolve());
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save(error => error ? reject(error) : resolve());
  });
}

export async function login(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = typeof req.body?.password === 'string'
      ? req.body.password
      : '';

    if (!email || !password || password.length > 200) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Enter a valid email address and password.'
        }
      });
    }

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || user.status !== 'active' ||
        !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect.'
        }
      });
    }

    await regenerateSession(req);
    req.session.userId = user._id.toString();
    await saveSession(req);

    user.lastLoginAt = new Date();
    await user.save();

    return res.status(200).json({
      data: { user: publicUser(user) }
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res, next) {
  if (!req.session) {
    res.clearCookie('hzpos.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    return res.status(200).json({ data: { message: 'Logged out.' } });
  }

  req.session.destroy(error => {
    if (error) return next(error);

    res.clearCookie('hzpos.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    return res.status(200).json({
      data: { message: 'Logged out.' }
    });
  });
}

export function currentUser(req, res) {
  return res.status(200).json({
    data: { user: publicUser(req.user) }
  });
}
