import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupStudent extends Document {
  _id: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const groupStudentSchema = new Schema<IGroupStudent>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes - enforce one group per activity per student
groupStudentSchema.index({ activityId: 1, studentId: 1 }, { unique: true });
groupStudentSchema.index({ groupId: 1 });
groupStudentSchema.index({ studentId: 1 });

export const GroupStudent = mongoose.model<IGroupStudent>('GroupStudent', groupStudentSchema);

