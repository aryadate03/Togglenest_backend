const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Base route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API endpoints',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me (Protected)'
    }
  });
});

// @route   POST /api/auth/register
router.post('/register', register);

// @route   POST /api/auth/login
router.post('/login', login);

// @route   GET /api/auth/me (Protected)
router.get('/me', protect, getMe);

module.exports = router;
