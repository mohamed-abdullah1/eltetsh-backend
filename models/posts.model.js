const mongoose = require("mongoose");
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Department",
      required: true,
    },
    course: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Course",
      required: true,
    },
    reactions: {
      type: Map,
      of: Number,
      default: {
        like: 0,
        dislike: 0,
        love: 0,
        angry: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Post", postSchema);
