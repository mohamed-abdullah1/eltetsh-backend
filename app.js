const dotenv = require("dotenv").config();
const express = require("express");
const goalsRouter = require("./routes/goals.router");
const usersRouter = require("./routes/users.router");
const { errorMiddleware } = require("./middleware/error.middleware");

const app = express();

const colors = require("colors");
const connectDB = require("./config/db.config");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

connectDB();
app.use("/api/goals", goalsRouter);
app.use("/api/auth/", usersRouter);
app.use(errorMiddleware);

const port = process.env.PORT || 2000;

app.listen(port, () =>
  console.log(`SERVER IS RUNNING ON PORT ${port}`.bgMagenta)
);
