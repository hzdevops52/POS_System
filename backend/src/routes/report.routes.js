import { Router } from 'express';
import { getReportSummary } from '../controllers/report.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'manager', 'cashier'));

router.get('/summary', getReportSummary);

export default router;
