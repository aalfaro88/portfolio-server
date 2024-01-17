// server/models/user.js

const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    given_name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      minlength: 3, // Minimum length of 3 characters
      maxlength: 20, // Maximum length of 20 characters
      match: /^[a-zA-Z0-9_]*$/,
      default: undefined // Regular expression pattern for alphanumeric characters and underscores
    },
    max_points: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('User', userSchema);
