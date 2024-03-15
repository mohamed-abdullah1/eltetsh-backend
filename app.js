const dotenv = require("dotenv").config();
const express = require("express");
const usersRouter = require("./routes/users.router");
const nationalIdRouter = require("./routes/nationalId_user.router");
const { errorMiddleware } = require("./middleware/error.middleware");
const cors = require("cors");

const app = express();

const colors = require("colors");
const connectDB = require("./config/db.config");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

connectDB();
app.get("/", (req, res) => res.status(200).json({ msg: "server is live 🖖🏼" }));
app.use("/api/auth/", usersRouter);
app.use("/api/nationalId_user/", nationalIdRouter);
app.use(errorMiddleware);

const port = process.env.PORT || 2000;

app.listen(port, () =>
  console.log(`SERVER IS RUNNING ON PORT ${port}`.bgMagenta)
);
