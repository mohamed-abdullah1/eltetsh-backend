const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  nationalId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (value) => /^\d{14}$/.test(value),
      message: "National ID must be a 14-digit number.",
    },
  },
  role: {
    type: String,
    enum: ["admin", "student", "staff", "doctor"],
  },
});

// Create the model
const User = mongoose.model("User_NationalIds", userSchema);

module.exports = User;
