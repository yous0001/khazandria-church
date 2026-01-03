import mongoose, { Schema, Document } from "mongoose";

export interface ISessionGrade {
  gradeName: string;
  mark: number;
  fullMark: number;
}

export interface ISessionStudent {
  studentId: mongoose.Types.ObjectId;
  present: boolean;
  sessionMark: number;
  bonusMark: number;
  totalSessionMark: number;
  sessionGrades: ISessionGrade[];
  recordedByUserId: mongoose.Types.ObjectId;
}

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
  students: ISessionStudent[];
  content?: ISessionContent;
  createdAt: Date;
  updatedAt: Date;
}

const sessionGradeSchema = new Schema<ISessionGrade>(
  {
    gradeName: {
      type: String,
      required: true,
    },
    mark: {
      type: Number,
      required: true,
      min: 0,
    },
    fullMark: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const sessionStudentSchema = new Schema<ISessionStudent>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    present: {
      type: Boolean,
      required: true,
      default: false,
    },
    sessionMark: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    bonusMark: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalSessionMark: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sessionGrades: {
      type: [sessionGradeSchema],
      default: [],
    },
    recordedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const sessionContentFileSchema = new Schema<ISessionContentFile>(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["image", "video", "raw"],
    },
    bytes: {
      type: Number,
      required: true,
    },
    originalName: {
      type: String,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const sessionContentSchema = new Schema<ISessionContent>(
  {
    text: {
      type: String,
    },
    images: {
      type: [sessionContentFileSchema],
      default: [],
    },
    videos: {
      type: [sessionContentFileSchema],
      default: [],
    },
    pdfs: {
      type: [sessionContentFileSchema],
      default: [],
    },
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
    students: {
      type: [sessionStudentSchema],
      default: [],
    },
    content: {
      type: sessionContentSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
sessionSchema.index({ groupId: 1, sessionDate: -1 });
sessionSchema.index({ "students.studentId": 1 });

export const Session = mongoose.model<ISession>("Session", sessionSchema);
