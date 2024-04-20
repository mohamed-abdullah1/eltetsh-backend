// semester schedule model
const mongoose = require("mongoose");
const SemesterScheduleSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Department",
      require: [true, "department required"],
    },

    year: {
      type: String,
      enum: ["1st", "2nd", "3th", "4th", "5th"],
    },
    semester: {
      type: String,
      enum: ["1st", "2nd"],
      require: [true, "semester required"],
    },
    scheduleUrl: {
      type: String,
    },
  },
  { timestamps: true }
);
const SemesterSchedule = mongoose.model(
  "SemesterSchedule",
  SemesterScheduleSchema
);
module.exports = SemesterSchedule;
