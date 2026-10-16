import User from '../models/user.model.js';

export async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Please log in to continue.'
        }
      });
    }

    const user = await User.findById(userId)
      .select('_id name email role status');

    if (!user || user.status !== 'active') {
      return req.session.destroy(() => {
        res.clearCookie('hzpos.sid', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/'
        });

        res.status(401).json({
          error: {
            code: 'SESSION_INVALID',
            message: 'Your session is no longer valid. Please log in again.'
          }
        });
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Please log in to continue.'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.'
        }
      });
    }

    next();
  };
}
