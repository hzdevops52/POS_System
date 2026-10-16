import { Router } from 'express';
import {
  createReturn,
  findSaleForReturn,
  findSalesByBarcode,
  listReturns
} from '../controllers/return.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/barcode/:barcode', findSalesByBarcode);

router.get('/receipt/:receiptNumber', findSaleForReturn);
router.route('/').get(listReturns).post(createReturn);

export default router;
