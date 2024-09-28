const {
  bookAppointment,
  endAppointment,
} = require("../controllers/appointment.controller");

const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/book").post(verifyToken, bookAppointment);
// router.route("/all").get(verifyToken, getAllClients);
router.route("/:id/endTime").put(verifyAdmin, endAppointment);
// .delete(verifyAdmin, deleteClient)
// .get(verifyToken, getClientById)
module.exports = router;
