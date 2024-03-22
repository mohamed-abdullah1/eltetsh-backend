const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/users.model");
const genJwt = require("../helpers/genJwt.helper");
const NationalId_User = require("../models/nationalId_user.model");

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
    studentCourses,
    doctorCourses,
    year,
  } = req.body;
  if (!name || !password || !email || !nationalId || !role) {
    res.status(400);
    throw new Error("please complete all fields");
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
  const userImagesId = uuidv4();

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
          userImagesId,
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
          userImagesId,
        };
  const newUser = await User.create(newUserData);
  //!! user image
  const storageRef = ref(storage, `users/${userImagesId}/${name}-profile-img`);

  // Create file metadata including the content type
  const metadata = {
    contentType: req.file.mimetype,
  };

  // Upload the file in the bucket storage
  const snapshot = await uploadBytesResumable(
    storageRef,
    req.file.buffer,
    metadata
  );
  //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

  // Grab the public url
  const downloadURL = await getDownloadURL(snapshot.ref);

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
    user_image: {
      name: req.file.originalname,
      type: req.file.mimetype,
      downloadURL: downloadURL,
    },
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
    "doctorCourses",
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
    token: genJwt(loggedUser?._id, loggedUser?.role),
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
  const { name, department, studentCourses, doctorCourses, year } = req.body;
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
      name,
      department,
      studentCourses,
      doctorCourses,
      year,
      userImagesId: req.file ? userImagesId : req.user.userImagesId,
    },
    { new: true, runValidators: true }
  );
  const completeUpdatedUser = await updatedUser.populate([
    "department",
    "studentCourses.course",
    "doctorCourses.course",
  ]);
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
      ...completeUpdatedUser?._doc,
      user_image: {
        name: req.file.originalname,
        type: req.file.mimetype,
        downloadURL: downloadURL,
      },
    });
  }

  res.status(200).json({
    ...completeUpdatedUser?._doc,
    user_image: {
      ...fileData[0],
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
  getUserInfo,
  updateUserInfo,
};
