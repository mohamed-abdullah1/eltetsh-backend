const router = require("express").Router();
const {
  makeQuiz,
  submitQuiz,
  getStudentsResultsForAQuiz,
  getOneStudentResultsForManyQuiz,
  changeAppearanceQuizResults,
} = require("../controllers/quizes.controller");
const {
  verifyToken,
  verifyDoctorOrAdmin,
  verifyDoctor,
} = require("../middleware/auth.middleware");
router.route("/make_quiz").post(verifyDoctorOrAdmin, makeQuiz);
router.route("/submit_quiz").post(verifyToken, submitQuiz);
router
  .route("/results/:quizId")
  .get(verifyDoctorOrAdmin, getStudentsResultsForAQuiz);
router
  .route("/student_results/:studentId")
  .get(verifyToken, getOneStudentResultsForManyQuiz);
router.post(
  "/change_appearance_results/:quizId",
  verifyDoctorOrAdmin,
  changeAppearanceQuizResults
);
module.exports = router;
