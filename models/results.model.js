// semester schedule model
const mongoose = require("mongoose");
const ResultsSchema = new mongoose.Schema(
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
    excelUrl: {
      type: String,
    },
  },
  { timestamps: true }
);
const Results = mongoose.model("Results", ResultsSchema);
module.exports = Results;
