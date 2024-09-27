//packages
const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const colors = require("colors");

//routes
const testRouter = require("./helpers/test.helper");
const usersRouter = require("./routes/users.router");
const courseRouter = require("./routes/courses.router");
const departmentRouter = require("./routes/departments.router");
const postRouter = require("./routes/posts.router");
const quizRouter = require("./routes/quizes.router");
const semesterScheduleRouter = require("./routes/semesterSchedule.router");
const resultsRouter = require("./routes/results.router");
const notificationRouter = require("./routes/notification.router");
//middlewares
const { errorMiddleware } = require("./middleware/error.middleware");

//db connection
const connectDB = require("./config/db.config");
const paginationMiddleware = require("./middleware/pagination.middleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(paginationMiddleware);

connectDB();
app.use("/", testRouter);
// app.use("/api/auth/", usersRouter);
// app.use("/api/courses/", courseRouter);
// app.use("/api/departments/", departmentRouter);
// app.use("/api/posts/", postRouter);
// app.use("/api/quiz/", quizRouter);
// app.use("/api/semester-schedule/", semesterScheduleRouter);
// app.use("/api/results/", resultsRouter);
// app.use("/api/notification/", notificationRouter);

app.use(errorMiddleware);
app.use("*", function (_, res) {
  res.status(404).send({ message: "NOT FOUND" });
});

const port = process.env.PORT || 2000;

app.listen(port, () =>
  console.log(`SERVER IS RUNNING ON PORT ${port}`.bgMagenta)
);
