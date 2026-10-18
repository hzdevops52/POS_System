import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'manager', 'cashier'));
router.get('/summary', getDashboardSummary);

export default router;
