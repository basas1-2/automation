const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  servicesSelected: [{
    type: String,
    enum: ['whatsapp', 'website-chatbot', 'instagram', 'tiktok'],
    required: true,
  }],
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Purchase', purchaseSchema);