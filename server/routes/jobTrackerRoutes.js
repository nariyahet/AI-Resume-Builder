import express from 'express';
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication 
} from '../controllers/jobTrackerController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, getApplications);
router.post('/', optionalAuthMiddleware, createApplication);
router.put('/:id', optionalAuthMiddleware, updateApplication);
router.delete('/:id', optionalAuthMiddleware, deleteApplication);

export default router;
