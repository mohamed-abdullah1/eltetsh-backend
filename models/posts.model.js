const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
//build comment schema
//contains content , author , post
//fix user year must be convenient to the courses year

const CommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
    content: { type: String, required: [true, "Comment content is required"] },
  },
  { timestamps: true }
);
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
      love: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User" }, ,],
      angry: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User" }],
    },
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Post", postSchema);
