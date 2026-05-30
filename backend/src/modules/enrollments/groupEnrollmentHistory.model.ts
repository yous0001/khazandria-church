import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupEnrollmentHistory extends Document {
  _id: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt: Date | null;
}

const groupEnrollmentHistorySchema = new Schema<IGroupEnrollmentHistory>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

groupEnrollmentHistorySchema.index({ activityId: 1, studentId: 1, groupId: 1 });

export const GroupEnrollmentHistory = mongoose.model<IGroupEnrollmentHistory>(
  'GroupEnrollmentHistory',
  groupEnrollmentHistorySchema
);
