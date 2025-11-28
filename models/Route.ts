import mongoose, { Schema, Document } from "mongoose";

interface IStop {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  estimatedTime: number; // minutes from start
}

interface IRoute extends Document {
  routeId: string;
  name: string;
  description: string;
  startLocation: string;
  endLocation: string;
  stops: IStop[];
  totalDistance: number; // in km
  estimatedDuration: number; // in minutes
  isActive: boolean;
  operatingHours: {
    start: string; // "06:00"
    end: string;   // "22:00"
  };
  frequency: number; // minutes between buses
  assignedBuses: string[];
  assignedDrivers: string[];
}

const StopSchema: Schema = new Schema({
  stopId: { type: String, required: true },
  name: { type: String, required: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  order: { type: Number, required: true, min: 1 },
  estimatedTime: { type: Number, required: true, min: 0 }
});

const RouteSchema: Schema<IRoute> = new Schema(
  {
    routeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    startLocation: { type: String, required: true },
    endLocation: { type: String, required: true },
    stops: [StopSchema],
    totalDistance: { type: Number, required: true, min: 0 },
    estimatedDuration: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    operatingHours: {
      start: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      end: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    frequency: { type: Number, required: true, min: 1 },
    assignedBuses: [{ type: String }],
    assignedDrivers: [{ type: String, ref: 'Driver' }]
  },
  { timestamps: true }
);

// Indexes for efficient queries
RouteSchema.index({ routeId: 1 });
RouteSchema.index({ isActive: 1 });

const Route = mongoose.model<IRoute>("Route", RouteSchema);
export default Route;