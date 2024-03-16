const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
});

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  max_mark: {
    type: Number,
    required: true,
  },
  min_mark: {
    type: Number,
    required: true,
  },
  appointment: appointmentSchema,
  year: {
    type: String,
    enum: ["1st", "2nd", "3th", "4th", "5th"],
    required: true,
  },
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
