const mongoose = require("mongoose");

// Appointment Schema
const invoiceSchema = new mongoose.Schema(
  {
    totalPrice: {
      type: Number,
      default: 0,
    },
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId, // Reference to the device collection
        ref: "Appointment", // Assuming the device schema is named 'Device'
        required: true,
      },
    ],
    drinksFoods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DrinkFood",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["paid", "unpaid"],
      required: true,
      default: "unpaid",
    },
    ended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
