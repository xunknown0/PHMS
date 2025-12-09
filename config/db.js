const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // options are optional for modern mongoose
    });
    console.log(`Database Connected: ${conn.connection.name}`);
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
