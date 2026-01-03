import multer from "multer";
import { Request } from "express";
import { HttpError } from "../utils/httpError";

// Configure multer to use memory storage (for Cloudinary)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow all file types by default
  // You can add specific file type restrictions here if needed
  cb(null, true);
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single("file");

// Middleware for multiple file uploads
export const uploadMultiple = upload.array("files", 10); // Max 10 files

// Middleware for specific file field
export const uploadField = (fieldName: string, maxCount: number = 1) => {
  return upload.fields([{ name: fieldName, maxCount }]);
};

// Helper to validate file types
export const validateFileType = (
  file: Express.Multer.File,
  allowedTypes: string[]
): boolean => {
  const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  return (
    allowedTypes.some((type) => mimeType.includes(type)) ||
    (fileExtension !== undefined && allowedTypes.includes(fileExtension))
  );
};

// Helper to get file size in MB
export const getFileSizeMB = (bytes: number): number => {
  return bytes / (1024 * 1024);
};

