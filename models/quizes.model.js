const mongoose = require("mongoose");

// Schema for quiz questions
const QuizQuestionsSchema = new mongoose.Schema({
  quizTitle: {
    type: String,
    required: [true, "quiz title is required !"],
  },
  department: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Department",
    require: [true, "department required"],
  },
  course: {
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
      selectedOptionId: { type: mongoose.SchemaTypes.ObjectId },
    },
  ],
  result: Number,
  allowStudentToSeeResult: { type: Boolean, default: false },
});
// Adding virtual properties to include course and department
QuizResultSchema.virtual("courseAndDepartment").get(async function () {
  const quizQuestion = await this.populate("quizQuestionId");
  const course = quizQuestion.quizQuestionId.course;
  const department = quizQuestion.quizQuestionId.department;

  return {
    course,
    department,
  };
});
const QuizQuestions = mongoose.model("QuizQuestion", QuizQuestionsSchema);
const QuizResults = mongoose.model("QuizResult", QuizResultSchema);

module.exports = { QuizQuestions, QuizResults };
