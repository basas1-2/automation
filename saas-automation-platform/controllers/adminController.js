const User = require('../models/User');
const Purchase = require('../models/Purchase');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('userId', 'email');
    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};