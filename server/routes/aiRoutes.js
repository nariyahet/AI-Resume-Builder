import express from 'express';
import {
  enhanceSummary,
  enhanceBullets,
  calculateAts,
  oneClickGenerate,
  matchJobDescription,
  generateCoverLetter,
  generateInterviewPrep,
  parseResumeText,
  evaluateInterview
} from '../controllers/aiController.js';
import { uploadMiddleware, uploadAndParseResume } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/enhance-summary', enhanceSummary);
router.post('/enhance-bullets', enhanceBullets);
router.post('/calculate-ats', calculateAts);
router.post('/generate-full', oneClickGenerate);
router.post('/match-jd', matchJobDescription);
router.post('/generate-cover-letter', generateCoverLetter);
router.post('/interview-prep', generateInterviewPrep);
router.post('/parse-resume', parseResumeText);
router.post('/evaluate-interview', evaluateInterview);

// 🔴 Real PDF & DOCX File Upload & Parser Endpoint
router.post('/upload-parse', uploadMiddleware, uploadAndParseResume);

export default router;
