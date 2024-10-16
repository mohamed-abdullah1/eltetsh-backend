const {
  bookAppointment,
  endAppointment,
  getAllAppointments,
} = require("../controllers/appointment.controller");

const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/book").post(verifyToken, bookAppointment);
router.route("/all").get(verifyToken, getAllAppointments);
router.route("/:id/endTime").put(verifyAdmin, endAppointment);
// .delete(verifyAdmin, deleteClient)
// .get(verifyToken, getClientById)
module.exports = router;
