const {
  createInvoice,
  endAppointment,
  addAppointment,
  getAllInvoices,
  endInvoice,
} = require("../controllers/invoice.controller");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/create").post(verifyToken, createInvoice);
router
  .route("/:invoiceId/:appointmentId/endTime")
  .put(verifyToken, endAppointment);
router.route("/:invoiceId/add-appointment").put(verifyToken, addAppointment);
router.route("/:id/endInvoice").put(verifyToken, endInvoice);
router.route("/all").get(verifyToken, getAllInvoices);
// .delete(verifyAdmin, deleteClient)
// .get(verifyToken, getClientById)
module.exports = router;
