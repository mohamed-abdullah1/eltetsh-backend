const router = require("express").Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} = require("../controllers/posts.controller");
const multer = require("multer");
const { verifyDoctor, verifyToken } = require("../middleware/auth.middleware");
const upload = multer({ storage: multer.memoryStorage() });

router
  .route("/create")
  .post(verifyDoctor, upload.array("posts_files", 5), createPost);
router.route("/all").get(verifyToken, getAllPosts);
router
  .route("/:id")
  .get(verifyToken, getPostById)
  .put(verifyDoctor, updatePost)
  .delete(verifyDoctor, deletePost);
module.exports = router;
