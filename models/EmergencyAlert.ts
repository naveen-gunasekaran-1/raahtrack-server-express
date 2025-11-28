import mongoose, { Schema, Document } from "mongoose";

interface IEmergencyAlert extends Document {
  alertId: string;
  reporterType: 'driver' | 'passenger' | 'admin' | 'system';
  reporterId: string;
  reporterName: string;
  alertType: 'accident' | 'breakdown' | 'medical' | 'security' | 'route_block' | 'weather' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  busId?: string;
  routeId?: string;
  driverID?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  affectedUsers: string[];
  notificationsSent: boolean;
  mediaUrls: string[];
  contactInfo?: {
    phone?: string;
    alternateContact?: string;
  };
  estimatedResolutionTime?: Date;
}

const EmergencyAlertSchema: Schema<IEmergencyAlert> = new Schema(
  {
    alertId: { 
      type: String, 
      required: true, 
      unique: true, 
      default: () => `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
    reporterType: { 
      type: String, 
      enum: ['driver', 'passenger', 'admin', 'system'],
      required: true,
      index: true
    },
    reporterId: { type: String, required: true, index: true },
    reporterName: { type: String, required: true },
    alertType: { 
      type: String, 
      enum: ['accident', 'breakdown', 'medical', 'security', 'route_block', 'weather', 'other'],
      required: true,
      index: true
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true
    },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      address: { type: String }
    },
    busId: { type: String, index: true },
    routeId: { type: String, index: true },
    driverID: { type: String, ref: 'Driver', index: true },
    status: { 
      type: String, 
      enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
      default: 'active',
      index: true
    },
    acknowledgedBy: { type: String },
    acknowledgedAt: { type: Date },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String, maxlength: 500 },
    affectedUsers: [{ type: String }],
    notificationsSent: { type: Boolean, default: false },
    mediaUrls: [{ type: String }],
    contactInfo: {
      phone: { type: String },
      alternateContact: { type: String }
    },
    estimatedResolutionTime: { type: Date }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
EmergencyAlertSchema.index({ status: 1, severity: 1, createdAt: -1 });
EmergencyAlertSchema.index({ alertType: 1, status: 1 });
EmergencyAlertSchema.index({ busId: 1, status: 1 });
EmergencyAlertSchema.index({ routeId: 1, status: 1 });
EmergencyAlertSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

const EmergencyAlert = mongoose.model<IEmergencyAlert>("EmergencyAlert", EmergencyAlertSchema);
export default EmergencyAlert;