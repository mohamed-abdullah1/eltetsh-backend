const {
  addClient,
  getAllClients,
  deleteClient,
  getClientById,
  updateClient,
} = require("../controllers/client.controller");

const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/add").post(verifyToken, addClient);
router.route("/all").get(verifyToken, getAllClients);
router
  .route("/:id")
  .delete(verifyAdmin, deleteClient)
  .get(verifyToken, getClientById)
  .put(verifyAdmin, updateClient);
module.exports = router;
