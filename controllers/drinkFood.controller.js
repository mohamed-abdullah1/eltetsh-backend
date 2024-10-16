const asyncHandler = require("express-async-handler");
const DrinkFood = require("../models/drinkFood.model");
const responseObject = require("../helpers/response.helper");

//@desc     book a drinkFood
//@route    POST /api/drinkFood/create
//@access   Public
const createDrinkFood = asyncHandler(async (req, res) => {
  const { name, price, type } = req.body;

  //check all required fields
  if (!name || !price || !type) {
    res.status(400);
    throw new Error("Please complete all fields");
  }

  //add new drinkFood
  const newDrinkFood = await DrinkFood.create({
    name,
    price,
    type,
  });
  //respond
  res.status(201).json(
    responseObject(true, "Drink-Food Created Successfully", {
      ...newDrinkFood?._doc,
    })
  );
});

//@desc     Get all drinkFoods
//@route    POST /api/drinkFood/all
//@access   ADMIN , MANAGER
const getAllDrinkFoods = asyncHandler(async (req, res) => {
  // const { filterByDepartment, filterByYear, filterByDay } = req.query;

  const { skip, limit } = req.pagination;
  //filter by date

  let query = {};

  // Check if there are search parameters in the query
  if (req.query.search !== undefined) {
    // If search query is not empty, modify the query object to include search criteria
    if (req.query.search !== "") {
      query = { $or: [{ code: { $regex: req.query.search, $options: "i" } }] };
    }
    // Otherwise, return all items without applying any search criteria
  }
  // const filterObj =
  //   filterByDepartment && filterByYear
  //     ? { department: filterByDepartment, year: filterByYear }
  //     : filterByDepartment
  //     ? { department: filterByDepartment }
  //     : filterByYear
  //     ? { year: filterByYear }
  //     : {};
  const drinkFoods = await DrinkFood.find({
    // ...filterObj
    // ,
    ...query,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  res.status(200).json(
    responseObject(true, "success", {
      count: drinkFoods.length,
      result: drinkFoods,
    })
  );
});
//@desc     Get one drinkFoods
//@route    POST /api/drinkFood/:id
//@access   ADMIN , MANAGER
const getDrinkFoodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  //check if the drinkFood is available
  const drinkFood = await DrinkFood.findOne({
    _id: id,
  });

  if (!drinkFood) {
    res.status(400);
    throw new Error("DrinkFood is not available");
  }
  res.status(200).json(responseObject(true, "success", drinkFood));
});
//@desc     update one drinkFood
//@route    PUT /api/drinkFood/:id
//@access   ADMIN , MANAGER
const updateDrinkFood = asyncHandler(async (req, res) => {
  const drinkFoodId = req.params.id;
  const updateFields = req.body;
  //check if the drinkFood is available
  const drinkFood = await DrinkFood.findById(drinkFoodId);
  console.log("🔥✨ ", { drinkFood });

  if (!drinkFood) {
    res.status(400);
    throw new Error("DrinkFood is not available");
  }
  // Update the drinkFood in the database
  const updatedDrinkFood = await DrinkFood.findByIdAndUpdate(
    drinkFoodId,
    {
      ...updateFields,
    },
    {
      new: true,
      runValidators: true,
    }
  ); // Set runValidators to true to run validation on update
  res
    .status(200)
    .json({ message: "updated successfully", data: updatedDrinkFood });
});
//@desc     Delete one course
//@route    DELETE /api/drinkFood/:id
//@access   ADMIN , MANAGER
const deleteDrinkFood = asyncHandler(async (req, res) => {
  console.log(req.user.role);
  const drinkFoodId = req.params.id;
  //check if the course exist or not
  const drinkFood = await DrinkFood.findOne({ _id: drinkFoodId });
  const drinkFoodExists = !!drinkFood;
  if (!drinkFoodExists) {
    res.status(400);
    throw new Error("this drinkFood doesn't exist");
  }

  await DrinkFood.deleteOne({ _id: drinkFoodId });
  res.status(200).json(
    responseObject(true, "DrinkFood Deleted Successfully", {
      deletedDrinkFood: drinkFood,
    })
  );
});

module.exports = {
  createDrinkFood,
  getAllDrinkFoods,
  getDrinkFoodById,
  deleteDrinkFood,
  updateDrinkFood,
};
