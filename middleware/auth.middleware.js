const jwt = require("jsonwebtoken");
const User = require("../models/users.model");
const asyncHandler = require("express-async-handler");
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      //get token
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log({ decoded });
      req.user = await User.findOne(
        { _id: decoded?.id },
        { password: false }
      ).populate([
        "department",
        "studentCourses.course",
        "doctorCourses.course",
      ]);
      next();
    } catch (err) {
      console.log(err);
      res.status(401);
      throw new Error("not authorized");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("not authorized , no token");
  }
});
const ObjectId = require("mongoose").Types.ObjectId;

const isUserOrAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.user;
  console.log({ id, userId: req.user._id });
  const anotherObjectId = new ObjectId(id);

  if (req.user._id.equals(anotherObjectId) || role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("not authorized , user or admin only can edit this info");
  }
});
const verifyDoctor = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      //get token
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log({ decoded });
      if (decoded?.role !== "doctor") {
        res.status(401);
        throw new Error("not authorized, Doctor only can access it");
      }
      req.user = await User.findOne(
        { _id: decoded?.id },
        { password: false }
      ).populate([
        "department",
        "studentCourses.course",
        "doctorCourses.course",
      ]);
      next();
    } catch (err) {
      console.log(err);
      res.status(401);
      throw new Error("not authorized");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("not authorized , no token");
  }
});
const verifyDoctorOrAdmin = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      //get token
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log({ decoded });
      if (decoded?.role !== "doctor" && decoded?.role !== "admin") {
        res.status(401);
        throw new Error("not authorized, Doctor or admin only can access it");
      }
      req.user = await User.findOne(
        { _id: decoded?.id },
        { password: false }
      ).populate([
        "department",
        "studentCourses.course",
        "doctorCourses.course",
      ]);
      next();
    } catch (err) {
      console.log(err);
      res.status(401);
      throw new Error("not authorized");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("not authorized , no token");
  }
});
const verifyAdmin = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      //get token
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.role !== "admin") {
        res.status(401);
        throw new Error("not authorized, Admin only can access it");
      }
      req.user = await User.findOne({ _id: decoded?.id }, { password: false });
      next();
    } catch (err) {
      console.log(`err ${err}`.red);
      res.status(500);
      throw new Error(err);
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("not authorized , no token");
  }
});

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyDoctor,
  isUserOrAdmin,
  verifyDoctorOrAdmin,
};
