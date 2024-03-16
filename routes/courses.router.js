const {
  getCourseById,
  getAllCourses,
  deleteCourse,
  updateCourse,
  createCourse,
} = require("../controllers/courses.controller");
const { verifyAdmin } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/create").post(verifyAdmin, createCourse);
router.route("/all").get(verifyAdmin, getAllCourses);
router
  .route("/:id")
  .get(verifyAdmin, getCourseById)
  .delete(verifyAdmin, deleteCourse)
  .put(verifyAdmin, updateCourse);
module.exports = router;
