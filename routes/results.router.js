const router = require("express").Router();

const multer = require("multer");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");
const {
  addResults,
  getResult,
  editResult,
  getAllResults,
  deleteResult,
} = require("../controllers/results.controller");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/create", verifyAdmin, upload.single("result_file"), addResults);
router.get("/get/:resultId", verifyAdmin, getResult);
router.get("/get-all", verifyToken, getAllResults);
router.put(
  "/edit/:resultId",
  verifyAdmin,
  upload.single("result_file"),
  editResult
);
router.delete("/delete/:resultId", verifyAdmin, deleteResult);
module.exports = router;
