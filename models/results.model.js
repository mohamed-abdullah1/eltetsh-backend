// semester schedule model
const mongoose = require("mongoose");
const ResultsSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Department",
      require: [true, "department required"],
    },
    course: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Course",
      required: true,
    },
    excelUrl: {
      type: String,
    },
  },
  { timestamps: true }
);
const Results = mongoose.model("Results", ResultsSchema);
module.exports = Results;
