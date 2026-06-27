const axios = require('axios');
const User = require('../models/User');
const WhatsAppRule = require('../models/WhatsAppRule');
const WhatsAppConnection = require('../models/WhatsAppConnection');

const normalizeText = (value = '') => value.toLowerCase().trim();

const greetingSynonyms = {
  hi: ['hello', 'hey', 'heya', 'hola', 'yo'],
  hello: ['hi', 'hey', 'heya', 'hola', 'yo'],
};

const isFuzzyMatch = (message, trigger) => {
  const normalizedMessage = normalizeText(message);
  const normalizedTrigger = normalizeText(trigger);

  if (!normalizedMessage || !normalizedTrigger) {
    return false;
  }

  if (normalizedMessage.includes(normalizedTrigger)) {
    return true;
  }

  const aliases = new Set([normalizedTrigger, ...(greetingSynonyms[normalizedTrigger] || [])]);
  for (const alias of aliases) {
    if (normalizedMessage.includes(alias)) {
      return true;
    }
  }

  return false;
};

exports.getReplyForIncomingMessage = async (user, incomingText, rules = []) => {
  const normalizedMessage = normalizeText(incomingText);
  const activeRules = (rules || []).filter((rule) => rule.active !== false);

  for (const rule of activeRules) {
    const normalizedTrigger = normalizeText(rule.trigger);
    if (!normalizedTrigger) continue;

    if (isFuzzyMatch(normalizedMessage, normalizedTrigger)) {
      return rule.response;
    }
  }

  return 'Thanks for your message! I will reply soon.';
};

exports.findConnectionForMessage = (payload = {}, connections = []) => {
  const metadata = payload?.entry?.[0]?.changes?.[0]?.value?.metadata || payload?.metadata || {};
  const phoneNumberId = metadata.phone_number_id || metadata.phoneNumberId;
  const displayPhoneNumber = metadata.display_phone_number || metadata.displayPhoneNumber;

  if (phoneNumberId) {
    const byPhoneNumberId = connections.find((connection) => connection.phoneNumberId === phoneNumberId);
    if (byPhoneNumberId) return byPhoneNumberId;
  }

  if (displayPhoneNumber) {
    const byDisplayNumber = connections.find((connection) => connection.whatsappNumber === displayPhoneNumber);
    if (byDisplayNumber) return byDisplayNumber;
  }

  const fallback = connections.find((connection) => connection.whatsappNumber);
  return fallback || null;
};

const getMetaConfig = (connection = null) => {
  const phoneNumberId = connection?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = connection?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_ACCESS_TOKEN;

  return { phoneNumberId, accessToken };
};

exports.sendMetaWhatsAppMessage = async (to, body, connection = null) => {
  const { phoneNumberId, accessToken } = getMetaConfig(connection);

  if (!phoneNumberId || !accessToken) {
    throw new Error('Meta WhatsApp credentials are not configured.');
  }

  return axios.post(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

exports.getWhatsAppStatus = (req, res) => {
  const configured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.META_WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_WHATSAPP_ACCESS_TOKEN
  );

  res.json({
    configured,
    message: configured
      ? 'Meta WhatsApp Cloud API integration is configured.'
      : 'Add Meta WhatsApp credentials to your environment to enable live message sending.',
  });
};

exports.sendTestMessage = async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Recipient number and message are required.' });
    }

    const { phoneNumberId, accessToken } = getMetaConfig();

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Meta WhatsApp integration is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN (or the META_WHATSAPP_* equivalents) in your environment first.',
      });
    }

    const response = await exports.sendMetaWhatsAppMessage(to, message);

    res.json({
      success: true,
      message: 'WhatsApp test message sent successfully.',
      status: response?.data?.messages?.[0]?.id ? 'sent' : 'queued',
      data: response.data,
    });
  } catch (error) {
    console.error('WhatsApp send error:', error.response?.data || error.message);
    res.status(502).json({
      success: false,
      message: 'Unable to send the WhatsApp message right now.',
      details: error.response?.data || error.message,
    });
  }
};

exports.connectWhatsApp = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user?.id;
    const { phoneNumberId, accessToken, whatsappNumber, webhookVerifyToken } = req.body;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ success: false, message: 'phoneNumberId and accessToken are required.' });
    }

    const connection = await WhatsAppConnection.findOneAndUpdate(
      { userId },
      {
        userId,
        phoneNumberId,
        accessToken,
        whatsappNumber,
        webhookVerifyToken: webhookVerifyToken || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN,
      },
      { new: true, upsert: true }
    );

    if (whatsappNumber) {
      await User.findByIdAndUpdate(userId, { whatsappNumber }, { new: true });
    }

    res.json({ success: true, message: 'WhatsApp connection saved.', connection });
  } catch (error) {
    console.error('WhatsApp connect error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to save WhatsApp connection.' });
  }
};

exports.getWhatsAppConnection = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user?.id;
    const connection = await WhatsAppConnection.findOne({ userId }).select('-accessToken');
    res.json({ success: true, connection });
  } catch (error) {
    console.error('WhatsApp connection fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to fetch WhatsApp connection.' });
  }
};

exports.createRule = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user?.id;
    const { trigger, response } = req.body;

    if (!trigger || !response) {
      return res.status(400).json({ success: false, message: 'trigger and response are required.' });
    }

    const rule = await WhatsAppRule.create({ userId, trigger, response });
    res.status(201).json({ success: true, rule });
  } catch (error) {
    console.error('Rule create error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to create rule.' });
  }
};

exports.listRules = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user?.id;
    const rules = await WhatsAppRule.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Rule list error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to load rules.' });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user?.id;
    const { id } = req.params;
    await WhatsAppRule.findOneAndDelete({ _id: id, userId });
    res.json({ success: true, message: 'Rule removed.' });
  } catch (error) {
    console.error('Rule delete error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to delete rule.' });
  }
};

exports.handleWebhookVerify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || 'meta-whatsapp-verify';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

exports.receiveWebhook = async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages || [];

    if (!messages.length) {
      return res.sendStatus(200);
    }

    const connections = await WhatsAppConnection.find({}).lean();

    for (const message of messages) {
      const senderId = message?.from;
      const incomingText = message?.text?.body || message?.caption || '';

      if (!senderId || !incomingText) {
        continue;
      }

      const connection = exports.findConnectionForMessage(req.body, connections);
      if (!connection) {
        continue;
      }

      const user = await User.findById(connection.userId);
      if (!user) {
        continue;
      }

      const rules = await WhatsAppRule.find({ userId: connection.userId, active: true });
      const replyText = await exports.getReplyForIncomingMessage(user, incomingText, rules);

      await exports.sendMetaWhatsAppMessage(senderId, replyText, connection);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook receive error:', error.message);
    return res.sendStatus(500);
  }
};
