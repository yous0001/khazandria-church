import mongoose, { Schema, Document } from "mongoose";

export interface ISessionContentFile {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  originalName?: string;
  uploadedAt: Date;
}

export interface ISessionContent {
  text?: string;
  images?: ISessionContentFile[];
  videos?: ISessionContentFile[];
  pdfs?: ISessionContentFile[];
}

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  sessionDate: Date;
  createdByUserId: mongoose.Types.ObjectId;
  attendanceIds: mongoose.Types.ObjectId[];
  content?: ISessionContent;
  attendanceReport?: ISessionContentFile;
  createdAt: Date;
  updatedAt: Date;
}

const sessionContentFileSchema = new Schema<ISessionContentFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    format: { type: String, required: true },
    resourceType: {
      type: String,
      required: true,
      enum: ["image", "video", "raw"],
    },
    bytes: { type: Number, required: true },
    originalName: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sessionContentSchema = new Schema<ISessionContent>(
  {
    text: { type: String },
    images: { type: [sessionContentFileSchema], default: [] },
    videos: { type: [sessionContentFileSchema], default: [] },
    pdfs: { type: [sessionContentFileSchema], default: [] },
  },
  { _id: false }
);

const sessionSchema = new Schema<ISession>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group ID is required"],
    },
    sessionDate: {
      type: Date,
      required: [true, "Session date is required"],
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user ID is required"],
    },
    attendanceIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "SessionAttendance" }],
      default: [],
    },
    content: { type: sessionContentSchema },
    attendanceReport: { type: sessionContentFileSchema },
  },
  { timestamps: true }
);

sessionSchema.index({ groupId: 1, sessionDate: -1 });

export const Session = mongoose.model<ISession>("Session", sessionSchema);
