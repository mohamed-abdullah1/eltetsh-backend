//we will use asyncHandler so we can use throw new Error
//instead of try-catch block
const asyncHandler = require("express-async-handler");
const Goal = require("../models/goals.model");
//@desc     Gives all goals
//@route    GET /api/goals/
//@access   Private
const getGoals = asyncHandler(async (req, res) => {
  console.log({ user: req.user });
  const goals = await Goal.find({ goalOwner: req.user._id });
  res.status(200).json(goals);
});

//@desc     Create new goal
//@route    POST /api/goals/
//@access   Private
const addGoal = asyncHandler(async (req, res) => {
  if (!req.body.text) {
    res.status(400);
    throw new Error("Please enter the text field");
  }
  const { text } = req.body;
  const newGoal = await Goal.create({ goalOwner: req.user._id, text });
  res.status(201).json(newGoal);
});

//@desc     Del a goal
//@route    DELETE /api/goals/:id
//@access   Private
const delGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id });
  if (goal?.goalOwner.toString() !== req.user._id) {
    res.status(400);
    throw new Error("not authorized , your not allowed to del this goal");
  }
  const deletedGoal = await Goal.findOneAndDelete({ _id: req.params.id });

  if (!deletedGoal) {
    res.status(200).json({ message: "THIS GOAL HAS BEEN DELETED before" });
  } else {
    res
      .status(200)
      .json({ message: "goal is deleted successfully !", deletedGoal });
  }
});
//@desc     Update a goal
//@route    PUT /api/goals/:id
//@access   Private
const updateGoal = asyncHandler(async (req, res) => {
  const updatedGoal = await Goal.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body }
  );

  res.status(200).json({
    message: "goal is updated successfully !",
    newGoal: updatedGoal?._doc,
  });
});

module.exports = { getGoals, addGoal, delGoal, updateGoal };
