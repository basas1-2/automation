const express = require('express');
const router = express.Router();
const { getAllUsers, getAllPurchases } = require('../controllers/adminController');
const auth = require('../middleware/auth');

// For simplicity, assuming any logged-in user is admin. In production, add role check.
router.get('/users', auth, getAllUsers);
router.get('/purchases', auth, getAllPurchases);

module.exports = router;