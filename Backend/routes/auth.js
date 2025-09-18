const express = require('express');
const {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;