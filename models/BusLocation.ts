import mongoose, { Schema, Document } from "mongoose";

interface IBusLocation extends Document {
  busId: string;
  driverID: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  isActive: boolean;
  passengerCount: number;
  nextStop: string;
  estimatedArrival: Date;
  status: 'on_route' | 'delayed' | 'stopped' | 'emergency' | 'maintenance';
}

const BusLocationSchema: Schema<IBusLocation> = new Schema(
  {
    busId: { type: String, required: true, index: true },
    driverID: { type: String, required: true, ref: 'Driver' },
    routeId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    speed: { type: Number, default: 0, min: 0 },
    heading: { type: Number, default: 0, min: 0, max: 360 },
    timestamp: { type: Date, default: Date.now, index: true },
    isActive: { type: Boolean, default: true },
    passengerCount: { type: Number, default: 0, min: 0 },
    nextStop: { type: String, default: '' },
    estimatedArrival: { type: Date },
    status: { 
      type: String, 
      enum: ['on_route', 'delayed', 'stopped', 'emergency', 'maintenance'],
      default: 'on_route'
    }
  },
  { timestamps: true }
);

// Index for efficient location queries
BusLocationSchema.index({ busId: 1, timestamp: -1 });
BusLocationSchema.index({ routeId: 1, isActive: 1 });
BusLocationSchema.index({ latitude: 1, longitude: 1 });

const BusLocation = mongoose.model<IBusLocation>("BusLocation", BusLocationSchema);
export default BusLocation;