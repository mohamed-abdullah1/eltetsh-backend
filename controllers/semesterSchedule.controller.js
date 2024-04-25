const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongoose").Types;
const SemesterSchedule = require("../models/semesterSchedule.model");
const {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  getStorage,
} = require("firebase/storage");
const storage = getStorage();

const addSemesterSchedule = asyncHandler(async (req, res) => {
  const { department, year } = req.body;
  if (!department || !year) {
    res.status(400);
    throw new Error("please complete all fields");
  }

  //check if it found or not to prevent duplicates
  const semesterSchedule = await SemesterSchedule.findOne({
    department,
    year,
  });
  if (semesterSchedule) {
    res.status(400);
    throw new Error("This Schedule is already exist.");
  }
  let storageRef, metadata, downloadURL, snapshot;
  if (req?.file) {
    storageRef = ref(storage, `schedules/${department}/${year}`);

    // Create file metadata including the content type
    metadata = {
      contentType: req.file.mimetype,
    };

    // Upload the file in the bucket storage
    snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

    // Grab the public url
    downloadURL = await getDownloadURL(snapshot.ref);
  }
  if (!req?.file) {
    res.status(400);
    throw new Error("please complete all fields::pdf");
  }
  const newSemesterSchedule = await SemesterSchedule.create({
    department,
    year,

    scheduleUrl: downloadURL,
  });
  res.status(201).json(newSemesterSchedule);
});
const getSemesterSchedule = asyncHandler(async (req, res) => {
  const { semesterScheduleId } = req.params;
  const semesterSchedule = await SemesterSchedule.findById(semesterScheduleId);
  if (!semesterSchedule) {
    res.status(404);
    throw new Error("THIS SEMESTER SCHEDULE NOT FOUND !");
  }
  res.status(200).json({ data: semesterSchedule });
});
const getAllSemesterSchedule = asyncHandler(async (req, res) => {
  const { skip, limit } = req.pagination;
  //filter by year
  const { year } = req.query;

  const query = year ? { year } : {};
  const semesterSchedules = await SemesterSchedule.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("department");

  res
    .status(200)
    .json({ count: semesterSchedules.length, data: semesterSchedules });
});
const editSemesterSchedule = asyncHandler(async (req, res) => {
  const { semesterScheduleId } = req.params;

  const oldSemesterSchedule = await SemesterSchedule.findById(
    semesterScheduleId
  );

  let storageRef, snapshot, downloadURL;
  if (req?.file) {
    storageRef = ref(
      storage,
      `schedules/${oldSemesterSchedule.department}/${oldSemesterSchedule.year}`
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
    ? { ...req.body, scheduleUrl: downloadURL }
    : { ...req.body };
  const newSemesterSchedule = await SemesterSchedule.findByIdAndUpdate(
    semesterScheduleId,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
  res
    .status(200)
    .json({ message: "updated successfully", data: newSemesterSchedule });
});
const deleteSemesterSchedule = asyncHandler(async (req, res) => {
  const { semesterScheduleId } = req.params;
  const deletedSemesterSchedule = await SemesterSchedule.findByIdAndDelete(
    semesterScheduleId
  );
  res
    .status(200)
    .json({ message: "deleted successfully", data: deletedSemesterSchedule });
});
module.exports = {
  addSemesterSchedule,
  getSemesterSchedule,
  editSemesterSchedule,
  getAllSemesterSchedule,
  deleteSemesterSchedule,
};
