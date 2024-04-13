const asyncHandler = require("express-async-handler");
const { QuizQuestions, QuizResults } = require("../models/quizes.model");
const ObjectId = require("mongoose").Types.ObjectId;

const Course = require("../models/courses.model");
const Department = require("../models/departments.model");
const User = require("../models/users.model");
const makeQuiz = asyncHandler(async (req, res) => {
  const { department, course, doctorId, questions, quizTitle } = req.body;
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
    quizTitle,
  });
  res.status(201).json({ message: "created successfully", data: quiz });
});

const submitQuiz = asyncHandler(async (req, res) => {
  const { studentId, quizQuestionId, answers, course, department } = req.body;
  console.log(req.user);

  //check if it is a student or not
  if (req.user.role !== "student") {
    res.status(400);
    throw new Error("only students can submit answers for that quiz");
  }

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

  //calc result
  const quizQuestions = await QuizQuestions.findById(quizQuestionId);
  if (!quizQuestions) {
    res.status(400);
    throw new Error("quiz questions don't exist");
  }
  //check if the user who submit inside that quiz has already enrolled in that course
  console.log(req.user.studentCourses);
  if (
    req.user.studentCourses.find(
      (c) => !!new ObjectId(c.course._id).equals(quizQuestions.course)
    ) === undefined
  ) {
    res.status(400);
    throw new Error(
      "The student must be enrolled to that course so he can submit his answer"
    );
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
  // Function to get student quizzes filtered by course
  // async function getStudentQuizzesByCourse(studentId, courseId) {
  //   try {
  //     // First, find all quiz results for the student
  //     const quizResults = await QuizResults.find({ studentId });

  //     // Extract the quiz question IDs from the quiz results
  //     const quizQuestionIds = quizResults.map(
  //       (result) => result.quizQuestionId
  //     );
  //     console.log("===---=====---", quizQuestionIds);

  //     // Now, find the quiz questions for the extracted IDs and filter by course
  //     const studentQuizzes = await QuizQuestions.aggregate([
  //       // Match quiz questions by their IDs
  //       { $match: { _id: quizQuestionIds[0] } },
  //       // Lookup to get course details from the referenced Course model
  //       // {
  //       //   $lookup: {
  //       //     from: "courses", // Assuming your Course model is named 'Course'
  //       //     localField: "_id",
  //       //     foreignField: "course",
  //       //     as: "course",
  //       //   },
  //       // },
  //       // // Unwind the courseDetails array
  //       // { $unwind: "$courseDetails" },
  //       // // Match quiz questions by the specified course ID
  //       // { $match: { "courseDetails._id": courseId } },
  //     ]);
  //     console.log("===---=====---", studentQuizzes);
  //     return studentQuizzes;
  //   } catch (error) {
  //     console.error("Error fetching student quizzes:", error);
  //     throw error;
  //   }
  // }
  const { studentId } = req.params;
  const { courseId, departmentId } = req.query;
  console.log({ studentId, courseId });
  const match =
    courseId && departmentId
      ? { course: courseId, department: departmentId }
      : courseId
      ? { course: courseId }
      : departmentId
      ? { department: departmentId }
      : {};
  const studentQuizzes = await QuizResults.find({
    studentId,
    // allowStudentToSeeResult: true,
  }).populate([
    {
      path: "quizQuestionId",
      match,
    },
    "studentId",
  ]);
  const data = studentQuizzes.filter((q) => q.quizQuestionId !== null);

  // console.log({ studentId, courseId });
  // getStudentQuizzesByCourse(studentId, courseId)
  //   .then((studentQuizzes) => {
  //   })
  //   .catch((error) => {
  //     res.status(400);
  //     throw new Error(error.message);
  //   });
  res.status(200).json({ count: data.length, data });
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
const getSingleQuizQuestion = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const quizQuestion = await QuizQuestions.findById(quizId);
  if (!quizQuestion) {
    res.status(400);
    throw new Error("quiz question doesn't exist");
  }
  //who can access it ?
  //student who enrolled to the same course
  //doctor who made the quiz
  //admin
  if (req.user.role === "admin") {
    return res.status(200).json({ data: quizQuestion });
  }

  if (
    req.user.role === "student" &&
    !!req.user.studentCourses.find((c) => c.course === quizQuestion.course) ===
      undefined
  ) {
    res.status(400);
    throw new Error(
      "The student must be enrolled to that course so he can submit his answer"
    );
  }
  if (
    req.user.role === "doctor" &&
    !new ObjectId(req.user._id).equals(quizQuestion.doctorId)
  ) {
    res.status(400);
    throw new Error(
      "you can't get questions, only doctor who make the quiz can access it"
    );
  }

  res.status(200).json({ data: quizQuestion });
});
const deleteQuizQuestion = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const quiz = await QuizQuestions.findById(quizId);

  if (!quiz) {
    res.status(400);
    throw new Error("quiz doesn't exist");
  }
  //check if the user is the doctor who made the quiz or the user is the admin
  if (
    !new ObjectId(req.user._id).equals(quiz.doctorId) ||
    req.role === "admin"
  ) {
    res.status(400);
    throw new Error(
      "you can't delete questions, only doctor who make the quiz can access it"
    );
  }
  //delete the questions and all its results
  await QuizQuestions.deleteMany({ _id: quizId });
  await QuizResults.deleteMany({ quizQuestionId: quizId });
  res.status(200).json({ message: "deleted successfully" });
});
const updateQuizQuestion = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { quizTitle, department, course, questions } = req.body;
  const quiz = await QuizQuestions.findById(quizId);
  if (!quiz) {
    res.status(400);
    throw new Error("quiz doesn't exist");
  }
  //check if the user is the doctor who made the quiz or the user is the admin
  if (
    !new ObjectId(req.user._id).equals(quiz.doctorId) ||
    req.role === "admin"
  ) {
    res.status(400);
    throw new Error(
      "you can't update questions, only doctor who make the quiz can access it"
    );
  }
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
  //update the questions and all its results
  const quizQuestions = await QuizQuestions.findOneAndUpdate(
    { _id: quizId },
    { quizTitle, department, course, questions },
    { new: true, runValidators: true }
  );
  res
    .status(200)
    .json({ message: "updated successfully", data: quizQuestions });
});
const getQuizesForADoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const quizes = await QuizQuestions.find({ doctorId });
  res.status(200).json({ count: quizes.length, data: quizes });
});
module.exports = {
  makeQuiz,
  submitQuiz,
  getStudentsResultsForAQuiz,
  getOneStudentResultsForManyQuiz,
  changeAppearanceQuizResults,
  getSingleQuizQuestion,
  deleteQuizQuestion,
  updateQuizQuestion,
  getQuizesForADoctor,
};
