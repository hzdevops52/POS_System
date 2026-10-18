import { Router } from 'express';
import express from 'express';
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct
} from '../controllers/product.controller.js';
import { importProducts } from '../controllers/product-import.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(listProducts)
  .post(requireRole('admin', 'manager'), createProduct);

router.post('/import', requireRole('admin', 'manager'), express.text({ type: 'text/csv', limit: '80kb' }), importProducts);

router.route('/:id')
  .get(getProduct)
  .patch(requireRole('admin', 'manager'), updateProduct);

export default router;
