const router = require("express").Router();

const multer = require("multer");
const { verifyAdmin } = require("../middleware/auth.middleware");
const {
  addSemesterSchedule,
  getSemesterSchedule,
  editSemesterSchedule,
  getAllSemesterSchedule,
} = require("../controllers/semesterSchedule.controller");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/create",
  verifyAdmin,
  upload.single("schedule_file"),
  addSemesterSchedule
);
router.get("/get/:semesterScheduleId", verifyAdmin, getSemesterSchedule);
router.get("/get-all", verifyAdmin, getAllSemesterSchedule);
router.put("/edit/:semesterScheduleId", verifyAdmin, editSemesterSchedule);

module.exports = router;
