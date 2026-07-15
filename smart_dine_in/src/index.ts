import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { getSettings } from './services/loyaltyService';
import { initSocket } from './socket';

dotenv.config();

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING';

console.log("🚀 Starting the server script...");

const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected successfully!");

    // Bootstrap the LoyaltySettings singleton with defaults if not yet created.
    // This is idempotent — subsequent starts are a no-op.
    await getSettings();
    console.log("✅ Loyalty settings initialized.");

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();