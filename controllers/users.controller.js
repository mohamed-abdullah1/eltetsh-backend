const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/users.model");
const Post = require("../models/posts.model");
const genJwt = require("../helpers/genJwt.helper");
const Course = require("../models/courses.model");
const { v4: uuidv4 } = require("uuid");

const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const config = require("../config/firebase.config");
const { getMetadata, list } = require("firebase/storage");
const { QuizQuestions, QuizResults } = require("../models/quizes.model");
// Initialize a firebase application
initializeApp(config);
// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();
//@desc     Register a user
//@route    POST /api/auth
//@access   PRIVATE ADMIN ONLY
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    password,
    email,
    nationalId,
    role,
    department,
    studentCourses = [],
    doctorCourses = [],
    year,
  } = req.body;
  console.log({ body: req.body });

  if (!name || !password || !email || !nationalId || !role) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  //check year is there or not
  if (role === "student" && year === undefined) {
    res.status(400);
    throw new Error("add year for that student");
  }

  //!CHECK IF THE COURSE AND DEPARTMENT ENTERED BY THE USER ARE CONVIENENT
  const courseExists = await Promise.all(
    [...studentCourses, ...doctorCourses].map(async (item) => {
      return !!(await Course.findOne({ _id: item.course, department }));
    })
  );
  //check of all the studentCourses are at the same year
  if (role === "student") {
    studentCourses.forEach(async (sCourse) => {
      const c = await Course.findOne({ _id: sCourse.course, year: year });
      if (c) {
        res.status(400);
        throw new Error("course is not in the year of this student");
      }
    });
  }
  if (courseExists.includes(false)) {
    res.status(400);
    throw new Error("Course is not in that department");
  }
  //
  if (role === "student" && (!studentCourses || !year || !department)) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  if (role === "doctor" && (!doctorCourses || !department)) {
    res.status(400);
    throw new Error("please complete all fields");
  }
  //check if the user exists or not
  const exists = !!(await User.findOne({ nationalId }));
  if (exists) {
    res.status(400);
    throw new Error("User is already exist");
  }

  //hash pass
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);
  const userImagesId = uuidv4();

  //check course year same as the student year

  //create user
  const newUserData =
    role === "student"
      ? {
          name,
          password: hashedPass,
          email,
          nationalId: nationalId + "",
          role,
          department,
          studentCourses,
          year,
          userImagesId,
        }
      : {
          name,
          password: hashedPass,
          email,
          nationalId: nationalId + "",
          role,
          department,
          doctorCourses,
          userImagesId,
        };
  const newUser = await User.create(newUserData);
  //! USER IMAGE
  let storageRef, metadata, downloadURL, snapshot;
  if (req?.file) {
    storageRef = ref(storage, `users/${userImagesId}/${name}-profile-img`);

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
    user_image: req?.file
      ? {
          name: req.file.originalname,
          type: req.file.mimetype,
          downloadURL: downloadURL,
        }
      : {},
    token: genJwt(newUser?._doc?._id, newUser?._doc?.role),
  });
});

//@desc     Login a user
//@route    POST /api/auth/login
//@access   Public
const loginUser = asyncHandler(async (req, res) => {
  const { nationalId, password } = req.body;
  if (!nationalId || !password) {
    res.status(400);
    throw new Error("complete all fields");
  }
  const user = await User.findOne({ nationalId }).populate([
    "department",
    "studentCourses.course",
    "doctorCourses.course",
  ]);
  if (!user) {
    res.status(400);
    throw new Error("This user isn't in system, Please Sign Up First");
  }
  const { password: pass, name, email, role, ...loggedUser } = user?._doc;

  if (!(await bcrypt.compare(password, pass))) {
    res.status(401);
    throw new Error("try again, password is wrong");
  }
  res.status(200).json({
    name,
    email,
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
  const { name, department, studentCourses, doctorCourses, year, newPassword } =
    req.body;
  let salt, hashedPass;
  if (newPassword !== undefined) {
    //hash pass
    salt = await bcrypt.genSalt(10);
    hashedPass = await bcrypt.hash(password, salt);
  }
  //check of all the studentCourses are at the same year
  if (req.user.role === "student") {
    studentCourses.forEach(async (sCourse) => {
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
  let storageRef = ref(storage, `users/${req.user.userImagesId}`);
  let files = await list(storageRef);
  // Iterate through each item in the list and retrieve download URLs
  let fileData = await Promise.all(
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

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.params.id },
    {
      studentCourses,
      name,
      department,
      doctorCourses,
      year,
      userImagesId: req.file ? userImagesId : req.user.userImagesId,
      password: hashedPass,
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
  if (req?.file) {
    storageRef = ref(storage, `users/${userImagesId}/${userImagesId}`);

    // Create file metadata including the content type
    let metadata = {
      contentType: req.file?.mimetype,
    };

    // Upload the file in the bucket storage
    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file?.buffer,
      metadata
    );
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

    // Grab the public url
    const downloadURL = await getDownloadURL(snapshot.ref);
    return res.status(200).json({
      ...withoutPassUser,
      user_image: {
        name: req.file.originalname,
        type: req.file.mimetype,
        downloadURL: downloadURL,
      },
    });
  }

  res.status(200).json({
    ...withoutPassUser,
    user_image: {
      ...fileData[0],
    },
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

module.exports = {
  registerUser,
  loginUser,
  getUserInfo,
  updateUserInfo,
  deleteUser,
  getAllUsers,
};
