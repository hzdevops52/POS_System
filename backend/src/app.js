import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createSessionMiddleware } from './config/session.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import saleRoutes from './routes/sale.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import returnRoutes from './routes/return.routes.js';
import reportRoutes from './routes/report.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import userRoutes from './routes/user.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));

// Session middleware must run before authentication routes.
app.use(createSessionMiddleware());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'hz-retail-pos-api',
    timestamp: new Date().toISOString()
  });
});

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
});

app.use((err, _req, res, _next) => {
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    let message = 'A record with this unique value already exists.';

    if (fields.includes('name')) {
      message = 'A category with this name already exists.';
    } else if (fields.includes('sku') || fields.includes('barcode')) {
      message = 'SKU or barcode already exists.';
    } else if (fields.includes('email')) {
      message = 'A user with this email already exists.';
    }

    return res.status(409).json({
      error: { code: 'DUPLICATE_VALUE', message }
    });
  }

  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The supplied data is invalid.'
      }
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
});

export default app;
