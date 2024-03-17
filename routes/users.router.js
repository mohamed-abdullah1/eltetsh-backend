const {
  registerUser,
  loginUser,
  getUserInfo,
} = require("../controllers/users.controller");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");
const router = require("express").Router();

router.route("/register").post(verifyAdmin, registerUser);
router.route("/login").post(loginUser);
router.route("/me").get(verifyToken, getUserInfo);
module.exports = router;
