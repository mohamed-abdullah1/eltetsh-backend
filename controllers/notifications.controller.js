const asyncHandler = require("express-async-handler");
const ClientToken = require("../models/clientTokens.model");
const { QuizQuestions } = require("../models/quizes.model");
const FCM = require("fcm-node");
const User = require("../models/users.model");
const fcm = new FCM(process.env.FIREBASE_SERVER_KEY);

const sendToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  console.log("👉🔥 ", token);
  await ClientToken.deleteMany({ user: req.user._id });
  if (!token) {
    res.status(400);
    throw new Error("please add token");
  }
  //insert token
  const newToken = await ClientToken.create({
    token,
    user: req.user._id,
  });
  res.status(200).json({
    message: "Add token successfully",
    token: newToken.token,
  });
});
//=========================
const notifyWithQuiz = asyncHandler(async (req, res) => {
  const { quizQuestionId, messageBody, title } = req.body;
  const quiz = await QuizQuestions.findById(quizQuestionId);
  //check if quizExist or not
  if (!quiz) {
    res.status(400);
    throw new Error("quiz doesn't exist");
  }
  //get the tokens of students who enrolled into the quiz course
  const studentsEnrolledIntoCourse = await User.find(
    {
      studentCourses: { $in: [quiz.course] },
      role: "student",
    },
    { _id: 1 }
  );
  //get the tokens of students
  const tokens = await ClientToken.find({
    user: { $in: studentsEnrolledIntoCourse },
  });
  //send notification
  const fcmMessage = {
    registration_ids: tokens, // Array of FCM registration tokens
    notification: {
      title: title,
      body: messageBody,
    },
  };
  fcm.send(fcmMessage, function (err, response) {
    if (err) {
      console.error("Error sending notification:", err);
      res.status(500);
      throw new Error("Failed to send notification");
    } else {
      res.status(200).json({
        success: true,
        response: response,
        message: "Successfully sent notification:",
      });
    }
  });
});

module.exports = {
  sendToken,
  notifyWithQuiz,
};
