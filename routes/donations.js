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

// GET /donations - Only committee view list
router.get('/', async (req, res) => {
  const { role } = req.query; 

  if (role !== 'committee') {
      return res.status(403).json({ error: 'Access denied. Committee only.' });
  }

  try {
      const donations = await Donation.find().sort({ date: -1 });
      res.json(donations.map(d => ({
          id: d._id,
          name: d.name,
          mobile: d.mobile,
          amount: d.amount,
          date: d.date
      })));
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// DELETE /donations/:id - Only committee can delete
router.delete('/:id', async (req, res) => {
  const { role } = req.query; 

  if (role !== 'committee') {
      return res.status(403).json({ error: 'Access denied. Committee only.' });
  }

  try {
      const d = await Donation.findByIdAndDelete(req.params.id);
      if (!d) return res.status(404).json({ error: 'Not found' });
      res.json({ success: "Deleted successfully", id: d._id });
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
});

module.exports = router;
