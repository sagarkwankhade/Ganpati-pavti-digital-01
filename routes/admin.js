const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



// Add Committee
exports.addcommittee = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create committee
    const committee = await User.create({
      name,
      email,
      password: hashed,
      role: 'committee'
    });

    res.status(201).json({ message: 'Committee added successfully', committee });
  } catch (err) {
    res.status(500).json({ message: 'Error adding committee', error: err.message });
  }
};

// Committee Login
exports.loginCommittee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find committee user
    const committee = await User.findOne({ email, role: 'committee' });
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, committee.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: committee._id, role: committee.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

//Get all donations 
module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check role access
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      req.user = decoded; // { id, role }
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token', error: err.message });
    }
  };
};