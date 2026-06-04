import mongoose, { Schema, Document } from "mongoose";

export interface IGradeType {
  name: string;
  fullMark: number;
}

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  headAdminId: mongoose.Types.ObjectId;
  sessionBonusMax: number;
  allowMultipleGroups: boolean;
  globalGrades: IGradeType[];
  createdAt: Date;
  updatedAt: Date;
}

const gradeTypeSchema = new Schema<IGradeType>(
  {
    name: {
      type: String,
      required: [true, "Grade name is required"],
      trim: true,
    },
    fullMark: {
      type: Number,
      required: [true, "Full mark is required"],
      min: [0, "Full mark must be non-negative"],
    },
  },
  { _id: false }
);

const activitySchema = new Schema<IActivity>(
  {
    name: {
      type: String,
      required: [true, "Activity name is required"],
      trim: true,
    },
    headAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Head admin is required"],
    },
    sessionBonusMax: {
      type: Number,
      required: [true, "Session bonus max is required"],
      min: [0, "Session bonus max must be non-negative"],
      max: [5, "Session bonus max cannot exceed 5"],
      default: 5,
    },
    allowMultipleGroups: {
      type: Boolean,
      default: false,
    },
    globalGrades: {
      type: [gradeTypeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ headAdminId: 1 });
activitySchema.index({ name: 1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
