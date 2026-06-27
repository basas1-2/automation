const axios = require('axios');

exports.getWhatsAppStatus = (req, res) => {
  const configured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );

  res.json({
    configured,
    message: configured
      ? 'WhatsApp integration is configured.'
      : 'Add Twilio WhatsApp credentials to your environment to enable live message sending.',
  });
};

exports.sendTestMessage = async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Recipient number and message are required.' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp integration is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in your environment first.',
      });
    }

    const normalizedTo = /^\+/.test(to) ? to : `+${to}`;
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: `whatsapp:${normalizedTo}`,
        From: `whatsapp:${fromNumber}`,
        Body: message,
      }),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    res.json({
      success: true,
      message: 'WhatsApp test message sent successfully.',
      sid: response.data.sid,
      status: response.data.status,
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
