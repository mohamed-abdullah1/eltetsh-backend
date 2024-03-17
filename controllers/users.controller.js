const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/users.model");
const genJwt = require("../helpers/genJwt.helper");
const NationalId_User = require("../models/nationalId_user.model");
//@desc     Register a user
//@route    POST /api/auth
//@access   PUBLIC
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    password,
    email,
    nationalId,
    role,
    department,
    studentCourses,
    doctorCourses,
    year,
  } = req.body;
  if (!name || !password || !email || !nationalId || !role) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  if (role === "student" && (!studentCourses || !year || !department)) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  if (role === "doctor" && (!doctorCourses || !department)) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  //check if the user exists or not
  const exists = !!(await User.findOne({ email }));
  if (exists) {
    res.status(400);
    throw new Error("User is already exist");
  }
  //check if the national_id of this user is in the db or not
  const nationalIdUser = await NationalId_User.findOne({ nationalId });
  const isExistNationalId = !!nationalIdUser;
  if (!isExistNationalId) {
    res.status(400);
    throw new Error("This user's NationalId isn't allowed to register");
  }
  //change the NationalIds_user and sign it with registerInSystem :true
  await NationalId_User.updateOne(
    { nationalId },
    { $set: { registeredInSystem: true } },
    { runValidators: true, new: true }
  );
  //check if the role in req equals the role in nationalIdUsers
  if (nationalIdUser?.role !== role) {
    res.status(400);
    throw new Error(
      "The role you enter doesn't match the role associated to the nationalId"
    );
  }

  //hash pass
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);

  //create user
  const newUserData =
    role === "student"
      ? {
          name,
          password: hashedPass,
          email,
          nationalId: nationalId + "",
          role,
          nationalIdUser: nationalIdUser?._id,
          department,
          studentCourses,
          year,
        }
      : {
          name,
          password: hashedPass,
          email,
          nationalId: nationalId + "",
          role,
          nationalIdUser: nationalIdUser?._id,
          department,
          doctorCourses,
        };
  const newUser = await User.create(newUserData);

  res.status(201).json({
    _id: newUser?._doc?._id,
    name: newUser?._doc?.name,
    email: newUser?._doc?.email,
    nationalId: newUser?._doc?.nationalId,
    createdAt: newUser?._doc?.createdAt,
    updatedAt: newUser?._doc?.updatedAt,
    role: newUser?._doc?.role,
    department: newUser?._doc?.department,
    studentCourses: newUser?._doc?.studentCourses,
    doctorCourses: newUser?._doc?.doctorCourses,
    year: newUser?._doc?.year,
    token: genJwt(newUser?._doc?._id, newUser?._doc?.role),
  });
});

//@desc     Login a user
//@route    POST /api/auth/login
//@access   Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("complete all fields");
  }
  const user = await User.findOne({ email }).populate([
    "department",
    "studentCourses.course",
    "doctorCourses",
  ]);
  if (!user) {
    res.status(400);
    throw new Error("This user isn't in system, Please Sign Up First");
  }
  const { password: pass, ...loggedUser } = user?._doc;

  if (!(await bcrypt.compare(password, pass))) {
    res.status(401);
    throw new Error("try again, password is wrong");
  }
  res
    .status(200)
    .json({ ...loggedUser, token: genJwt(loggedUser?._id, loggedUser?.role) });
});

module.exports = {
  registerUser,
  loginUser,
};
