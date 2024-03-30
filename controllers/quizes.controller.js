const asyncHandler = require("express-async-handler");
const { QuizQuestions, QuizResults } = require("../models/quizes.model");
const ObjectId = require("mongoose").Types.ObjectId;

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
  const quiz = await QuizQuestions.create({
    department,
    course,
    doctorId,
    questions,
  });
  res.status(201).json({ message: "created successfully", data: quiz });
});

const submitQuiz = asyncHandler(async (req, res) => {
  const { studentId, quizQuestionId, answers } = req.body;
  //verify the student is the actual one who submit result
  if (!new ObjectId(studentId).equals(req.user._id)) {
    res.status(400);
    throw new Error("you can't submit this quiz for another user");
  }
  //check student exists
  const isStudentExists = !!(await User.find({
    _id: studentId,
    $or: [{ role: "student" }, { role: "admin" }],
  }));
  if (!isStudentExists) {
    res.status(400);
    throw new Error("student doesn't exist");
  }
  const quizQuestions = await QuizQuestions.findById(quizQuestionId);
  if (!quizQuestions) {
    res.status(400);
    throw new Error("quiz questions don't exist");
  }

  const calcResults = () => {
    let score = 0;
    answers.forEach((answer) => {
      quizQuestions.questions
        .find((q) => new ObjectId(answer.questionId).equals(q._id))
        .options.forEach((option) => {
          const selectedOptionId = new ObjectId(answer.selectedOptionId);
          if (option.isCorrect && selectedOptionId.equals(option._id)) {
            score += quizQuestions.questions.find((q) =>
              new ObjectId(answer.questionId).equals(q._id)
            ).question_score;
          }
        });
    });
    return score;
  };
  //create quiz
  const quiz = await QuizResults.create({
    studentId,
    quizQuestionId,
    answers,
    result: calcResults(),
  });
  res.status(201).json({ message: "submitted successfully", data: quiz });
});
const getStudentsResultsForAQuiz = asyncHandler(async (req, res) => {
  const quizQuestions = await QuizQuestions.findById(req.params.quizId);
  if (!new ObjectId(req.user._id).equals(quizQuestions.doctorId)) {
    res.status(400);
    throw new Error(
      "you can't get results, only doctor who make the quiz can access it"
    );
  }
  const { quizId } = req.params;
  const quizResults = await QuizResults.find({
    quizQuestionId: quizId,
  }).populate(["quizQuestionId", "studentId"]);
  res.status(200).json({ data: quizResults });
});
const getOneStudentResultsForManyQuiz = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const quizResults = await QuizResults.find({
    studentId,
    allowStudentToSeeResult: true,
  }).populate(["quizQuestionId", "studentId"]);
  res.status(200).json({ data: quizResults });
});
const changeAppearanceQuizResults = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { allowStudentToSeeResult } = req.body;
  //check body has all attrs
  if (!("allowStudentToSeeResult" in req.body)) {
    res.status(400);
    throw new Error("allowStudentToSeeResult is missing");
  }
  //check if the doctor who made the quiz can access it
  const quizQuestions = await QuizResults.findById(quizId).populate(
    "quizQuestionId"
  );

  if (
    !new ObjectId(req.user._id).equals(
      quizQuestions.quizQuestionId.doctorId || req.user.role !== "admin"
    )
  ) {
    res.status(400);
    throw new Error(
      "you can't change the appearance, only doctor or admin who make the quiz can access it"
    );
  }

  const quizResults = await QuizResults.findOneAndUpdate(
    { _id: quizId },
    { allowStudentToSeeResult },
    { new: true }
  );
  res.status(200).json({
    message: "updated successfully",
    data: quizResults,
  });
});
module.exports = {
  makeQuiz,
  submitQuiz,
  getStudentsResultsForAQuiz,
  getOneStudentResultsForManyQuiz,
  changeAppearanceQuizResults,
};
