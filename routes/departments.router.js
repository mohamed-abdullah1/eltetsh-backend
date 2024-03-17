const {
  getDepartmentById,
  getAllDepartments,
  createDepartment,
  deleteDepartment,
  updateDepartment,
} = require("../controllers/departments.controller");
const { verifyAdmin } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/create").post(verifyAdmin, createDepartment);
router.route("/all").get(verifyAdmin, getAllDepartments);
router
  .route("/:id")
  .get(verifyAdmin, getDepartmentById)
  .delete(verifyAdmin, deleteDepartment)
  .put(verifyAdmin, updateDepartment);
module.exports = router;
