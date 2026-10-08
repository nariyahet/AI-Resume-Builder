import express from 'express';
import { 
  getAdminMetrics, 
  updateProfile, 
  deleteAccount 
} from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/metrics', adminMiddleware, getAdminMetrics);
router.put('/profile', authMiddleware, updateProfile);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
