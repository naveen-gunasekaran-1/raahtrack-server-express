import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: "Admin" | "SuperAdmin";
  comparePassword(password: string): Promise<boolean>;
}

const AdminSchema = new mongoose.Schema<IAdmin>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "SuperAdmin"], default: "Admin" },
});

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Add comparePassword method
AdminSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// ✅ Correct default export
const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
export default Admin;
