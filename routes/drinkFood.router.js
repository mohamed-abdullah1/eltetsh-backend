const {
  createDrinkFood,
  getAllDrinkFoods,
  deleteDrinkFood,
  updateDrinkFood,
  getDrinkFoodById,
} = require("../controllers/drinkFood.controller");
const { verifyAdmin, verifyToken } = require("../middleware/auth.middleware");

const router = require("express").Router();

router.route("/create").post(verifyAdmin, createDrinkFood);
router.route("/all").get(verifyToken, getAllDrinkFoods);
router
  .route("/:id")
  .put(verifyAdmin, updateDrinkFood)
  .delete(verifyAdmin, deleteDrinkFood)
  .get(verifyToken, getDrinkFoodById);
module.exports = router;
