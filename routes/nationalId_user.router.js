const {
  getNationalIds,
  deleteNationalId,
  updateNationalId,
  addNationalId,
} = require("../controllers/nationalId_user.controller");
const verifyToken = require("../middleware/auth.middleware");

const router = require("express").Router();
const verifyAdmin = (req, res, next) => {
  next();
};
router.route("/add").post(verifyAdmin, addNationalId);
router.route("/all").get(verifyToken, getNationalIds);
router
  .route("/:id")
  .delete(verifyAdmin, deleteNationalId)
  .put(verifyAdmin, updateNationalId);
module.exports = router;
