const Post = require("../models/posts.model");
const Course = require("../models/courses.model");
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
const Department = require("../models/departments.model");
const ObjectId = require("mongoose").Types.ObjectId;

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
  let allCoursesIds, allDepartmentIds;
  if (req.user.role === "staff" && course === "all") {
    const deptQuery = department !== "all" ? { department } : {};
    allCoursesIds = await Course.find(deptQuery).select("_id");
  }
  if (req.user.role === "staff" && department === "all") {
    allDepartmentIds = await Department.find().select("_id");
  }
  if (
    !(req.user.role === "staff" && course === "all") &&
    !(req.user.role === "staff" && department === "all")
  ) {
    //! CHECK IF THE COURSE IS IN THAT DEPARTMENT OR NOT
    const courseExists = await Course.findOne({ _id: course, department });
    if (!courseExists) {
      res.status(400);
      throw new Error("Course is not in that department");
    }
  }
  const postFilesId = uuidv4();

  const uploadToFirebase = async (file) => {
    const storageRef = ref(storage, `posts/${uuidv4()}/${file.originalname}`);

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

    return downloadURL;
  };
  const uploadedFilesPromises = req.files["posts_files"]?.map(uploadToFirebase);
  const uploadedImagePromises = req.files["post_image"]?.map(uploadToFirebase);

  // Wait for all files to be uploaded and processed
  const uploadedFiles = await Promise.all(uploadedFilesPromises);
  const uploadedImage = await Promise.all(uploadedImagePromises);
  ////
  console.log("👉🔥 ", { uploadedFiles, uploadedImage });

  const post = new Post({
    title,
    content,
    author,
    department:
      req.user.role === "staff" && department === "all"
        ? allDepartmentIds
        : [department],
    course:
      req.user.role === "staff" && course === "all" ? allCoursesIds : [course],
    postFilesId,
    postFiles: uploadedFiles,
    postImage: uploadedImage[0],
  });
  await post.save();
  res.status(201).json({ ...post?._doc });
});
//==================================================================
//==================================================================
// @desc    get all posts
// @route   GET /api/posts
// @access  PRIVATE
const getAllPosts = asyncHandler(async (req, res) => {
  const { filterByCoursesIds, filterByDepartmentId } = req.query;
  console.log("👉🔥 ", filterByCoursesIds);

  //filterByCoursesIds
  if (filterByCoursesIds?.length > 0 && filterByDepartmentId) {
    const courseExists = await Promise.all(
      [...filterByCoursesIds].map(async (courseId) => {
        const courseExists = await Course.findOne({
          _id: courseId,
          department: filterByDepartmentId,
        });
        return !!courseExists;
      })
    );
    if (courseExists.includes(false)) {
      res.status(400);
      throw new Error("Course is not in that department");
    }
  }
  const { skip, limit } = req.pagination;
  const searchObjDepart =
    filterByDepartmentId && filterByCoursesIds?.length > 0
      ? {
          department: filterByDepartmentId,
          $or: [...filterByCoursesIds].map((courseId) => ({
            course: courseId,
          })),
        }
      : filterByDepartmentId
      ? { department: filterByDepartmentId }
      : filterByCoursesIds
      ? {
          $or: [...filterByCoursesIds].map((courseId) => ({
            course: courseId,
          })),
        }
      : {};
  //search by content or title
  let query;
  if (req.query.searchByTitle !== undefined) {
    if (req.query.searchByTitle != "") {
      query = {
        $or: [{ title: { $regex: req.query.searchByTitle, $options: "i" } }],
      };
    }
  }
  const posts = await Post.find({ ...searchObjDepart, ...query })
    .sort({ createdAt: -1 })
    .populate([
      "author",
      "department",
      "course",
      "reactions.angry",
      "reactions.love",
      "reactions.dislike",
      "reactions.like",
      "comments.author",
    ])
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
  res.status(200).json({ count: fetchedPosts?.length, results: fetchedPosts });
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
  let uploadedFiles, uploadedImage;
  if (req?.files) {
    const uploadToFirebase = async (file) => {
      const storageRef = ref(storage, `posts/${uuidv4()}/${file.originalname}`);

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

      return downloadURL;
    };
    const uploadedFilesPromises =
      req.files["posts_files"]?.map(uploadToFirebase);
    const uploadedImagePromises =
      req.files["post_image"]?.map(uploadToFirebase);
    // Wait for all files to be uploaded and processed
    console.log("👉🔥 ", { uploadedFilesPromises, uploadedImagePromises });
    if (uploadedFilesPromises) {
      uploadedFiles = await Promise.all(uploadedFilesPromises);
    }
    if (uploadedImagePromises) {
      uploadedImage = await Promise.all(uploadedImagePromises);
    }
    ////
  }
  const mainItems = { title, content, course, department };
  const newObj =
    req.files["posts_files"] && req.files["post_image"]
      ? {
          ...mainItems,
          postFiles: uploadedFiles,
          postImage: uploadedImage[0],
        }
      : req.files["posts_files"]
      ? {
          ...mainItems,
          postFiles: uploadedFiles,
        }
      : req.files["post_image"]
      ? {
          ...mainItems,
          postImage: uploadedImage[0],
        }
      : mainItems;
  const updatedPost = await Post.findOneAndUpdate(
    { _id: req.params.id },
    newObj,
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

const reactPost = asyncHandler(async (req, res) => {
  const { reactionType } = req.body;
  const { id } = req.params;
  const { _id: userId, name } = req.user;
  const post = await Post.findById(id);
  const userIdObjectId = new ObjectId(userId);

  const validReactionTypes = ["like", "dislike", "love", "angry"];
  if (!validReactionTypes.includes(reactionType)) {
    res.status(400);
    throw new Error("Invalid reaction type");
  }
  let prevReactionType;
  Object.keys(post.reactions).forEach((key) => {
    if (
      post.reactions[key].filter((u_id) => {
        const anotherObjectId = new ObjectId(userId);
        return u_id?.equals(anotherObjectId);
      })?.length > 0
    ) {
      prevReactionType = key;
      return;
    }
  });

  if (prevReactionType === reactionType) {
    res.status(400);
    throw new Error("THIS USER HAS REACTED ON THIS POST by the same reaction");
  }
  console.log({ prevReactionType });
  const updatedPost = await Post.findByIdAndUpdate(
    id,
    {
      $push: { [`reactions.${reactionType}`]: userIdObjectId },
      $pull: {
        [`reactions.${prevReactionType}`]: userIdObjectId,
      },
    },
    { new: true }
  );
  const completePost = await updatedPost.populate([
    "reactions.angry",
    "reactions.like",
    "reactions.dislike",
    "reactions.love",
  ]);
  if (!updatedPost) {
    return res.status(404).json({ error: "Post not found" });
  }

  res.status(200).json(completePost);
});

const makeComment = asyncHandler(async (req, res) => {
  const newComment = {
    author: req.user._id,
    content: req.body.content,
  };
  const newPost = await Post.findOneAndUpdate(
    { _id: req.params.postId },
    { $push: { comments: newComment } },
    { new: true, runValidators: true, populate: ["author", "comments.author"] }
  );
  res
    .status(200)
    .json({ message: "comment added successfully", post: newPost });
});
const deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const post = await Post.findById(postId);
  const comment = post.comments.find((c) =>
    new ObjectId(commentId).equals(c._id)
  );
  //check post owner or admin or comment owner
  if (
    !new ObjectId(post.author).equals(req.user._id) &&
    !new ObjectId(comment.author).equals(req.user._id) &&
    req.user.role !== "admin"
  ) {
    res.status(400);
    throw new Error("You aren't allowed to delete this comment");
  }
  const newPost = await Post.findOneAndUpdate(
    { _id: postId },
    { $pull: { comments: comment } },
    { new: true, runValidators: true, populate: ["author", "comments.author"] }
  );
  res.status(200).json({ message: "deleted successfully", post: newPost });
});
module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  reactPost,
  makeComment,
  deleteComment,
};
