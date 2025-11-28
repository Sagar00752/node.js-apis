const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Find user and verify token matches stored whitelist
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    if (!user.token || user.token !== token) {
      // token mismatch => token revoked or user logged in elsewhere
      return res.status(401).json({ success: false, message: 'Token not recognized (please login again)' });
    }

    // Optional: check tokenExpires
    if (user.tokenExpires && new Date() > user.tokenExpires) {
      return res.status(401).json({ success: false, message: 'Token expired (please login again)' });
    }

    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    console.error('auth error', err);
    return res.status(500).json({ success: false, message: 'Auth error' });
  }
};
