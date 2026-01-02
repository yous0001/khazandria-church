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

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  sessionDate: Date;
  createdByUserId: mongoose.Types.ObjectId;
  students: ISessionStudent[];
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
  },
  {
    timestamps: true,
  }
);

// Indexes
sessionSchema.index({ groupId: 1, sessionDate: -1 });
sessionSchema.index({ "students.studentId": 1 });

export const Session = mongoose.model<ISession>("Session", sessionSchema);
