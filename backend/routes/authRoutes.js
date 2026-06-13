const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  verifyEmail,
  verifyOtp,
  resendOtp,
  resendVerification,
  forgotPassword,
  resetPassword,
  updateProfile,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect(true), getMe);
router.post('/refresh', protect(true), refreshToken);
router.post('/resend-verification', protect(true), resendVerification);
router.put('/profile', protect(), updateProfile);
router.delete('/account', protect(), deleteAccount);

module.exports = router;
