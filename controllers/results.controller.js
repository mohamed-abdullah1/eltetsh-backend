const asyncHandler = require("express-async-handler");
const { Results, ExcelResults } = require("../models/results.model");
const {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  getStorage,
} = require("firebase/storage");
const Course = require("../models/courses.model");
const User = require("../models/users.model");
const { uploadResults } = require("../helpers/uploadResults");
const storage = getStorage();
const ObjectId = require("mongoose").Types.ObjectId;
const addResults = asyncHandler(async (req, res) => {
  const { department, course } = req.body;
  if (!department || !course) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  //! CHECK IF THE COURSE IS IN THAT DEPARTMENT OR NOT
  const courseExists = await Course.findOne({ _id: course, department });
  if (!courseExists) {
    res.status(400);
    throw new Error("Course is not in that department");
  }
  //check if it found or not to prevent duplicates

  await Results.deleteMany({ department, course });

  let storageRef, metadata, downloadURL, snapshot;
  if (req?.file) {
    // Generate a unique filename based on timestamp or any other logic
    const filename = `excel_result_${Date.now()}.xlsx`;

    // Create the storage reference with the desired filename
    storageRef = ref(storage, `results/${filename}`);

    // Create file metadata including the content type
    metadata = {
      contentType: req.file.mimetype,
    };

    // Upload the file to the bucket storage
    snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );

    // Grab the public url
    downloadURL = await getDownloadURL(snapshot.ref);
  }
  if (!req?.file) {
    res.status(400);
    throw new Error("please complete all fields::pdf");
  }
  const newResult = await Results.create({
    department,
    course,
    excelUrl: downloadURL,
  });
  uploadResults(req, downloadURL);

  res.status(201).json(newResult);
});

const getResult = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const result = await Results.findById(resultId);
  if (!result) {
    res.status(404);
    throw new Error("THIS RESULT NOT FOUND !");
  }
  res.status(200).json({ data: result });
});

const getAllResults = asyncHandler(async (req, res) => {
  const { skip, limit } = req.pagination;
  //filter by course and department
  const { course, department } = req.query;

  const query =
    course && department
      ? { course, department }
      : course
      ? { course }
      : department
      ? { department }
      : {};
  const results = await Results.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("department", "course");

  res.status(200).json({ count: results.length, data: results });
});

const editResult = asyncHandler(async (req, res) => {
  const { resultId } = req.params;

  const oldResult = await Results.findById(resultId);

  let storageRef, snapshot, downloadURL;
  if (req?.file) {
    storageRef = ref(
      storage,
      `results/${oldResult.department}/${oldResult.course}`
    );
    // Create file metadata including the content type
    metadata = {
      contentType: req.file.mimetype,
    };

    snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );
    downloadURL = await getDownloadURL(snapshot.ref);
  }
  const data = req?.file
    ? { ...req.body, excelUrl: downloadURL }
    : { ...req.body };
  const newResult = await Results.findByIdAndUpdate(resultId, data, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ message: "updated successfully", data: newResult });
});
const deleteResult = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const deletedResult = await Results.findByIdAndDelete(resultId);
  res
    .status(200)
    .json({ message: "deleted successfully", data: deletedResult });
});
const getResultsForOneStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  //check user who send Request is the student
  const student = await User.findById(studentId);
  if (
    !new ObjectId(student._id).equals(req.user._id) &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Unauthorized");
  }
  const results = await ExcelResults.find({ student: studentId }).populate([
    "student",
    "course",
  ]);
  res.status(200).json({ data: results });
});
module.exports = {
  addResults,
  getResult,
  editResult,
  getAllResults,
  deleteResult,
  getResultsForOneStudent,
};
