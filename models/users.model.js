const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name field is required"],
    },
    password: {
      type: String,
      required: [true, "Password field is required"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email field is required"],
    },
    nationalId: {
      type: String,
      required: true,
      maxLength: 14,
      minLength: 14,
      validate: {
        validator: function () {
          return /^\d{14}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid 14-digit national ID!`,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
