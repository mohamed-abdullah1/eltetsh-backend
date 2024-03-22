const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const postSchema = new mongoose.Schema(
  {
    postFilesId: {
      type: String,
      default: uuidv4, // Set default value to a UUID
    },
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
      like: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User" }],
      dislike: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User" }],
      love: [
        {
          userId: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
        },
      ],
      angry: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User" }],
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Post", postSchema);
