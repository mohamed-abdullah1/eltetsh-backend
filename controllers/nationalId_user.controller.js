const asyncHandler = require("express-async-handler");
const NationalIds = require("../models/nationalId_user.model");
const getNationalIds = asyncHandler(async (req, res) => {
  const allDocs = await NationalIds.find();
  res.status(200).send({ result: allDocs, count: allDocs.length });
});
const deleteNationalId = asyncHandler(async (req, res) => {});
const updateNationalId = asyncHandler(async (req, res) => {});
const addNationalId = asyncHandler(async (req, res) => {});
module.exports = {
  getNationalIds,
  deleteNationalId,
  updateNationalId,
  addNationalId,
};
