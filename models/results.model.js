// semester schedule model
const mongoose = require("mongoose");
const ExcelResultsSchema = new mongoose.Schema({
  student: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    require: [true, "student id required"],
  },
  course: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Course",
    require: [true, "course id required"],
  },
  mark: {
    type: Number,
    require: [true, "result required"],
  },
  excelFileId: {
    type: String,
  },
});
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
const ExcelResults = mongoose.model("ExcelResults", ExcelResultsSchema);
module.exports = { Results, ExcelResults };
