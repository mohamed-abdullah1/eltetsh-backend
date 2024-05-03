const {
  getDepartmentById,
  getAllDepartments,
  createDepartment,
  deleteDepartment,
  updateDepartment,
} = require("../controllers/departments.controller");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/create").post(verifyAdmin, createDepartment);
router.route("/all").get(verifyToken, getAllDepartments);
router
  .route("/:id")
  .get(verifyToken, getDepartmentById)
  .delete(verifyAdmin, deleteDepartment)
  .put(verifyAdmin, updateDepartment);
module.exports = router;
//emoji
