const mongoose = require('mongoose');

const whatsappConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  phoneNumberId: {
    type: String,
    trim: true,
  },
  accessToken: {
    type: String,
    trim: true,
  },
  whatsappNumber: {
    type: String,
    trim: true,
  },
  webhookVerifyToken: {
    type: String,
    trim: true,
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WhatsAppConnection', whatsappConnectionSchema);
