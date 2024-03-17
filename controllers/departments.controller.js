const asyncHandler = require("express-async-handler");
const Department = require("../models/departments.model");

//@desc     Create a department
//@route    POST /api/departments/create
//@access   Private ADMIN
const createDepartment = asyncHandler(async (req, res) => {
  const { name, info } = req.body;
  if (!name || !info) {
    res.status(400);
    throw new Error("Complete all fields");
  }
  const newDepartment = await Department.create({ info, name });
  res.status(201).json({
    message: "created successfully",
    data: newDepartment,
  });
});
//@desc     GET ALL department
//@route    GET /api/departments/all
//@access   Private ADMIN
const getAllDepartments = asyncHandler(async (req, res) => {
  const docs = await Department.find();
  res.status(200).json({ count: docs.length, data: docs });
});
//@desc     GET a department
//@route    GET /api/departments/:id
//@access   Private ADMIN
const getDepartmentById = asyncHandler(async (req, res) => {
  const doc = await Department.findOne({ _id: req.params.id });
  res.status(200).json({ data: doc });
});
//@desc     Update a department
//@route    PUT /api/departments/:id
//@access   Private ADMIN
const updateDepartment = asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const updatedFields = req.body;
  const updatedItem = await Department.findByIdAndUpdate(
    itemId,
    updatedFields,
    { new: true, runValidators: true }
  );
  res.status(200).json({ message: "Updated Successfully", data: updatedItem });
});
//@desc     Delete a department
//@route    DELETE /api/departments/:id
//@access   Private ADMIN
const deleteDepartment = asyncHandler(async (req, res) => {
  const departmentId = req.params.id;
  //check if the department exist or not
  const department = await Department.findOne({ _id: departmentId });
  const departmentExists = !!department;
  if (!departmentExists) {
    res.status(400);
    throw new Error("this department doesn't exist");
  }
  await Department.deleteOne({ _id: departmentId });
  res.status(200).json({
    message: "Deleted Successfully",
    data: department,
  });
});
module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
