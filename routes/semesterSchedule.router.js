const router = require("express").Router();

const multer = require("multer");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");
const {
  addSemesterSchedule,
  getSemesterSchedule,
  editSemesterSchedule,
  getAllSemesterSchedule,
  deleteSemesterSchedule,
} = require("../controllers/semesterSchedule.controller");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/create",
  verifyAdmin,
  upload.single("schedule_file"),
  addSemesterSchedule
);
router.get("/get/:semesterScheduleId", verifyAdmin, getSemesterSchedule);
router.get("/get-all", verifyToken, getAllSemesterSchedule);
router.put(
  "/edit/:semesterScheduleId",
  verifyAdmin,
  upload.single("schedule_file"),
  editSemesterSchedule
);
router.delete(
  "/delete/:semesterScheduleId",
  verifyAdmin,
  deleteSemesterSchedule
);
module.exports = router;
