const {
  registerUser,
  loginUser,
  getUserInfo,
} = require("../controllers/users.controller");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router
  .route("/register")
  .post(verifyAdmin, upload.single("user_image"), registerUser);
router.route("/login").post(loginUser);
router.route("/me").get(verifyToken, getUserInfo);
module.exports = router;
