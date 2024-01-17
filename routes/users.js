const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import your User model
const isAuthenticated = require('../middleware/isAuthenticated'); // Import isAuthenticated middleware

// GET route to check if a user has a username
router.get('/check-username', isAuthenticated, async (req, res) => {
  try {
    // Find the user by their ID (assuming you have access to the user's ID through authentication)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user has a username
    if (user.username) {
      return res.status(200).json({ hasUsername: true, username: user.username });
    } else {
      return res.status(200).json({ hasUsername: false });
    }
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'An error occurred while checking the username' });
  }
});

// POST route to add a username (similar to your existing code)
router.post('/add-username', isAuthenticated, async (req, res) => {
  const { username } = req.body;

  // Check if the username is already in use
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(400).json({ error: 'Username already in use' });
  }

  // Update the user's record with the new username
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { username }, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Username added successfully' });
  } catch (error) {
    console.error('Error adding username:', error);
    res.status(500).json({ error: 'An error occurred while adding the username' });
  }
});

module.exports = router;
