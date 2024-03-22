const Post = require("../models/posts.model");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const config = require("../config/firebase.config");
const { getMetadata, list } = require("firebase/storage");

//Initialize a firebase application
initializeApp(config);
// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();
// Setting up multer as a middleware to grab photo uploads

// @desc    create a posts
// @route   POST /api/posts
// @access  PRIVATE ==>USER
const createPost = asyncHandler(async (req, res) => {
  const { title, content, department, course } = req.body;
  const author = req.user._id;
  if (!title || !content || !department || !course) {
    res.status(400);
    throw new Error("Please add all fields");
  }
  const postFilesId = uuidv4();
  //images,pdfs,files

  const uploadedFilesPromises = req.files.map(async (file) => {
    const storageRef = ref(
      storage,
      `posts/${postFilesId}/${file.originalname}`
    );

    // Create file metadata including the content type
    const metadata = {
      contentType: file.mimetype,
    };

    // Upload the file in the bucket storage
    const snapshot = await uploadBytesResumable(
      storageRef,
      file.buffer,
      metadata
    );
    // Grab the public URL for each file
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      name: file.originalname,
      type: file.mimetype,
      downloadURL: downloadURL,
    };
  });

  // Wait for all files to be uploaded and processed
  const uploadedFiles = await Promise.all(uploadedFilesPromises);

  ////
  const post = new Post({
    title,
    content,
    author,
    department,
    course,
    postFilesId,
  });
  await post.save();
  res.status(201).json({ ...post?._doc, files: uploadedFiles });
});

// @desc    get all posts
// @route   GET /api/posts
// @access  PRIVATE
const getAllPosts = asyncHandler(async (req, res) => {
  const { skip, limit } = req.pagination;
  const posts = await Post.find()
    .populate(["author", "department", "course"])
    .skip(skip)
    .limit(limit);
  let fetchedPosts = await Promise.all(
    posts.map(async (post) => {
      const storageRef = ref(storage, `posts/${post.postFilesId}`);
      const files = await list(storageRef);
      // Iterate through each item in the list and retrieve download URLs
      const fileData = await Promise.all(
        files.items.map(async (item) => {
          const downloadURL = await getDownloadURL(item);
          const metadata = await getMetadata(item);

          return {
            name: item.name,
            downloadURL: downloadURL,
            type: metadata.contentType,
          };
        })
      );
      return { ...post?._doc, files: fileData };
    })
  );
  res.status(200).json({ results: fetchedPosts, count: fetchedPosts.length });
});

// @desc    get a post by id
// @route   GET /api/posts/:id
// @access  PRIVATE
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate([
    "author",
    "department",
    "course",
  ]);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  const storageRef = ref(storage, `posts/${post.postFilesId}`);
  const files = await list(storageRef);
  // Iterate through each item in the list and retrieve download URLs
  const fileData = await Promise.all(
    files.items.map(async (item) => {
      const downloadURL = await getDownloadURL(item);
      const metadata = await getMetadata(item);

      console.log({ ...item });
      return {
        name: item.name,
        downloadURL: downloadURL,
        type: metadata.contentType,
      };
    })
  );
  res.status(200).json({ ...post?._doc, files: fileData });
});
// @desc    update a post
// @route   PUT /api/posts/:id
// @access  PRIVATE
const updatePost = asyncHandler(async (req, res) => {
  const { title, content, course, department } = req.body;
  const updatedPost = await Post.findOneAndUpdate(
    { _id: req.params.id },
    { title, content, course, department },
    { new: true, runValidators: true }
  );
  if (!updatedPost) {
    return res.status(404).json({ message: "Post not found" });
  }
  const completePost = await updatedPost.populate([
    "author",
    "course",
    "department",
  ]);
  res
    .status(200)
    .json({ message: "post updated successfully", updatedPost: completePost });
});
// @desc    delete a post
// @route   DELETE /api/posts/:id
// @access  PRIVATE
const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const post = await Post.findOne({ _id: postId });
  const postExists = !!post;
  if (!postExists) {
    res.status(400);
    throw new Error("this post doesn't exist");
  }
  await Post.deleteOne({ _id: postId });
  res.status(200).json({
    message: "Deleted Successfully",
    deletedPost: post,
  });
});

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
