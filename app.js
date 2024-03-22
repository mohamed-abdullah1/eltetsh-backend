//packages
const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const colors = require("colors");

//routes
const usersRouter = require("./routes/users.router");
const nationalIdRouter = require("./routes/nationalId_user.router");
const courseRouter = require("./routes/courses.router");
const departmentRouter = require("./routes/departments.router");
const postRouter = require("./routes/posts.router");
const testRouter = require("./helpers/test.helper");
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
app.use("/api/auth/", usersRouter);
app.use("/api/nationalId_user/", nationalIdRouter);
app.use("/api/courses/", courseRouter);
app.use("/api/departments/", departmentRouter);
app.use("/api/posts/", postRouter);

app.use(errorMiddleware);
app.use("*", function (_, res) {
  res.status(404).send({ message: "NOT FOUND" });
});

const port = process.env.PORT || 2000;

app.listen(port, () =>
  console.log(`SERVER IS RUNNING ON PORT ${port}`.bgMagenta)
);
