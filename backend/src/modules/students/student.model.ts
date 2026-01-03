import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional indexes for searching
studentSchema.index({ name: 1 });
studentSchema.index({ email: 1 }, { sparse: true });
studentSchema.index({ phone: 1 }, { sparse: true });

export const Student = mongoose.model<IStudent>('Student', studentSchema);





