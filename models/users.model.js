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
    username: {
      type: String,
      unique: true,
      required: [true, "Email field is required"],
    },

    role: {
      type: String,
      enum: ["admin", "manager", "client"], // Possible roles
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
