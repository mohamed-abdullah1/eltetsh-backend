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
      unique: [true, "National Id must be unique"],
      required: [true, "National ID field is required"],
      maxLength: 14,
      minLength: 14,
      validate: {
        validator: function (v) {
          return /^\d{14}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid 14-digit national ID!`,
      },
    },
    nationalIdUser: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User_NationalIds",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "student", "doctor", "staff"], // Possible roles
      default: "student", // Default role if not specified
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
