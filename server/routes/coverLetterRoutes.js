import express from 'express';
import { 
  getCoverLetters, 
  saveCoverLetter, 
  deleteCoverLetter 
} from '../controllers/coverLetterController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getCoverLetters);
router.post('/', authMiddleware, saveCoverLetter);
router.delete('/:id', authMiddleware, deleteCoverLetter);

export default router;
