import mongoose, { Schema, Document } from "mongoose";

export interface ISessionAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  sessionDate: Date;
  present: boolean;
  bonusMark: number;
  totalSessionMark: number;
  recordedByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sessionAttendanceSchema = new Schema<ISessionAttendance>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    present: {
      type: Boolean,
      required: true,
      default: false,
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
    recordedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

sessionAttendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
sessionAttendanceSchema.index({ studentId: 1, activityId: 1, sessionDate: -1 });
sessionAttendanceSchema.index({ groupId: 1, studentId: 1, sessionDate: -1 });
sessionAttendanceSchema.index({ sessionId: 1 });

export const SessionAttendance = mongoose.model<ISessionAttendance>(
  "SessionAttendance",
  sessionAttendanceSchema
);

/** API shape kept for frontend compatibility */
export interface SessionStudentView {
  studentId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string };
  present: boolean;
  bonusMark: number;
  totalSessionMark: number;
  recordedByUserId: mongoose.Types.ObjectId;
}
