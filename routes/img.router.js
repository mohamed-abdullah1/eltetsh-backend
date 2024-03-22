const express = require("express");
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const multer = require("multer");
const config = require("../config/firebase.config");

//Initialize a firebase application
initializeApp(config);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage();

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
router.post("/upload", upload.single("filename"), async (req, res) => {
  try {
    const dateTime = giveCurrentDateTime();

    const storageRef = ref(
      storage,
      `files/${req.file.originalname + "       " + dateTime}`
    );

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

    console.log("File successfully uploaded.");
    return res.send({
      message: "file uploaded to firebase storage",
      name: req.file.originalname,
      type: req.file.mimetype,
      downloadURL: downloadURL,
    });
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

const giveCurrentDateTime = () => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + " " + time;
  return dateTime;
};
const { getMetadata, list } = require("firebase/storage");

router.get("/list", async (req, res) => {
  try {
    // List all files in the storage bucket
    const storageRef = ref(storage, "files/");
    const files = await list(storageRef);
    console.log({ files, x: files.prefixes });
    // Iterate through each item in the list and retrieve download URLs
    const fileData = await Promise.all(
      files.items.map(async (item) => {
        const downloadURL = await getDownloadURL(item);
        const metadata = await getMetadata(item);

        console.log({ ...item });
        return {
          name: item.name,
          downloadURL: downloadURL,
          type: metadata.contentType,
        };
      })
    );

    return res.send(fileData);
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

module.exports = router;
