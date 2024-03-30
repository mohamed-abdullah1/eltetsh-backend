const router = require("express").Router();
const { makeQuiz } = require("../controllers/quizes.controller");
const {
  verifyToken,
  verifyDoctorOrAdmin,
} = require("../middleware/auth.middleware");
router.route("/make_quiz").post(verifyDoctorOrAdmin, makeQuiz);

module.exports = router;
