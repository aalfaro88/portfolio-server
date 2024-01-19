const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs'); // Ensure you have bcryptjs installed for password encryption

const bankUserSchema = new Schema(
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
    card_number: {
        type: String,
        unique: true,
        required: true,
        validate: {
          validator: function(v) {
            return /^\d{16}$/.test(v);
          },
          message: props => `${props.value} is not a valid 16-digit card number!`
        },
      },      
    password: {
      type: String,
      required: true,
    },
    funds: {
      type: Number,
      default: Math.floor(Math.random() * (999999 - 10000 + 1)) + 10000,
    },
    investment_funds: {
      type: Number,
      default: 0,
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

// Pre-save hook to hash password before saving
bankUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = model('BankUser', bankUserSchema);
