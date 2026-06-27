const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getWhatsAppStatus,
  sendTestMessage,
  connectWhatsApp,
  getWhatsAppConnection,
  createRule,
  listRules,
  deleteRule,
} = require('../controllers/whatsappController');

router.get('/status', auth, getWhatsAppStatus);
router.post('/send', auth, sendTestMessage);
router.post('/connect', auth, connectWhatsApp);
router.get('/connection', auth, getWhatsAppConnection);
router.post('/rules', auth, createRule);
router.get('/rules', auth, listRules);
router.delete('/rules/:id', auth, deleteRule);

module.exports = router;
