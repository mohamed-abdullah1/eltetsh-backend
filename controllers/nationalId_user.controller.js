const asyncHandler = require("express-async-handler");
const NationalIds = require("../models/nationalId_user.model");
const User = require("../models/users.model");
//@desc     Get all
//@route    GET /api/nationalId_user/all
//@access   Private ADMIN
const getNationalIds = asyncHandler(async (req, res) => {
  const { skip, limit } = req.pagination;
  const allDocs = await NationalIds.find().skip(skip).limit(limit);
  res.status(200).send({ result: allDocs, count: allDocs.length });
});
//@desc     Del a nationalId
//@route    DELETE /api/nationalId_user/:id
//@access   Private ADMIN
const deleteNationalId = asyncHandler(async (req, res) => {
  const doc = !!(await NationalIds.findById(req.params.id));
  if (!doc) {
    res.status(404);
    throw new Error("the id doesn't exist");
  }
  const deletedDoc = await NationalIds.findByIdAndDelete(req.params.id);
  await User.deleteOne({ nationalId: deletedDoc.nationalId });
  res.status(200).json({
    message: "Deleted successfully",
    doc: deletedDoc,
  });
});
const updateNationalId = asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const updateFields = req.body;

  // Update the item in the database
  const updatedItem = await NationalIds.findByIdAndUpdate(
    itemId,
    updateFields,
    { new: true, runValidators: true } // Set runValidators to true to run validation on update
  );

  if (!updatedItem) {
    res.status(404);
    throw new Error("not found");
  }

  // Respond with the updated item
  res.status(200).json(updatedItem);
});
const addNationalId = asyncHandler(async (req, res) => {
  const { nationalId, role, name } = req.body;
  if (!nationalId || !role || !name) {
    res.status(400);
    throw new Error("Please complete all fields");
  }
  const newNationalId = await NationalIds.create({ nationalId, name, role });
  res
    .status(201)
    .json({ message: "Created Successfully", data: newNationalId });
});
module.exports = {
  getNationalIds,
  deleteNationalId,
  updateNationalId,
  addNationalId,
};
