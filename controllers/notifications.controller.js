// const asyncHandler = require("express-async-handler");
// const ClientToken = require("../models/clientTokens.model");
// const { QuizQuestions } = require("../models/quizes.model");
// const Post = require("../models/posts.model");
// const FCM = require("fcm-node");
// const User = require("../models/users.model");
// const fcm = new FCM(process.env.FIREBASE_SERVER_KEY);

// const sendToken = asyncHandler(async (req, res) => {
//   const { token } = req.body;
//   console.log("👉🔥 ", token);
//   await ClientToken.deleteMany({ user: req.user._id });
//   if (!token) {
//     res.status(400);
//     throw new Error("please add token");
//   }
//   const oldToken = await ClientToken.findOne({ user: req.user._id });
//   if (oldToken) {
//     const updatedClientToken = await ClientToken.updateOne(
//       { user: req.user._id },
//       { token }
//     );
//     return res.status(200).json({
//       message: "update token successfully",
//       token: updatedClientToken.token,
//     });
//   }
//   //insert token
//   const newToken = await ClientToken.create({
//     token,
//     user: req.user._id,
//   });
//   res.status(200).json({
//     message: "Add token successfully",
//     token: newToken.token,
//   });
// });
// //=========================
// const notifyWithQuiz = asyncHandler(async (req, res) => {
//   const { quizQuestionId, messageBody, title } = req.body;
//   const quiz = await QuizQuestions.findById(quizQuestionId);
//   //check if quizExist or not
//   if (!quiz) {
//     res.status(400);
//     throw new Error("quiz doesn't exist");
//   }
//   //get the tokens of students who enrolled into the quiz course
//   const studentsEnrolledIntoCourse = await User.find(
//     {
//       "studentCourses.course": quiz.course,
//       role: "student",
//     },
//     { _id: 1 }
//   );
//   console.log("👉🔥 ", {
//     studentsEnrolledIntoCourse: studentsEnrolledIntoCourse.map((x) => x._id),
//   });

//   //get the tokens of students
//   const tokens = await ClientToken.find({
//     user: { $in: studentsEnrolledIntoCourse },
//   });
//   console.log("👉🔥 ", { tokens });
//   if (tokens.length === 0) {
//     res.status(400);
//     throw new Error(
//       "Can't send tokens because no users enrolled into the quiz course or their tokens aren't saved into database"
//     );
//   }
//   console.log(
//     "👉🔥 ",
//     Array.from(new Set(tokens.map((item) => JSON.stringify(item))))
//   );
//   let seen = {};
//   //send notification
//   console.log("👉🔥 ", [...new Set(tokens.map((t) => t.token))]);

//   const fcmMessage = {
//     registration_ids: [...new Set(tokens.map((t) => t.token))], // Array of FCM registration tokens
//     notification: {
//       title: title,
//       body: messageBody,
//     },
//   };
//   fcm.send(fcmMessage, function (err, response) {
//     console.log("🔥🔥🔥🔥🔥🔥🔥 ", typeof err, { err, fcmMessage });

//     if (err) {
//       // console.error("", err);
//       res.status(400).json({ msg: err });
//     } else {
//       console.log("👉🔥✅ ", "SUCCESS!!");

//       res.status(200).json({
//         success: true,
//         response: response,
//         message: "Successfully sent notification:",
//       });
//     }
//   });
// });
// const notifyWithPost = asyncHandler(async (req, res) => {
//   const { postId, messageBody, title } = req.body;
//   const post = await Post.findById(postId);
//   //check if quizExist or not
//   if (!post) {
//     res.status(400);
//     throw new Error("post doesn't exist");
//   }
//   //get the tokens of students who enrolled into the quiz course
//   const studentsEnrolledIntoCourse = await User.find(
//     {
//       "studentCourses.course": { $in: post.course },
//       role: "student",
//     },
//     { _id: 1 } // to get the ids only
//   );
//   console.log("👉🔥 ", {
//     studentsEnrolledIntoCourse: studentsEnrolledIntoCourse.map((x) => x._id),
//   });

//   //get the tokens of students
//   const tokens = await ClientToken.find({
//     user: { $in: studentsEnrolledIntoCourse },
//   });
//   console.log("👉🔥 ", { tokens });
//   if (tokens.length === 0) {
//     res.status(400);
//     throw new Error(
//       "Can't send tokens because no users enrolled into the quiz course or their tokens aren't saved into database"
//     );
//   }

//   const fcmMessage = {
//     registration_ids: [...new Set(tokens.map((t) => t.token))], // Array of FCM registration tokens
//     notification: {
//       title: title,
//       body: messageBody,
//     },
//   };
//   fcm.send(fcmMessage, function (err, response) {
//     if (err) {
//       res.status(400).json({ msg: err });
//     } else {
//       res.status(200).json({
//         success: true,
//         response: response,
//         message: "Successfully sent notification:",
//       });
//     }
//   });
// });

// module.exports = {
//   sendToken,
//   notifyWithQuiz,
//   notifyWithPost,
// };
