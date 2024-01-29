// routes/bank.js

const express = require('express');
const router = express.Router();
const BankUser = require('../models/BankUser');
const isAuthenticated = require('../middleware/isAuthenticated')

// Transfer funds to another account
router.post('/transfer', isAuthenticated, async (req, res) => {
  const { senderCardNumber, recipientCardNumber, amount } = req.body;

  try {
    const senderAccount = await BankUser.findOne({ card_number: senderCardNumber });
    const recipientAccount = await BankUser.findOne({ card_number: recipientCardNumber });

    if (!senderAccount || !recipientAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (senderAccount.funds < amount) {
      return res.status(400).json({ message: "Insufficient funds." });
    }

    // Deduct amount from sender and add to recipient
    senderAccount.funds -= amount;
    recipientAccount.funds += amount;

    await senderAccount.save();
    await recipientAccount.save();

    res.status(200).json({ message: "Transfer successful." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Deposit funds to investment account
router.post('/deposit-to-investment', isAuthenticated, async (req, res) => {
    const { cardNumber, amount } = req.body;
  
    try {
      const account = await BankUser.findOne({ card_number: cardNumber });
  
      if (!account) {
        return res.status(404).json({ message: "Account not found." });
      }
  
      if (account.funds < amount) {
        return res.status(400).json({ message: "Insufficient funds." });
      }
  
      account.funds -= amount;
      account.investment_funds += amount;
  
      await account.save();
  
      res.status(200).json({ message: "Deposit successful." });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
// Withdraw funds from investment account
router.post('/withdraw-from-investment', isAuthenticated, async (req, res) => {
    const { cardNumber, amount } = req.body;
  
    try {
      const account = await BankUser.findOne({ card_number: cardNumber });
  
      if (!account) {
        return res.status(404).json({ message: "Account not found." });
      }
  
      if (account.investment_funds < amount) {
        return res.status(400).json({ message: "Insufficient investment funds." });
      }
  
      account.investment_funds -= amount;
      account.funds += amount;
  
      await account.save();
  
      res.status(200).json({ message: "Withdrawal successful." });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // GET user's funds
router.get('/funds', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user._id; // Retrieved from the token after authentication
      const user = await BankUser.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      res.status(200).json({ funds: user.funds });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // GET user's investment funds
router.get('/investment-funds', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user._id; // Retrieved from the token after authentication
      const user = await BankUser.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      res.status(200).json({ investmentFunds: user.investment_funds });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  

  
module.exports = router;