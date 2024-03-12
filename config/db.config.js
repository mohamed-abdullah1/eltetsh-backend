const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `CONNECTED SUCCESSFULLY ${conn.connection.host}`.blue.underline
    );
  } catch (e) {
    console.log(`${e}`.bgRed);
    process.exit(1);
  }
};
module.exports = connectDB;
