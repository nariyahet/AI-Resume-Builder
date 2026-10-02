import express from 'express';
import { 
  getCoverLetters, 
  saveCoverLetter, 
  deleteCoverLetter 
} from '../controllers/coverLetterController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, getCoverLetters);
router.post('/', optionalAuthMiddleware, saveCoverLetter);
router.delete('/:id', optionalAuthMiddleware, deleteCoverLetter);

export default router;
