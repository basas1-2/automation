const axios = require('axios');
const Purchase = require('../models/Purchase');

const servicePrices = {
  whatsapp: 10000, // in kobo, 100 NGN
  'website-chatbot': 15000,
  instagram: 12000,
  tiktok: 13000,
};

exports.initiatePayment = async (req, res) => {
  try {
    const { services } = req.body;
    const userId = req.user.id;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: 'Services are required' });
    }

    const amount = services.reduce((total, service) => total + (servicePrices[service] || 0), 0);

    // Here you would integrate with Paystack to initialize payment
    // For now, we'll simulate it

    res.json({
      amount,
      services,
      message: 'Payment initiated',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference, services } = req.body;
    const userId = req.user.id;

    // Verify payment with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    if (response.data.data.status === 'success') {
      const purchase = new Purchase({
        userId,
        servicesSelected: services,
        amountPaid: response.data.data.amount,
        paymentReference: reference,
      });

      await purchase.save();

      res.json({ message: 'Payment verified and purchase saved' });
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserPurchases = async (req, res) => {
  try {
    const userId = req.user.id;
    const purchases = await Purchase.find({ userId }).populate('userId', 'email');
    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};