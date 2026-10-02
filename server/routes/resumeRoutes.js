import express from 'express';
import { 
  saveResume, 
  getUserResumes, 
  getResumeById, 
  deleteResume, 
  cloneResume, 
  getPublicResume 
} from '../controllers/resumeController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuthMiddleware, saveResume);
router.get('/', authMiddleware, getUserResumes);
router.get('/public/:id', getPublicResume);
router.post('/clone/:id', authMiddleware, cloneResume);
router.get('/:id', getResumeById);
router.delete('/:id', authMiddleware, deleteResume);

export default router;
