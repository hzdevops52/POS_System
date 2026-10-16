import { Router } from 'express';
import {
  getInventorySummary,
  listInventoryMovements,
  receiveStock,
  adjustStock
} from '../controllers/inventory.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/summary', getInventorySummary);
router.get('/movements', listInventoryMovements);
router.post('/receive', receiveStock);
router.post('/adjust', adjustStock);

export default router;
