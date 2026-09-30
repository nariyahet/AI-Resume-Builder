import express from 'express';
import { enhanceSummary, enhanceBullets, calculateAts, oneClickGenerate } from '../controllers/aiController.js';

const router = express.Router();

router.post('/enhance-summary', enhanceSummary);
router.post('/enhance-bullets', enhanceBullets);
router.post('/calculate-ats', calculateAts);
router.post('/generate-full', oneClickGenerate);

export default router;
