const mongoose = require("mongoose");

const ForgetPassSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

const ForgetPassTokenUser = mongoose.model("ForgetPass", ForgetPassSchema);

module.exports = ForgetPassTokenUser;
