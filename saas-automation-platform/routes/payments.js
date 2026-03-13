const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment, getUserPurchases } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/initiate', auth, initiatePayment);
router.post('/verify', auth, verifyPayment);
router.get('/purchases', auth, getUserPurchases);

module.exports = router;