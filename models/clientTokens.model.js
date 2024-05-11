const mongoose = require("mongoose");

const clientTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
});

const ClientToken = mongoose.model("ClientToken", clientTokenSchema);

module.exports = ClientToken;
