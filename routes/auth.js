// routes/auth.js

var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const isAuthenticated = require("../middleware/isAuthenticated.js");
const User = require("../models/User");
const BankUser = require("../models/BankUser");


const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const saltRounds = 10;


router.post("/signup", (req, res, next) => {
  const { email, password, card_number } = req.body;

  console.log("Signup request received. Request body:", req.body);

  if (!email || !password || !card_number) {
    res.status(400).json({ message: "Please provide email, password, and card number." });
    return;
  }

  BankUser.findOne({ email })
    .then((foundUserByEmail) => {
      if (foundUserByEmail) {
        res.status(400).json({ message: "Email already registered." });
        return;
      }

      BankUser.findOne({ card_number })
        .then((foundUserByCardNumber) => {
          if (foundUserByCardNumber) {
            res.status(400).json({ message: "Card number already registered." });
            return;
          }

          const salt = bcrypt.genSaltSync(saltRounds);
          const hashedPassword = bcrypt.hashSync(password, salt);

          BankUser.create({ email, password: hashedPassword, card_number })
            .then((createdUser) => {
              const { email, _id, card_number } = createdUser;
              const payload = { email, _id, card_number };

              const authToken = jwt.sign(payload, process.env.SECRET, {
                algorithm: "HS256",
                expiresIn: "6h",
              });

              res.status(200).json({ authToken });
            })
            .catch((err) => {
              console.log(err); // Log the error for debugging
              res.status(500).json({ message: "Internal Server Error" });
            });
        })
        .catch((err) => {
          console.log(err); // Log the error for debugging
          res.status(500).json({ message: "Internal Server Error" });
        });
    })
    .catch((err) => {
      console.log(err); // Log the error for debugging
      res.status(500).json({ message: "Internal Server Error" });
    });
});


router.post("/login", (req, res, next) => {
  const { identifier, password } = req.body;
  console.log("Login Request Body:", req.body);

  if (!identifier || !password) {
    console.log("Missing credentials");
    res.status(400).json({ message: "Please provide email/card number and password." });
    return;
  }

  console.log(`Attempting to find user by identifier: ${identifier}`);
  BankUser.findOne({ 
    $or: [{ email: identifier }, { card_number: identifier }] 
  })
  .then((foundUser) => {
    if (!foundUser) {
      console.log(`User not found with identifier: ${identifier}`);
      res.status(401).json({ message: "User not found." });
      return;
    }

    console.log(`User found. Verifying password for user: ${foundUser.email}`);
    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

    if (passwordCorrect) {
      const { email, _id, card_number } = foundUser;
      console.log(`Password correct. Generating token for user: ${email}`);
      const payload = { email, _id, card_number }; 

      const authToken = jwt.sign(payload, process.env.SECRET, {
        algorithm: "HS256",
        expiresIn: "6h",
      });

      console.log(`Token generated for user: ${email}`);
      res.status(200).json({ authToken });
    } else {
      console.log(`Incorrect password for user: ${foundUser.email}`);
      res.status(401).json({ message: "Unable to authenticate the user" });
    }
  })
  .catch((err) => {
    console.error("Error in login process:", err);
    res.status(500).json({ message: "Internal Server Error" });
  });
});



router.post('/google-login', async (req, res, next) => {
    const { tokenId } = req.body;
  
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
  
      const { email, given_name, picture } = payload;
      console.log("User connected")
      const user = await User.findOneAndUpdate(
        { email },
        { email, given_name, picture },
        { new: true, upsert: true } // Creates a new user if it doesn't exist
      );
  
      const authToken = jwt.sign({ email: user.email, _id: user._id }, process.env.SECRET, {
        algorithm: "HS256",
        expiresIn: "6h",
      });
  
      res.status(200).json({ authToken });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

router.get("/verify", isAuthenticated, (req, res, next) => {
  res.status(200).json(req.user);
});



module.exports = router;

