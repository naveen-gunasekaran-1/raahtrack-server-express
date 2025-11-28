import mongoose, { Schema, Document } from "mongoose";

interface ITripHistory extends Document {
  tripId: string;
  busId: string;
  routeId: string;
  driverID: string;
  driverName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  status: 'active' | 'completed' | 'cancelled' | 'emergency_stopped';
  startLocation: {
    latitude: number;
    longitude: number;
    stopName?: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    stopName?: string;
  };
  route: {
    plannedStops: number;
    completedStops: number;
    skippedStops: string[];
  };
  passengers: {
    initial: number;
    peak: number;
    final: number;
    totalBoarded: number;
    totalAlighted: number;
  };
  performance: {
    averageSpeed: number;
    maxSpeed: number;
    fuelEfficiency?: number;
    onTimePerformance: number; // percentage
    delayMinutes: number;
  };
  incidents: {
    emergencyAlerts: number;
    breakdowns: number;
    trafficDelays: number;
    weatherIssues: number;
  };
  revenue?: {
    totalFare: number;
    ticketsSold: number;
    passHolders: number;
  };
  feedback: {
    driverRating?: number;
    passengerComplaints: number;
    compliments: number;
  };
  locationPoints: {
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number;
    passengerCount: number;
  }[];
  notes?: string;
}

const TripHistorySchema: Schema<ITripHistory> = new Schema(
  {
    tripId: { 
      type: String, 
      required: true, 
      unique: true,
      default: () => `TRIP_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
    busId: { type: String, required: true, index: true },
    routeId: { type: String, required: true, index: true },
    driverID: { type: String, required: true, ref: 'Driver', index: true },
    driverName: { type: String, required: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, index: true },
    duration: { type: Number, min: 0 }, // in minutes
    status: { 
      type: String, 
      enum: ['active', 'completed', 'cancelled', 'emergency_stopped'],
      default: 'active',
      index: true
    },
    startLocation: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      stopName: { type: String }
    },
    endLocation: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      stopName: { type: String }
    },
    route: {
      plannedStops: { type: Number, required: true, min: 0 },
      completedStops: { type: Number, default: 0, min: 0 },
      skippedStops: [{ type: String }]
    },
    passengers: {
      initial: { type: Number, default: 0, min: 0 },
      peak: { type: Number, default: 0, min: 0 },
      final: { type: Number, default: 0, min: 0 },
      totalBoarded: { type: Number, default: 0, min: 0 },
      totalAlighted: { type: Number, default: 0, min: 0 }
    },
    performance: {
      averageSpeed: { type: Number, default: 0, min: 0 },
      maxSpeed: { type: Number, default: 0, min: 0 },
      fuelEfficiency: { type: Number, min: 0 },
      onTimePerformance: { type: Number, default: 100, min: 0, max: 100 },
      delayMinutes: { type: Number, default: 0, min: 0 }
    },
    incidents: {
      emergencyAlerts: { type: Number, default: 0, min: 0 },
      breakdowns: { type: Number, default: 0, min: 0 },
      trafficDelays: { type: Number, default: 0, min: 0 },
      weatherIssues: { type: Number, default: 0, min: 0 }
    },
    revenue: {
      totalFare: { type: Number, default: 0, min: 0 },
      ticketsSold: { type: Number, default: 0, min: 0 },
      passHolders: { type: Number, default: 0, min: 0 }
    },
    feedback: {
      driverRating: { type: Number, min: 1, max: 5 },
      passengerComplaints: { type: Number, default: 0, min: 0 },
      compliments: { type: Number, default: 0, min: 0 }
    },
    locationPoints: [{
      timestamp: { type: Date, required: true },
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      speed: { type: Number, default: 0, min: 0 },
      passengerCount: { type: Number, default: 0, min: 0 }
    }],
    notes: { type: String, maxlength: 500 }
  },
  { timestamps: true }
);

// Compound indexes for analytics
TripHistorySchema.index({ driverID: 1, status: 1, startTime: -1 });
TripHistorySchema.index({ busId: 1, status: 1, startTime: -1 });
TripHistorySchema.index({ routeId: 1, status: 1, startTime: -1 });
TripHistorySchema.index({ startTime: 1, endTime: 1 });

// Method to calculate trip duration
TripHistorySchema.methods.calculateDuration = function() {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return this.duration;
};

// Method to update performance metrics
TripHistorySchema.methods.updatePerformanceMetrics = function() {
  if (this.locationPoints.length > 1) {
    const speeds = this.locationPoints.map((point: any) => point.speed).filter((speed: number) => speed > 0);
    if (speeds.length > 0) {
      this.performance.averageSpeed = Math.round(speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length);
      this.performance.maxSpeed = Math.round(Math.max(...speeds));
    }
    
    // Update peak passenger count
    const passengerCounts = this.locationPoints.map((point: any) => point.passengerCount);
    if (passengerCounts.length > 0) {
      this.passengers.peak = Math.max(...passengerCounts);
    }
  }
};

const TripHistory = mongoose.model<ITripHistory>("TripHistory", TripHistorySchema);
export default TripHistory;