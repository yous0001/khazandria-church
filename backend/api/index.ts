import mongoose from "mongoose";
import app from "../src/app";
import { connectDB } from "../src/config/db";

// Connect to database on cold start (serverless)
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  if (isConnecting && connectionPromise) {
    return connectionPromise; // Connection in progress
  }

  isConnecting = true;
  connectionPromise = connectDB().catch((error) => {
    console.error("Failed to connect to database:", error);
    isConnecting = false;
    connectionPromise = null;
    throw error;
  });

  await connectionPromise;
  isConnecting = false;
};

// For Vercel serverless, we need to handle the connection per request
// Wrap the app export to ensure connection before handling requests
const handler = async (req: any, res: any) => {
  try {
    await ensureConnection();
  } catch (error) {
    console.error("Database connection failed:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
  return app(req, res);
};

export default handler;

