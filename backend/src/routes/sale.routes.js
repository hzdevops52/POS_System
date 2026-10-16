import { Router } from 'express';
import { createSale, listSales } from '../controllers/sale.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole('admin', 'manager'), listSales);
router.post('/', requireRole('admin', 'manager', 'cashier'), createSale);

export default router;
