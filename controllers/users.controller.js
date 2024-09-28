const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/users.model");
const Post = require("../models/posts.model");
const genJwt = require("../helpers/genJwt.helper");
const Course = require("../models/courses.model");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const config = require("../config/firebase.config");
const ForgetPassTokenUser = require("../models/forgetPass.model");
const { getMetadata, list } = require("firebase/storage");
const { QuizQuestions, QuizResults } = require("../models/quizes.model");
const responseObject = require("../helpers/response.helper");
// Initialize a firebase application
initializeApp(config);
// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();

//@desc     Register a user
//@route    POST /api/auth/register
//@access   PUBLIC
const registerUser = asyncHandler(async (req, res) => {
  const { name, password, username, role } = req.body;
  console.log({ body: req.body });

  if (!name || !password || !username || !role) {
    res.status(400);
    throw new Error("please complete all fields");
  }

  //check if the user exists or not
  const exists = !!(await User.findOne({ username }));
  if (exists) {
    res.status(400);
    throw new Error("User is already exist");
  }

  //hash pass
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);

  //Create user
  let storageRef, metadata, downloadURL, snapshot;
  //check if the user upload a file image or not first
  if (req?.file) {
    storageRef = ref(storage, `users/${username}/${username}-profile-img`);

    // Create file metadata including the content type
    metadata = {
      contentType: req.file.mimetype,
    };

    // Upload the file in the bucket storage
    snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

    // Grab the public url
    downloadURL = await getDownloadURL(snapshot.ref);
  }
  const newUserData = {
    name,
    password: hashedPass,
    username,
    role,
    user_image: req?.file
      ? downloadURL
      : "https://camo.githubusercontent.com/a09826e3c20bbb772e71f52a449fdc9db3f58dff6ee2a0ab67ffdfd415f18760/68747470733a2f2f75706c6f61642e77696b696d656469612e6f72672f77696b6970656469612f636f6d6d6f6e732f372f37632f50726f66696c655f6176617461725f706c616365686f6c6465725f6c617267652e706e67",
  };
  const newUser = await User.create(newUserData);
  const { password: password_, ...restNewUser } = newUser?._doc;
  res
    .status(201)
    .json(responseObject(true, "User created successfully", restNewUser));
});

//@desc     Login a user
//@route    POST /api/auth/login
//@access   Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400);
    throw new Error("complete all fields");
  }
  const user = await User.findOne({ username });
  if (!user) {
    res.status(400);
    throw new Error("This user isn't in system, Please Sign Up First");
  }
  const { password: pass, name, role, ...loggedUser } = user?._doc;
  //check if the password is wrong or not
  if (!(await bcrypt.compare(password, pass))) {
    res.status(401);
    throw new Error("try again, password is wrong");
  }

  res.status(200).json({
    username,
    name,
    role,
    token: genJwt(loggedUser?._id, role),
  });
});

//@desc     Login a user
//@route    POST /api/auth/login
//@access   Public
const getUserInfo = asyncHandler(async (req, res) => {
  // List all files in the storage bucket
  const storageRef = ref(storage, `users/${req.user.userImagesId}`);
  const files = await list(storageRef);
  // Iterate through each item in the list and retrieve download URLs
  const fileData = await Promise.all(
    files.items.map(async (item) => {
      const downloadURL = await getDownloadURL(item);
      const metadata = await getMetadata(item);
      return {
        name: item.name,
        downloadURL: downloadURL,
        type: metadata.contentType,
      };
    })
  );
  res.status(200).json({
    user: req.user,
    user_image: fileData.length > 0 ? fileData[0] : [],
  });
});
// @desc    update a user
//@route    POST /api/auth/update
//@access   PRIVATE
const updateUserInfo = asyncHandler(async (req, res) => {
  const {
    name,
    department,
    studentCourses,
    doctorCourses,
    year,
    newPassword,
    email,
  } = req.body;
  let salt, hashedPass;
  if (newPassword !== undefined) {
    //hash pass
    salt = await bcrypt.genSalt(10);
    hashedPass = await bcrypt.hash(password, salt);
  }
  //check of all the studentCourses are at the same year
  if (req.user.role === "student") {
    studentCourses?.forEach(async (sCourse) => {
      const c = await Course.findOne({
        _id: sCourse.course,
        year: year ? year : req.user.year,
      });
      if (!c) {
        res.status(400);
        throw new Error("course is not in the year of this student");
      }
    });
  }
  const userImagesId = uuidv4();
  //!! user image
  let storageRef, metadata, downloadURL, snapshot;
  if (req?.file) {
    storageRef = ref(
      storage,
      `users/${userImagesId}/${name ? name : req.user?.name}-profile-img`
    );

    // Create file metadata including the content type
    metadata = {
      contentType: req.file.mimetype,
    };

    // Upload the file in the bucket storage
    snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

    // Grab the public url
    downloadURL = await getDownloadURL(snapshot.ref);
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.params.id },
    {
      studentCourses,
      name,
      department,
      doctorCourses,
      year,
      userImagesId: req.file ? userImagesId : req.user.userImagesId,
      user_image: req?.file ? downloadURL : req.user.user_image,
      password: hashedPass,
      email,
    },
    { new: true, runValidators: true }
  );
  const completeUpdatedUser = await updatedUser.populate([
    "department",
    "studentCourses.course",
    "doctorCourses.course",
  ]);
  const { password, ...withoutPassUser } = { ...completeUpdatedUser?._doc };
  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({
    ...withoutPassUser,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "doctor") {
    await Post.deleteMany({ author: user._id });
    const quizQuestions = await QuizQuestions.find({ doctorId: user._id });
    quizQuestions.forEach(async (q) => {
      await QuizResults.deleteMany({ quizQuestionId: q._id });
    });
    await QuizQuestions.deleteMany({ doctorId: user._id });
  }
  if (user.role === "student") {
    await QuizResults.deleteMany({ studentId: user._id });
  }
  await User.deleteOne({ _id: req.params.id });
  res.json({ message: "User removed" });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { skip, limit } = req.pagination;
  const {
    filterByCoursesIds,
    filterByDepartmentId,
    filterByYear,
    filterByRole,
  } = req.query;
  const searchObjDepartCourses =
    filterByDepartmentId && filterByCoursesIds?.length > 0
      ? {
          department: filterByDepartmentId,
          $or: [...filterByCoursesIds].map((courseId) => ({
            course: courseId,
          })),
        }
      : filterByDepartmentId
      ? { department: filterByDepartmentId }
      : filterByCoursesIds
      ? {
          $or: [...filterByCoursesIds].map((courseId) => ({
            course: courseId,
          })),
        }
      : {};

  //search by content or title

  let query;
  if (req.query.search !== undefined) {
    if (req.query.search != "") {
      query = {
        $or: [{ name: { $regex: req.query.search, $options: "i" } }],
      };
    }
  }
  if (req.query.searchByNationalId !== undefined) {
    if (req.query.searchByNationalId != "") {
      query =
        req.query.search !== undefined
          ? {
              $or: [
                query.$or[0],
                {
                  nationalId: {
                    $regex: req.query.searchByNationalId,
                    $options: "i",
                  },
                },
              ],
            }
          : {
              $or: [
                {
                  nationalId: {
                    $regex: req.query.searchByNationalId,
                    $options: "i",
                  },
                },
              ],
            };
    }
  }
  const yearAndRole =
    filterByYear && filterByRole
      ? { year: filterByYear, role: filterByRole }
      : filterByYear
      ? { year: filterByYear }
      : filterByRole
      ? { role: filterByRole }
      : {};
  console.log({
    ...query,
    ...searchObjDepartCourses,
    ...yearAndRole,
  });
  const users = await User.find({
    ...query,
    ...searchObjDepartCourses,
    ...yearAndRole,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  res.status(200).json({ count: users.length, data: users });
});

const forgetPass = asyncHandler(async (req, res) => {
  //generate token ==> make sure token isn't generated before;
  //insert it to db
  const { nationalId } = req.body;
  const user = await User.findOne({ nationalId: nationalId });
  console.log("👉🔥 ", { user, nationalId });

  if (!user) {
    res.status(400);
    throw new Error("user not found");
  }
  const generateRandomToken = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };
  let generatedToken = generateRandomToken();
  const allTokens = await ForgetPassTokenUser.find({}, { token: 1 });
  while (allTokens.includes(generatedToken)) {
    generatedToken = generateRandomToken();
  }
  //send email
  // Create a transporter object
  let transporter = nodemailer.createTransport({
    service: "gmail", // You can use other services like Yahoo, Outlook, etc.
    auth: {
      user: "collegeconnect55@gmail.com", // Your email address
      pass: "mmpfcpghdzfismet", // Your email password or app-specific password
    },
  });
  await ForgetPassTokenUser.create({ user: user?._id, token: generatedToken });

  // Setup email data
  let mailOptions = {
    from: "collegeconnect55@gmail.com",
    to: user?.email,
    subject: "RESET PASSWORD",
    text: `TOKEN IS ${generatedToken}`,
  };
  let info = await transporter.sendMail(mailOptions);
  console.log("Message sent: %s", info.messageId, { info }, user?.email);

  res.status(200).json({
    message: "a token sent to your email",
  });
});
const enterToken = asyncHandler(async (req, res) => {
  const { token, nationalId } = req.body;
  const user = await User.findOne({ nationalId: nationalId });
  console.log("👉🔥 ", user, nationalId);

  if (!user) {
    res.status(400);
    throw new Error("user not found");
  }
  const forgetToken = await ForgetPassTokenUser.findOneAndUpdate(
    { token, user: user?._id },
    { verified: true }
  );
  if (!forgetToken) {
    res.status(400);
    throw new Error("the token is wrong");
  }

  res.status(200).send({
    message: "now you can update your password",
  });
});
const updatePass = asyncHandler(async (req, res) => {
  const { newPass, nationalId } = req.body;

  //hash pass
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(newPass, salt);
  const user = await User.findOne({ nationalId: nationalId });
  console.log("👉🔥 ", user, nationalId);

  if (!user) {
    res.status(400);
    throw new Error("user not found");
  }
  const token = await ForgetPassTokenUser.findOne({
    user: user?._id,
    verified: true,
  });
  if (!token) {
    res.status(400);
    throw new Error("something went wrong");
  }
  console.log("👉🔥 ", { token });

  let delRes = await ForgetPassTokenUser.deleteMany({
    token: token.token,
    user: user?._id,
  });
  console.log("👉🔥 ", { delRes });

  await User.updateOne({ _id: user?._id }, { password: hashedPass });
  res.status(200).json({
    message: "password updated successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  getUserInfo,
  updateUserInfo,
  deleteUser,
  getAllUsers,
  forgetPass,
  enterToken,
  updatePass,
};
