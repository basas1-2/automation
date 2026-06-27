const express = require('express');
const router = express.Router();
const { handleWebhookVerify, receiveWebhook } = require('../controllers/whatsappController');

router.get('/', handleWebhookVerify);
router.post('/', receiveWebhook);

module.exports = router;
