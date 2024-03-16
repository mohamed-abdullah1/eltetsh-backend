const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  info: {
    type: String,
  },
});

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;
