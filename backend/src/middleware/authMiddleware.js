const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET || 'batik-secret-key';

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau expired.' });
    }

    req.user = decoded;
    next();
  });
}

module.exports = { authenticateToken };