import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  role: "Driver" | "Passenger"; 
  DriverID?: string;
  phone?: string;
  isActive: boolean;
  totalTrips: number;
  favoriteRoute?: string;
  createdAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<User> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, required: true, unique: true, lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["Driver", "Passenger"], default: "Passenger" },
    DriverID: {
      type: String,
      required: function () {
        return this.role === "Driver"; 
      },
    },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    totalTrips: { type: Number, default: 0 },
    favoriteRoute: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving
UserSchema.pre<User>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔹 Compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<User>("User", UserSchema);
