import express from 'express';
import { 
  enhanceSummary, 
  enhanceBullets, 
  calculateAts, 
  oneClickGenerate,
  matchJobDescription,
  generateCoverLetter,
  generateInterviewPrep,
  parseResumeText
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/enhance-summary', enhanceSummary);
router.post('/enhance-bullets', enhanceBullets);
router.post('/calculate-ats', calculateAts);
router.post('/generate-full', oneClickGenerate);
router.post('/match-jd', matchJobDescription);
router.post('/generate-cover-letter', generateCoverLetter);
router.post('/interview-prep', generateInterviewPrep);
router.post('/parse-resume', parseResumeText);

export default router;
