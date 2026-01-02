import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    // If already connected, return
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return;
    }

    // Connect to MongoDB with optimized settings for serverless
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000, // Increased timeout for serverless (10s)
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 1, // Maintain up to 1 socket connection for serverless
      minPoolSize: 0, // Allow 0 connections when idle
      // Suppress duplicate index warnings in production
      autoIndex: process.env.NODE_ENV !== "production", // Disable auto-indexing in production
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // In serverless, don't exit process, just throw
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB error:", error);
});
