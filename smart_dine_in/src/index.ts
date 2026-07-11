import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING';

console.log("🚀 Starting the server script..."); // Debug log 1

const startServer = async () => {
  try {
    console.log("Connecting to MongoDB..."); // Debug log 2
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected successfully!"); // Debug log 3

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`); // Debug log 4
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();