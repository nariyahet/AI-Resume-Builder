import { getDB, getIsConnected } from '../config/db.js';

// Get user billing & AI usage limits (100% Free Plan for all users)
export async function getUsageAndBilling(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    if (!getIsConnected() || !userId) {
      return res.json({
        success: true,
        plan: 'free',
        isPro: true,
        allFeaturesFree: true,
        aiDailyUsed: 0,
        aiDailyLimit: 'Unlimited (100% Free)',
        resumesCount: 0,
        resumesLimit: 'Unlimited',
        payments: []
      });
    }

    const db = getDB();
    const [userRows] = await db.query('SELECT plan, ai_daily_count, ai_last_reset, role FROM users WHERE id = ?', [userId]);
    const user = userRows[0] || { plan: 'free', ai_daily_count: 0 };

    const [resumeRows] = await db.query('SELECT COUNT(*) as count FROM resumes WHERE user_id = ?', [userId]);
    const [payments] = await db.query('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    res.json({
      success: true,
      plan: 'free',
      isPro: true,
      allFeaturesFree: true,
      aiDailyUsed: user.ai_daily_count || 0,
      aiDailyLimit: 'Unlimited (100% Free)',
      resumesCount: resumeRows[0]?.count || 0,
      resumesLimit: 'Unlimited',
      payments: payments || []
    });
  } catch (error) {
    console.error('Usage billing error:', error);
    res.status(500).json({ success: false, message: 'Server error checking billing.' });
  }
}

// Order Creation Disabled (100% Free Product)
export async function createCheckoutOrder(req, res) {
  return res.json({
    success: false,
    allFeaturesFree: true,
    message: 'AI Resume Studio is 100% free for all users. No payment, credit card, or checkout is required.'
  });
}

// Payment Verification Disabled (All features are already unlocked)
export async function verifyPayment(req, res) {
  return res.json({
    success: false,
    allFeaturesFree: true,
    message: 'AI Resume Studio is 100% free for all users. All features are already unlocked.'
  });
}
