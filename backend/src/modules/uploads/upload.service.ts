import { cloudinary } from "../../config/cloudinary";
import { HttpError } from "../../utils/httpError";
import { Readable } from "stream";

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number; // For videos
}

export class UploadService {
  /**
   * Upload file to Cloudinary
   * @param file - File buffer or stream
   * @param options - Upload options
   */
  async uploadFile(
    file: Express.Multer.File,
    options?: {
      folder?: string;
      resourceType?: "image" | "video" | "raw" | "auto";
      allowedFormats?: string[];
    }
  ): Promise<UploadResult> {
    try {
      // Validate file
      if (!file || !file.buffer) {
        throw new HttpError(400, "No file provided");
      }

      // Determine resource type
      const resourceType = options?.resourceType || "auto";

      // Validate file format if specified
      if (options?.allowedFormats && options.allowedFormats.length > 0) {
        const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
        if (!fileExtension || !options.allowedFormats.includes(fileExtension)) {
          throw new HttpError(
            400,
            `File format not allowed. Allowed formats: ${options.allowedFormats.join(", ")}`
          );
        }
      }

      // Convert buffer to stream
      const stream = Readable.from(file.buffer);

      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder: options?.folder || "khazandria-church",
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              reject(new HttpError(500, `Upload failed: ${error.message}`));
              return;
            }

            if (!result) {
              reject(new HttpError(500, "Upload failed: No result returned"));
              return;
            }

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format || "",
              resourceType: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              duration: result.duration,
            });
          }
        );

        stream.pipe(uploadStream);
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    options?: {
      folder?: string;
      resourceType?: "image" | "video" | "raw" | "auto";
      allowedFormats?: string[];
    }
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      throw new HttpError(500, `Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get file info from Cloudinary
   */
  async getFileInfo(publicId: string, resourceType: "image" | "video" | "raw" = "image") {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      throw new HttpError(404, `File not found: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

export const uploadService = new UploadService();

