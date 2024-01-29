const { Schema, model } = require('mongoose');

const bankUserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
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
      default: () => Math.floor(Math.random() * (999999 - 10000 + 1)) + 10000,
    },
    investment_funds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('BankUser', bankUserSchema);
