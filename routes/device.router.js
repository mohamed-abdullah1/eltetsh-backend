const {
  addDevice,
  getAllDevices,
  getDeviceById,
  deleteDevice,
  updateDevice,
} = require("../controllers/device.controller");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/add").post(verifyAdmin, addDevice);
router.route("/all").get(verifyToken, getAllDevices);
router
  .route("/:id")
  .get(verifyToken, getDeviceById)
  .delete(verifyAdmin, deleteDevice)
  .put(verifyAdmin, updateDevice);
module.exports = router;
