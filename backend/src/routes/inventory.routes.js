import { Router } from 'express';
import {
  getInventorySummary,
  listInventoryMovements,
  receiveStock,
  adjustStock
} from '../controllers/inventory.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', requireRole('admin', 'manager', 'cashier'), getInventorySummary);
router.get('/movements', requireRole('admin', 'manager', 'cashier'), listInventoryMovements);
router.post('/receive', requireRole('admin', 'manager'), receiveStock);
router.post('/adjust', requireRole('admin', 'manager'), adjustStock);

export default router;
