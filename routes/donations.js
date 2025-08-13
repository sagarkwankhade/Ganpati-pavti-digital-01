const express = require('express');
const router = express.Router();
const Donation = require('../db/Donation');

// Dummy payment gateway create payment order
router.post('/create-payment', async (req, res) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount is required' });

    // In real use: call payment gateway API here, get payment order/session id
    const paymentOrder = {
      id: 'dummy_order_id_12345',
      amount,
      currency: 'INR'
    };

  try {
  

    res.json(paymentOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm payment and save donation
router.post('/confirm-payment', async (req, res) => {
  const { name, mobile, amount, paymentId, paymentStatus } = req.body;

  if (!name || !mobile || !amount || !paymentId || !paymentStatus) {
    return res.status(400).json({ error: 'Missing required payment info' });
  }

  if (paymentStatus !== 'success') {
    return res.status(400).json({ error: 'Payment not successful' });
  }

  try {
    // Save donation only after confirmed payment success
    const donation = new Donation({ name, mobile, amount });
    await donation.save();

    res.status(201).json({
      id: donation._id,
      name: donation.name,
      mobile: donation.mobile,
      amount: donation.amount,
      date: donation.date,
      receiptUrl: `${process.env.BASE_URL}/donations/${donation._id}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
