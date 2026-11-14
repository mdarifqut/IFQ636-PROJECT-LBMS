// config/db.js
const mongoose = require("mongoose");

// Set strictQuery explicitly to suppress the warning
//mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    //await mongoose.connect(process.env.MONGO_URI);  // Remove deprecated options
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "LBMS"
    });
    console.log("Connected database:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
