const mongoose = require("mongoose");

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the device collection
    ref: "Device", // Assuming the device schema is named 'Device'
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  type: {
    type: String,
    enum: ["start-end", "open"],
    required: true,
  },
  singleOrMulti: {
    type: String,
    enum: ["single", "multi"],
    required: true,
  },
  ended: {
    type: Boolean,
    default: false,
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
