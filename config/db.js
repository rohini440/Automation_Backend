const mongoose = require('mongoose');

let isMockMode = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  
  if (!uri) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  No MONGO_URI specified in environment variables.');
    console.log('\x1b[36m%s\x1b[0m', '💡 Running in Resilient In-Memory Mock Database Mode.');
    isMockMode = true;
    return { isMock: true };
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log('\x1b[32m%s\x1b[0m', `🔌 MongoDB Connected: ${conn.connection.host}`);
    isMockMode = false;
    return conn;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ MongoDB Connection Error: ${error.message}`);
    console.log('\x1b[36m%s\x1b[0m', '💡 Falling back to Resilient In-Memory Mock Database Mode.');
    isMockMode = true;
    return { isMock: true };
  }
};

const getDBMode = () => isMockMode;

module.exports = { connectDB, getDBMode };
