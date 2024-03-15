//packages
const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const colors = require("colors");

//routes
const usersRouter = require("./routes/users.router");
const nationalIdRouter = require("./routes/nationalId_user.router");
const testRouter = require("./helpers/test.helper");
//middlewares
const { errorMiddleware } = require("./middleware/error.middleware");

//db connection
const connectDB = require("./config/db.config");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

connectDB();
app.use("/", testRouter);
app.use("/api/auth/", usersRouter);
app.use("/api/nationalId_user/", nationalIdRouter);
app.use(errorMiddleware);

const port = process.env.PORT || 2000;

app.listen(port, () =>
  console.log(`SERVER IS RUNNING ON PORT ${port}`.bgMagenta)
);
