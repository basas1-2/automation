const axios = require('axios');

const normalizeText = (value = '') => String(value).toLowerCase().trim();

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

exports.normalizeText = normalizeText;

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

exports.canUseAutomation = (user = {}, purchases = []) => {
  if (!user) return false;

  const now = new Date();
  const trialActive = user.trialExpires && new Date(user.trialExpires) > now;

  if (trialActive) return true;

  return Boolean(purchases?.length);
};

exports.getMetaConfig = (connection = null) => {
  const phoneNumberId = connection?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = connection?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_ACCESS_TOKEN;

  return { phoneNumberId, accessToken };
};

exports.sendMetaWhatsAppMessage = async (to, body, connection = null) => {
  const { phoneNumberId, accessToken } = exports.getMetaConfig(connection);

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
