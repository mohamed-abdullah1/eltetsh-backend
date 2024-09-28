const mongoose = require("mongoose");
const Appointment = require("./appointment.model");

const deviceSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: [true, "Course Code must be unique"],
  },
  status: {
    type: String,
    enum: ["available", "busy"],
    required: true,
    default: "available",
  },
  singlePrice: {
    type: Number,
    required: true,
    default: 20,
  },
  multiPrice: {
    type: Number,
    required: true,
    default: 25,
  },
  totalUsageHours: {
    type: Number,
    default: 0,
  },
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment", // Reference to the Appointment schema
    },
  ],
  lastActivity: {
    type: Date,
    default: Date.now,
  },
});

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
