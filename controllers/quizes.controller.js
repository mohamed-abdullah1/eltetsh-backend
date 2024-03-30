const asyncHandler = require("express-async-handler");
const { QuizQuestions } = require("../models/quizes.model");
const Course = require("../models/courses.model");
const Department = require("../models/departments.model");
const User = require("../models/users.model");
const makeQuiz = asyncHandler(async (req, res) => {
  const { department, course, doctorId, questions } = req.body;
  //check course exists
  const isCourseExists = !!(await Course.findById(course));
  if (!isCourseExists) {
    res.status(400);
    throw new Error("course doesn't exist");
  }
  //check department exists
  const isDepartmentExists = !!(await Department.findById(department));
  if (!isDepartmentExists) {
    res.status(400);
    throw new Error("department doesn't exist");
  }
  //check department and course match
  const isDepartmentAndCourseMatch = !!(await Course.findOne({
    _id: course,
    department,
  }));
  if (!isDepartmentAndCourseMatch) {
    res.status(400);
    throw new Error("department and course don't match");
  }
  //check doctor exists
  const isDoctorExists = !!(await User.find({
    _id: doctorId,
    $or: [{ role: "doctor" }, { role: "admin" }],
  }));
  if (!isDoctorExists) {
    res.status(400);
    throw new Error("doctor doesn't exist or not authorized, because of role");
  }
  //create quiz
  const quiz = await QuizQuestions({
    department,
    course,
    doctorId,
    questions,
  });
  res.status(201).json({ message: "created successfully", data: quiz });
});

module.exports = { makeQuiz };
