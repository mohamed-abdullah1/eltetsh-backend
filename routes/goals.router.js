const router = require("express").Router();

const {
  getGoals,
  addGoal,
  delGoal,
  updateGoal,
} = require("../controllers/goals.controller");
const verifyToken = require("../middleware/auth.middleware");

router.route("/").get(verifyToken, getGoals).post(verifyToken, addGoal);
router.route("/:id").delete(verifyToken, delGoal).put(verifyToken, updateGoal);

module.exports = router;
