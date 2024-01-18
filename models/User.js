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
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]*$/,
      default: undefined,
    },
    max_points: {
      type: Number,
      default: 0,
    },
    max_points_date: { 
      type: Date,
      default: null, 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('User', userSchema);
