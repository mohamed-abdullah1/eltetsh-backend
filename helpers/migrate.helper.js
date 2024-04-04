// Import necessary modules
const mongoose = require("mongoose");
const Post = require("../models/posts.model");

// Define the migration function
(async () => {
  // Connect to MongoDB
  await mongoose.connect(
    "mongodb://pluss:plusses@cluster0-shard-00-00.7aehl.mongodb.net:27017,cluster0-shard-00-01.7aehl.mongodb.net:27017,cluster0-shard-00-02.7aehl.mongodb.net:27017/collage_connect_db?ssl=true&replicaSet=atlas-gbf631-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0"
  );
  // Add new field to User model
  try {
    await Post.updateMany({}, { $set: { comments: [] } });
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  }

  // Disconnect from MongoDB
  await mongoose.disconnect();
})()
  .then(() => console.log("Migration complete"))
  .catch((error) => console.error("Migration error:", error));

// Start the Express;

// Export the migration function
