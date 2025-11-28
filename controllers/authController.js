const User = require('../models/User');
const jwt = require('jsonwebtoken'); // To generate JWT token

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

async function register(req, res) {
  try {
    // Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check existing email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    // Create access token (shorter) OR create long-lived token if you want
    const payload = { userId: user._id, role: user.role };
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';

    // Example: 1 hour access token
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    // Save token and its expiry to user doc (whitelist)
    // We can calculate expiry date from `exp` in token or from now + 1h
    const decoded = jwt.decode(token); // { iat, exp, ... }
    const tokenExpires = decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 3600 * 1000);

    user.token = token;
    user.tokenExpires = tokenExpires;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: `Bearer ${token}`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}



async function logout(req, res) {
  try {
    // No server session — just send success
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove your token on the client side.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
}



module.exports = {
  login,
  logout,
  register
};
