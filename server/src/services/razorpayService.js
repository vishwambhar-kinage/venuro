import crypto from 'crypto';

/**
 * Razorpay Service — Venuro Platform
 *
 * Handles:
 * - Order creation (real Razorpay or simulation)
 * - Payment signature verification (HMAC-SHA256)
 * - Refund initiation
 *
 * Test card: 4111 1111 1111 1111 | CVV: any | Expiry: any future date
 * Get test keys: razorpay.com → Dashboard → Settings → API Keys
 *
 * When RAZORPAY_KEY_ID is not set, ALL operations run in simulation mode.
 * Simulation mode is perfect for demos and interviews.
 */

let razorpay = null;
let razorpayReady = false;

const initRazorpay = async () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || keyId.includes('rzp_test_your') || !keySecret) {
    console.log('⚠️  [Razorpay] Keys not configured — running in Simulation mode');
    console.log('     → Add RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET to server/.env');
    console.log('     → Get free test keys at razorpay.com');
    return;
  }

  try {
    const { default: Razorpay } = await import('razorpay');
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    razorpayReady = true;
    console.log('💳 [Razorpay] Payment gateway connected (Test mode)!');
  } catch (err) {
    console.log(`⚠️  [Razorpay] Init failed: ${err.message} — using simulation`);
  }
};

initRazorpay();

export const isRazorpayReady = () => razorpayReady;

/**
 * Create a Razorpay order (or simulated order)
 * @param {number} amount - Amount in INR (we convert to paise internally)
 * @param {string} receipt - Unique receipt ID
 * @param {object} notes - Extra metadata
 */
export const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  if (!razorpayReady || !razorpay) {
    // Simulation mode — return a fake order that looks real
    return {
      id: `order_sim_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      status: 'created',
      notes,
      simulated: true,
    };
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert ₹ to paise
    currency: 'INR',
    receipt,
    notes,
  });
  return order;
};

/**
 * Verify Razorpay payment signature
 * This is critical for security — prevents fake payment confirmations
 *
 * How it works (interview answer):
 * Razorpay signs: HMAC-SHA256(orderId + "|" + paymentId, keySecret)
 * We compute the same and compare. If they match, payment is genuine.
 */
export const verifyRazorpaySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  // In simulation mode, always return true
  if (!razorpayReady || !process.env.RAZORPAY_KEY_SECRET) return true;

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

/**
 * Initiate a refund via Razorpay
 */
export const initiateRefund = async (paymentId, amount) => {
  if (!razorpayReady || !razorpay) {
    // Simulation
    return {
      id: `refund_sim_${Date.now()}`,
      payment_id: paymentId,
      amount: Math.round(amount * 100),
      status: 'processed',
      simulated: true,
    };
  }

  return razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    speed: 'normal',
    notes: { reason: 'Customer requested cancellation via Venuro' },
  });
};
