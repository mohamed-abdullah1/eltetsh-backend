const mongoose = require("mongoose");

// Appointment Schema
const drinkFood = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["drink", "food"],
    required: true,
  },
});

const DrinkFood = mongoose.model("DrinkFood", drinkFood);

module.exports = DrinkFood;
