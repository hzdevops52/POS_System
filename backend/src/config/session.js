import session from 'express-session';
import MongoStore from 'connect-mongo';

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  const mongoUrl = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret || secret.length < 64) {
    throw new Error('SESSION_SECRET must contain at least 64 characters.');
  }

  if (!mongoUrl) {
    throw new Error('MONGODB_URI is not configured.');
  }

  return session({
    name: 'hzpos.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 8 * 60 * 60,
      autoRemove: 'native'
    }),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/'
    }
  });
}
