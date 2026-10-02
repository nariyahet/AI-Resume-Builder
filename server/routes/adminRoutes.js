import express from 'express';
import { 
  getAdminMetrics, 
  updateProfile, 
  deleteAccount 
} from '../controllers/adminController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/metrics', getAdminMetrics);
router.put('/profile', optionalAuthMiddleware, updateProfile);
router.delete('/account', optionalAuthMiddleware, deleteAccount);

export default router;
