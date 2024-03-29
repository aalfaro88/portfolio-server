// routes/bank.js

const express = require('express');
const router = express.Router();
const BankUser = require('../models/BankUser');
const isAuthenticated = require('../middleware/isAuthenticated')

// Transfer funds to another account
router.post('/transfer', isAuthenticated, async (req, res) => {
    const { recipientCardNumber, amount } = req.body;
    const senderUserId = req.user._id;
  
    try {
      const senderAccount = await BankUser.findById(senderUserId);
      const recipientAccount = await BankUser.findOne({ card_number: recipientCardNumber });
  
      if (!recipientAccount) {
        return res.status(404).json({ message: "Recipient account not found." });
      }
  
      if (senderAccount.funds < amount) {
        return res.status(400).json({ message: "Insufficient funds." });
      }
  
      // Update the accounts
      senderAccount.funds -= amount;
      recipientAccount.funds += amount;
  
      await senderAccount.save();
      await recipientAccount.save();
  
      // Send the updated funds of the sender in the response
      res.status(200).json({ 
        message: "Transfer successful.",
        funds: senderAccount.funds  // <-- Include the sender's updated funds here
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  

// Deposit funds to investment account
router.post('/deposit-to-investment', isAuthenticated, async (req, res) => {
    const { amount } = req.body;
    const userId = req.user._id; 
  
    try {
      const account = await BankUser.findById(userId);
      if (!account) {
        return res.status(404).json({ message: "Account not found." });
      }
  
      if (account.funds < amount) {
        return res.status(400).json({ message: "Insufficient funds." });
      }
  
      account.funds -= amount;
      account.investment_funds += amount;
      account.investment_timestamp = new Date();
  
      await account.save();
  
      res.status(200).json({ message: "Deposit successful.", funds: account.funds, investmentFunds: account.investment_funds });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

  
// Withdraw funds from investment account
router.post('/withdraw-from-investment', isAuthenticated, async (req, res) => {
    const { amount } = req.body; // The rounded amount to be withdrawn
    const userId = req.user._id;

    console.log(`Received amount to withdraw: ${amount}`); // Log received amount to withdraw

    try {
        const account = await BankUser.findById(userId);

        if (!account) {
            return res.status(404).json({ message: "Account not found." });
        }

        console.log(`Account investment funds before operation: ${account.investment_funds}`); // Log the investment funds before operation

        // Calculate the minutes elapsed since the last investment timestamp
        const now = new Date();
        const lastInvestmentTimestamp = new Date(account.investment_timestamp).getTime();
        const minutesElapsed = Math.floor((now.getTime() - lastInvestmentTimestamp) / (1000 * 60)); // Convert milliseconds to minutes

        const growthRatePerMinute = 0.05; // Define the growth rate per minute
        let currentTotalWithProfits = parseFloat((account.investment_funds * Math.pow(1 + growthRatePerMinute, minutesElapsed)).toFixed(2));

        if (currentTotalWithProfits >= 10000000) {
            // If profit exceeds or reaches the cap, transfer 10,000,000 to savings and reset investment funds
            account.funds += 10000000;
            account.investment_funds = 0;
        } else if (currentTotalWithProfits < amount) {
            console.log(`Error during withdrawal: Insufficient investment funds. Trying to withdraw ${amount}, but only ${currentTotalWithProfits} is available.`);
            return res.status(400).json({ message: "Insufficient investment funds." });
        } else {
            // Normal withdrawal operation
            account.investment_funds = currentTotalWithProfits - amount;
            account.funds += amount;
        }

        account.investment_timestamp = new Date();
        await account.save();

        console.log(`Account funds after operation: ${account.funds}`);
        console.log(`Account investment funds after operation: ${account.investment_funds}`);

        res.status(200).json({ message: "Operation successful.", funds: account.funds, investmentFunds: account.investment_funds });
    } catch (error) {
        console.log(`Error during operation: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/check-investment-cap', isAuthenticated, async (req, res) => {
    const userId = req.user._id;

    try {
        const account = await BankUser.findById(userId);

        if (!account) {
            return res.status(404).json({ message: "Account not found." });
        }

        // Calculate the current total with profit
        const now = new Date();
        const lastInvestmentTimestamp = new Date(account.investment_timestamp).getTime();
        const minutesElapsed = Math.floor((now.getTime() - lastInvestmentTimestamp) / (1000 * 60));
        const currentTotalWithProfits = parseFloat((account.investment_funds * Math.pow(1 + 0.05, minutesElapsed)).toFixed(2));

        // Check if the current total with profit exceeds the cap
        if (currentTotalWithProfits >= 10000000) {
            account.funds += 10000000; // Transfer the capped amount to savings
            account.investment_funds = 0; // Reset the investment funds to 0
            account.investment_timestamp = now; // Update the investment timestamp
            await account.save();

            res.status(200).json({ message: "Cap exceeded. Funds transferred to savings.", funds: account.funds, investmentFunds: account.investment_funds });
        } else {
            res.status(200).json({ message: "Cap not exceeded.", funds: account.funds, investmentFunds: account.investment_funds });
        }
    } catch (error) {
        console.log(`Error during operation: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



  // Update investment funds before withdrawal
router.post('/update-investment-funds', isAuthenticated, async (req, res) => {
    const { investmentFunds } = req.body; // The latest calculated investment funds value
    const userId = req.user._id; // Retrieved from the token after authentication
  
    try {
      const account = await BankUser.findById(userId);
  
      if (!account) {
        return res.status(404).json({ message: "Account not found." });
      }
  
      // Update the investment funds in the account
      const updatedInvestmentFunds = Math.min(investmentFunds, 10000000);
      account.investment_funds = updatedInvestmentFunds;
      await account.save();

      res.status(200).json({ message: "Investment funds updated successfully.", investmentFunds: account.investment_funds });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
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
      const userId = req.user._id; 
      const user = await BankUser.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Send user's current investment funds and the timestamp of the last investment
      res.status(200).json({ 
        investmentFunds: user.investment_funds,
        lastInvestmentTimestamp: user.investment_timestamp // Send this timestamp
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  
  

router.get('/funds/:cardNumber', async (req, res) => {
    try {
      const cardNumber = req.params.cardNumber;

      if (cardNumber !== '1234123412341234') {
        return res.status(403).json({ message: "Access forbidden." });
      }
  
      const user = await BankUser.findOne({ card_number: cardNumber });
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      res.status(200).json({ funds: user.funds });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  
module.exports = router;