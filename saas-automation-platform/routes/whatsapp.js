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
  toggleRule,
  getAutomationSummary,
  getMessageLogs,
} = require('../controllers/whatsappController');

router.get('/status', auth, getWhatsAppStatus);
router.post('/send', auth, sendTestMessage);
router.post('/connect', auth, connectWhatsApp);
router.get('/connection', auth, getWhatsAppConnection);
router.post('/rules', auth, createRule);
router.get('/rules', auth, listRules);
router.patch('/rules/:id/toggle', auth, toggleRule);
router.delete('/rules/:id', auth, deleteRule);
router.get('/summary', auth, getAutomationSummary);
router.get('/messages', auth, getMessageLogs);

module.exports = router;
