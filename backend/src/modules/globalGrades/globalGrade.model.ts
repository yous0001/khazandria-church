import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalGradeEntry {
  gradeName: string;
  mark: number;
  fullMark: number;
  status: 'not_taken' | 'taken';
}

export interface IGlobalGrade extends Document {
  _id: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  grades: IGlobalGradeEntry[];
  totalGlobalMark: number;
  totalSessionMark: number;
  totalFinalMark: number;
  recordedByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const globalGradeEntrySchema = new Schema<IGlobalGradeEntry>(
  {
    gradeName: {
      type: String,
      required: true,
    },
    mark: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    fullMark: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['not_taken', 'taken'],
      required: true,
      default: 'not_taken',
    },
  },
  { _id: false }
);

const globalGradeSchema = new Schema<IGlobalGrade>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    grades: {
      type: [globalGradeEntrySchema],
      default: [],
    },
    totalGlobalMark: {
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
    totalFinalMark: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    recordedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorded by user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
globalGradeSchema.index({ activityId: 1, studentId: 1 }, { unique: true });
globalGradeSchema.index({ activityId: 1 });
globalGradeSchema.index({ studentId: 1 });

export const GlobalGrade = mongoose.model<IGlobalGrade>('GlobalGrade', globalGradeSchema);





