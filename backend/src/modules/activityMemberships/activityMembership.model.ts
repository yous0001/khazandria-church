import mongoose, { Schema, Document } from 'mongoose';
import type { ActivityRole } from '../../constants/roles';

export interface IActivityMembership extends Document {
  _id: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roleInActivity: ActivityRole;
  createdAt: Date;
  updatedAt: Date;
}

const activityMembershipSchema = new Schema<IActivityMembership>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    roleInActivity: {
      type: String,
      enum: ['head', 'admin'],
      required: [true, 'Role in activity is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activityMembershipSchema.index({ activityId: 1, userId: 1 }, { unique: true });
activityMembershipSchema.index({ userId: 1 });
activityMembershipSchema.index({ activityId: 1 });

export const ActivityMembership = mongoose.model<IActivityMembership>(
  'ActivityMembership',
  activityMembershipSchema
);

