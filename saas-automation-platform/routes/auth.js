const express = require('express');
const router = express.Router();
const { register, login, getUser } = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validation');
const auth = require('../middleware/auth');

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.get('/me', auth, getUser);

module.exports = router;