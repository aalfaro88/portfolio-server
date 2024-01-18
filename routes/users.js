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


// POST route to update user's score if it's the highest
router.post('/update-score', isAuthenticated, async (req, res) => {
  const { score } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the current score is higher than the user's max_points
    if (score > user.max_points) {
      // Update the user's max_points and max_points_date
      user.max_points = score;
      user.max_points_date = new Date();
      await user.save();

      return res.status(200).json({ message: 'Score updated successfully' });
    }

    return res.status(200).json({ message: 'Score not updated' });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'An error occurred while updating the score' });
  }
});

// GET route to fetch top scores, usernames, and dates
router.get('/scores/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20; // Get the limit from the query parameter or use 20 as the default
    const topScores = await User.find({}, 'username max_points max_points_date')
      .sort({ max_points: -1, max_points_date: 1 })
      .limit(limit);
    
    return res.status(200).json(topScores);
  } catch (error) {
    console.error('Error fetching top scores:', error);
    res.status(500).json({ error: 'An error occurred while fetching top scores' });
  }
});



module.exports = router;
