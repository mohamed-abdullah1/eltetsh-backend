const {
  registerUser,
  loginUser,
  getUserInfo,
  updateUserInfo,
  deleteUser,
  getAllUsers,
  sendToken,
} = require("../controllers/users.controller");
const {
  verifyAdmin,
  verifyToken,
  isUserOrAdmin,
} = require("../middleware/auth.middleware");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router
  .route("/register")
  .post(verifyAdmin, upload.single("user_image"), registerUser);
router.route("/login").post(loginUser);
router.route("/me").get(verifyToken, getUserInfo);
router.delete("/deleteUser/:id", verifyAdmin, deleteUser);
router.get("/all_users", verifyAdmin, getAllUsers);
router
  .route("/update/:id")
  .put(verifyToken, isUserOrAdmin, upload.single("user_image"), updateUserInfo);
module.exports = router;
