const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['committee'],
    required: true
  },})


module.exports = mongoose.model('Donation', donationSchema);
module.exports = mongoose.model('committee', userSchema);
