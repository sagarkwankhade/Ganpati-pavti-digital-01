require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register your donations router
const donationRoutes = require('./routes/donations');
app.use('/donations', donationRoutes);

// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch(err => console.error(" DB Connection Error:", err));
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});