import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { createUser, listUsers, updateUser } from '../controllers/user.controller.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.route('/')
  .get(listUsers)
  .post(createUser);

router.route('/:id')
  .patch(updateUser);

export default router;
