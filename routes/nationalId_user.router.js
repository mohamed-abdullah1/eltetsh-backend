const {
  getNationalIds,
  deleteNationalId,
  updateNationalId,
  addNationalId,
} = require("../controllers/nationalId_user.controller");
const { verifyAdmin } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/add").post(verifyAdmin, addNationalId);
router.route("/all").get(verifyAdmin, getNationalIds);
router
  .route("/:id")
  .delete(verifyAdmin, deleteNationalId)
  .put(verifyAdmin, updateNationalId);
module.exports = router;
