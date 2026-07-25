require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const supabase = require('../services/supabaseClient');

const router = express.Router();

// =====================================
// LOGIN ADMIN
// =====================================
router.post('/login', async (req, res) => {
  try {

    // =====================================
    // AMBIL DATA DARI BODY
    // =====================================
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    const password = (req.body?.password || '').toString();

    if (process.env.NODE_ENV !== 'production') {
      console.log('================================');
      try { console.log('LOGIN BODY:', { email: email, hasPassword: Boolean(password) }); } catch (e) {}
      console.log('================================');
    }

    // =====================================
    // VALIDASI INPUT
    // =====================================
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'batik-secret-key';

    // =====================================
    // CARI USER DI DATABASE
    // =====================================
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toString().trim().toLowerCase();
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let userData = null;
    let queryError = null;

    try {
      const response = await supabase
        .from('users')
        .select('id,email,password,role')
        .eq('email', email)
        .maybeSingle();
      userData = response.data;
      queryError = response.error;
    } catch (err) {
      queryError = err;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('================================');
      try { console.log('EMAIL LOGIN:', email); } catch (e) {}
      try { console.log('USER RESULT:', userData ? { id: userData.id, email: userData.email, role: userData.role } : null); } catch (e) {}
      try { console.log('QUERY ERROR:', queryError ? (queryError.message || String(queryError)) : null); } catch (e) {}
      console.log('================================');
    }

    // =====================================
    // JIKA QUERY GAGAL ATAU USER TIDAK ADA
    // fallback ke env admin credentials
    // =====================================
    if (queryError || !userData) {
      if (email === defaultAdminEmail && password === defaultAdminPassword) {
        const token = jwt.sign(
          {
            id: 'fallback-admin',
            email: defaultAdminEmail,
            role: 'admin'
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          success: true,
          message: 'Login berhasil',
          token,
          user: {
            id: 'fallback-admin',
            email: defaultAdminEmail,
            role: 'admin'
          }
        });
      }

      if (queryError) {
        console.error('AUTH ERROR:', queryError);
        return res.status(500).json({
          success: false,
          message: 'Server database error',
          error: queryError.message || String(queryError)
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // =====================================
    // VALIDASI ROLE ADMIN
    // =====================================
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bukan akun admin'
      });
    }

    // =====================================
    // CEK PASSWORD
    // =====================================
    let passwordMatch = false;
    if (userData.password) {
      passwordMatch = await bcrypt.compare(password, userData.password);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('================================');
      try { console.log('PASSWORD MATCH:', passwordMatch); } catch (e) {}
      console.log('================================');
    }

    // =====================================
    // PASSWORD SALAH
    // =====================================
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // =====================================
    // GENERATE JWT TOKEN
    // =====================================
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    // Do not log JWT token in any environment

    // =====================================
    // LOGIN BERHASIL
    // =====================================
    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role
      }
    });

  } catch (error) {

    console.error('AUTH LOGIN ERROR:', error.message || error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

// =====================================
// VERIFY TOKEN
// =====================================
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalid'
    });
  }
});

module.exports = router;
