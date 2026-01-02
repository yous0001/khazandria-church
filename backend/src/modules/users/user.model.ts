import mongoose, { Schema, Document } from "mongoose";
import type { UserRole } from "../../constants/roles";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
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
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      required: [true, "Role is required"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// Remove password from JSON output
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete (ret as any).passwordHash;
    delete (ret as any).__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
