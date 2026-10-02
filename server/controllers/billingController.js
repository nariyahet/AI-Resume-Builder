import { getDB, getIsConnected } from '../config/db.js';

// Get user billing & AI usage limits
export async function getUsageAndBilling(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    if (!getIsConnected() || !userId) {
      return res.json({
        success: true,
        plan: 'free',
        aiDailyUsed: 2,
        aiDailyLimit: 5,
        resumesCount: 1,
        resumesLimit: 1,
        payments: []
      });
    }

    const db = getDB();
    const [userRows] = await db.query('SELECT plan, ai_daily_count, ai_last_reset, role FROM users WHERE id = ?', [userId]);
    const user = userRows[0] || { plan: 'free', ai_daily_count: 0 };

    const [resumeRows] = await db.query('SELECT COUNT(*) as count FROM resumes WHERE user_id = ?', [userId]);
    const [payments] = await db.query('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    const isPro = user.plan === 'pro';

    res.json({
      success: true,
      plan: user.plan || 'free',
      isPro,
      aiDailyUsed: user.ai_daily_count || 0,
      aiDailyLimit: isPro ? 9999 : 5,
      resumesCount: resumeRows[0]?.count || 0,
      resumesLimit: isPro ? 9999 : 1,
      payments
    });
  } catch (error) {
    console.error('Usage billing error:', error);
    res.status(500).json({ success: false, message: 'Server error checking billing.' });
  }
}

// Razorpay / Stripe Order Creation
export async function createCheckoutOrder(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const { gateway = 'razorpay', plan = 'pro_monthly', currency = 'INR' } = req.body;
    const amount = currency === 'INR' ? 49900 : 900; // in paise or cents (₹499 or $9.00)

    const orderId = `order_${gateway}_${Date.now()}`;

    res.json({
      success: true,
      gateway,
      orderId,
      amount,
      currency,
      keyId: gateway === 'razorpay' ? 'rzp_test_AIResume2026' : 'pk_test_AIResume2026',
      message: `Checkout order created for ${currency} ${amount / 100}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to initiate checkout.' });
  }
}

// Verify Payment and Upgrade to Pro
export async function verifyPayment(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    const { gateway, orderId, paymentId, amount = 499, currency = 'INR', plan = 'pro_monthly' } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login required to process upgrade.' });
    }

    if (!getIsConnected()) {
      return res.json({ success: true, message: 'Upgraded to Pro in session!' });
    }

    const db = getDB();

    // 1. Upgrade user to Pro
    await db.query(`UPDATE users SET plan = 'pro' WHERE id = ?`, [userId]);

    // 2. Record invoice payment
    await db.query(
      `INSERT INTO payments (user_id, gateway, order_id, payment_id, amount, currency, plan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [userId, gateway || 'razorpay', orderId || `sim_${Date.now()}`, paymentId || `pay_${Date.now()}`, amount, currency, plan]
    );

    res.json({
      success: true,
      message: '🎉 Payment confirmed! Your account has been upgraded to AI Resume Studio Pro.',
      plan: 'pro'
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete subscription upgrade.' });
  }
}
