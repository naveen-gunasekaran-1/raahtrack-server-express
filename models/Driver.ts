import mongoose from "mongoose";

interface IDriver extends mongoose.Document {
  name: string;
  email: string;
  driverID: string;
  phone?: string;
  busRoute?: string;
  licenseNumber?: string;
  password: string;
  isActive: boolean;
  createdAt?: Date;
}

const DriverSchema = new mongoose.Schema<IDriver>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  driverID: { type: String, required: true, unique: true },
  phone: { type: String },
  busRoute: { type: String },
  licenseNumber: { type: String },
  password: { type: String, required: true, minlength: 6 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Driver = mongoose.model<IDriver>("Driver", DriverSchema);
export default Driver;  // ✅ default export
