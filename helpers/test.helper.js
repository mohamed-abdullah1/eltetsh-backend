const { verifyAdmin } = require("../middleware/auth.middleware");

const router = require("express").Router();

const test = (req, res) => res.status(200).json({ msg: "server is live 🖖🏼" });

router.get("/", verifyAdmin, test);

module.exports = router;
