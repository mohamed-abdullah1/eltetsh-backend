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
      default:
        "https://camo.githubusercontent.com/a09826e3c20bbb772e71f52a449fdc9db3f58dff6ee2a0ab67ffdfd415f18760/68747470733a2f2f75706c6f61642e77696b696d656469612e6f72672f77696b6970656469612f636f6d6d6f6e732f372f37632f50726f66696c655f6176617461725f706c616365686f6c6465725f6c617267652e706e67",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
