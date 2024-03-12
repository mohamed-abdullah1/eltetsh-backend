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
      req.user = await User.findOne({ _id: decoded?.id }, { password: false });
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
module.exports = verifyToken;
