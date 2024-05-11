const router = require("express").Router();

const {
  sendToken,
  notifyWithQuiz,
} = require("../controllers/notifications.controller");
const {
  verifyToken,
  verifyDoctorOrAdmin,
} = require("../middleware/auth.middleware");

router.post("/send-token", verifyToken, sendToken);
router.post("/notify-with-quiz", verifyDoctorOrAdmin, notifyWithQuiz);
module.exports = router;
