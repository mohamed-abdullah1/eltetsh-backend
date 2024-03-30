const mongoose = require("mongoose");

// Schema for quiz questions
const QuizQuestionsSchema = new mongoose.Schema({
  department_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Department",
    require: [true, "department required"],
  },
  course_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Course",
    require: [true, "course required"],
  },
  title: String,
  doctorId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    require: [true, "doctor id required"],
  },
  questions: [
    {
      title: { type: String, require: [true, "question title required"] },
      options: [
        {
          content: { type: String, require: [true, "option content required"] },
          isCorrect: { type: Boolean, require: [true, "isCorrect required"] },
        },
      ],
      question_score: {
        type: Number,
        require: [true, "question score required"],
      },
    },
  ],
});

// Schema for quiz results
const QuizResultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: [true, "student id required"],
  },
  quizQuestionId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "QuizQuestion",
    required: [true, "quiz question ref required"],
  },
  answers: [
    {
      questionId: { type: mongoose.SchemaTypes.ObjectId },
      answer: { type: mongoose.SchemaTypes.ObjectId },
    },
  ],
  result: Number,
});

const QuizQuestions = mongoose.model("QuizQuestion", QuizQuestionsSchema);
const QuizResults = mongoose.model("QuizResult", QuizResultSchema);

module.exports = { QuizQuestions, QuizResults };
