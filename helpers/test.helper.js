const { verifyAdmin } = require("../middleware/auth.middleware");

const router = require("express").Router();

// const test = (req, res) => res.status(200).json({ msg: "server is live 🖖🏼" });
const test = (req, res) => "HELLO WORLD";

// router.get("/", verifyAdmin, test);
router.get("/", test);

module.exports = router;
