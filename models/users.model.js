const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const userSchema = mongoose.Schema(
  {
    userImagesId: {
      type: String,
      default: uuidv4,
    },
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

    role: {
      type: String,
      enum: ["admin", "student", "doctor", "staff"], // Possible roles
      default: "student", // Default role if not specified
    },
    department: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Department",
      default: null,
    },
    studentCourses: [
      {
        course: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "Course",
        },
        studentResult: {
          type: Number,
        },
      },
    ],
    doctorCourses: [
      {
        course: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "Course",
        },
      },
    ],
    year: {
      type: String,
      enum: ["1st", "2nd", "3th", "4th", "5th"],
    },
    user_image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
