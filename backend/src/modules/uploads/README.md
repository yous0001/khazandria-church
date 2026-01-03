# File Upload Service

This module provides file upload functionality using Multer and Cloudinary that can be used in other services.

## Usage

Import the upload service and multer middleware in your service:

```typescript
import { uploadService } from "../uploads/upload.service";
import { uploadSingle, uploadMultiple } from "../../middlewares/upload";
```

## Example: Adding file upload to a service

### Example 1: Upload student photo when creating a student

```typescript
// In student.routes.ts
import { uploadSingle } from "../../middlewares/upload";
import { uploadService } from "../uploads/upload.service";

router.post(
  "/",
  checkAuth,
  uploadSingle, // Multer middleware - expects field name "file"
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone } = req.body;
    let photoUrl: string | undefined;

    // If file is uploaded, process it
    if (req.file) {
      const uploadResult = await uploadService.uploadFile(req.file, {
        folder: "students/photos",
        resourceType: "image",
        allowedFormats: ["jpg", "jpeg", "png"],
      });
      photoUrl = uploadResult.url;
    }

    // Create student with photo URL
    const student = await studentService.createStudent({
      name,
      email,
      phone,
      photoUrl,
    });

    res.json({ success: true, data: student });
  })
);
```

### Example 2: Upload document when creating an activity

```typescript
// In activity.routes.ts
import { uploadSingle } from "../../middlewares/upload";
import { uploadService } from "../uploads/upload.service";

router.post(
  "/",
  requireSuperAdmin,
  uploadSingle,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    let documentUrl: string | undefined;

    if (req.file) {
      const uploadResult = await uploadService.uploadFile(req.file, {
        folder: "activities/documents",
        resourceType: "raw", // For PDFs, documents, etc.
        allowedFormats: ["pdf", "doc", "docx"],
      });
      documentUrl = uploadResult.url;
    }

    const activity = await activityService.createActivity({
      name,
      description,
      documentUrl,
    });

    res.json({ success: true, data: activity });
  })
);
```

### Example 3: Upload multiple files (e.g., session attachments)

```typescript
// In session.routes.ts
import { uploadMultiple } from "../../middlewares/upload";
import { uploadService } from "../uploads/upload.service";

router.post(
  "/:groupId/sessions",
  checkAuth,
  uploadMultiple, // Expects field name "files", max 10 files
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionDate } = req.body;
    const attachmentUrls: string[] = [];

    // Process multiple uploaded files
    if (req.files && Array.isArray(req.files)) {
      const uploadResults = await uploadService.uploadFiles(req.files, {
        folder: "sessions/attachments",
        resourceType: "auto",
      });
      attachmentUrls = uploadResults.map((r) => r.url);
    }

    const session = await sessionService.createSession(groupId, {
      sessionDate,
      attachmentUrls,
    });

    res.json({ success: true, data: session });
  })
);
```

## Available Functions

### uploadService.uploadFile(file, options?)
Upload a single file to Cloudinary.

**Parameters:**
- `file`: Express.Multer.File - The file from req.file
- `options`: 
  - `folder?: string` - Cloudinary folder (default: "khazandria-church")
  - `resourceType?: "image" | "video" | "raw" | "auto"` - File type (default: "auto")
  - `allowedFormats?: string[]` - Allowed file extensions (e.g., ["jpg", "png", "pdf"])

**Returns:** `Promise<UploadResult>` with `url`, `publicId`, `format`, `bytes`, etc.

### uploadService.uploadFiles(files[], options?)
Upload multiple files to Cloudinary. Same options as `uploadFile`.

### uploadService.deleteFile(publicId, resourceType?)
Delete a file from Cloudinary.

### uploadService.getFileInfo(publicId, resourceType?)
Get file information from Cloudinary.

## Multer Middleware

- `uploadSingle` - For single file upload (field name: "file")
- `uploadMultiple` - For multiple files (field name: "files", max 10)
- `uploadField(fieldName, maxCount)` - For custom field names

**Note:** Add the multer middleware BEFORE your route handler. The file will be available in `req.file` (single) or `req.files` (multiple).

## Environment Variables

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

