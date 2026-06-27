const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWhatsAppStatus, sendTestMessage } = require('../controllers/whatsappController');

router.get('/status', auth, getWhatsAppStatus);
router.post('/send', auth, sendTestMessage);

module.exports = router;
