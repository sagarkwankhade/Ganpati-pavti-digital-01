const express = require('express');
const router = express.Router();
const Donation = require('../db/Donation');
const Razorpay = require('razorpay');
const crypto = require('crypto');

function getRazorpayClient() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

// Dummy payment gateway create payment order
router.post('/create-payment', async (req, res) => {
  const { amount, receipt } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount is required' });

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // in paise
      currency: 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: { purpose: 'Donation' }
    });

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// Confirm payment and save donation
router.post('/confirm-payment', async (req, res) => {
  const { name, mobile, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!name || !mobile || !amount || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment info' });
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Save donation only after confirmed payment success
    const donation = new Donation({ name, mobile, amount });
    await donation.save();

    return res.status(201).json({
      id: donation._id,
      name: donation.name,
      mobile: donation.mobile,
      amount: donation.amount,
      date: donation.date,
      receiptUrl: `${process.env.BASE_URL}/donations/${donation._id}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get total amount of all donations
router.get('/total', async (_, res) => {
  try {
    const [{ total = 0 } = {}] = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
