import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', getSettings);
router.patch('/', requireRole('admin'), updateSettings);

export default router;
