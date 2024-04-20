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
  const { department, year, semester } = req.body;
  if (!department || !year || !semester) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  let storageRef, metadata, downloadURL, snapshot;
  if (req?.file) {
    storageRef = ref(storage, `schedules/${department}/${year}/${semester}`);

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
  } else {
    res.status(400);
    throw new Error("please complete all fields::pdf");
  }
  const newSemesterSchedule = await SemesterSchedule.create({
    department,
    year,
    semester,
    scheduleUrl: downloadURL,
  });
  res.status(201).json(newSemesterSchedule);
});

module.exports = { addSemesterSchedule };
