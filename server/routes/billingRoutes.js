import express from 'express';
import { 
  getUsageAndBilling, 
  createCheckoutOrder, 
  verifyPayment 
} from '../controllers/billingController.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/usage', optionalAuthMiddleware, getUsageAndBilling);
router.post('/create-order', optionalAuthMiddleware, createCheckoutOrder);
router.post('/verify-payment', optionalAuthMiddleware, verifyPayment);

export default router;
