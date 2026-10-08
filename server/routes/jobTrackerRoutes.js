import express from 'express';
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication 
} from '../controllers/jobTrackerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getApplications);
router.post('/', authMiddleware, createApplication);
router.put('/:id', authMiddleware, updateApplication);
router.delete('/:id', authMiddleware, deleteApplication);

export default router;
