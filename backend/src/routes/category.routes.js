import { Router } from 'express';
import {
  createCategory,
  listCategories,
  updateCategory
} from '../controllers/category.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(listCategories)
  .post(requireRole('admin', 'manager'), createCategory);

router.route('/:id')
  .patch(requireRole('admin', 'manager'), updateCategory);

export default router;
