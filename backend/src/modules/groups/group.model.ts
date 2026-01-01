import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  name: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    labels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
groupSchema.index({ activityId: 1 });
groupSchema.index({ activityId: 1, labels: 1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);

