//packages
const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const colors = require("colors");

//routes
const testRouter = require("./helpers/test.helper");
const usersRouter = require("./routes/users.router");
const deviceRouter = require("./routes/device.router");
const clientRouter = require("./routes/client.router");
const appointmentRouter = require("./routes/appointment.router");
const invoiceRouter = require("./routes/invoice.router");
const drinkFoodRouter = require("./routes/drinkFood.router");
// const notificationRouter = require("./routes/notification.router");
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
app.use("/api/device/", deviceRouter);
app.use("/api/client/", clientRouter);
app.use("/api/appointment/", appointmentRouter);
app.use("/api/invoice/", invoiceRouter);
app.use("/api/drinkFood/", drinkFoodRouter);

app.use(errorMiddleware);
app.use("*", function (_, res) {
  res.status(404).send({ message: "NOT FOUND" });
});

const port = process.env.PORT || 2000;

app.listen(port, () =>
  console.log(`SERVER IS RUNNING ON PORT ${port}`.bgMagenta)
);
