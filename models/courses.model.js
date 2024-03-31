const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  date: {
    day: {
      type: String,
      required: true,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format. Please use HH:MM AM/PM format.`,
      },
    },
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
    validate: {
      validator: function (v) {
        return v > this.min_mark;
      },
      message: (props) =>
        `${props.value} is not a valid , enter marks higher than min_mark`,
    },
  },
  min_mark: {
    type: Number,
    required: true,
    validate: {
      validator: function (v) {
        return v < this.max_mark;
      },
      message: (props) =>
        `${props.value} is not a valid , enter marks lower than max_mark`,
    },
  },
  appointment: appointmentSchema,
  year: {
    type: String,
    enum: ["1st", "2nd", "3th", "4th", "5th"],
    required: true,
  },
  department: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Department",
  },
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
