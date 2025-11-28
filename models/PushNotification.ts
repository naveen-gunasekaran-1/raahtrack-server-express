import mongoose, { Schema, Document } from "mongoose";

interface IPushNotification extends Document {
  userId: string;
  userType: 'passenger' | 'driver' | 'admin' | 'all';
  title: string;
  body: string;
  data?: any;
  type: 'bus_arrival' | 'delay' | 'route_change' | 'emergency' | 'general';
  isRead: boolean;
  isSent: boolean;
  scheduledFor?: Date;
  busId?: string;
  routeId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
}

const PushNotificationSchema: Schema<IPushNotification> = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userType: { 
      type: String, 
      enum: ['passenger', 'driver', 'admin', 'all'],
      required: true,
      index: true
    },
    title: { type: String, required: true, maxlength: 100 },
    body: { type: String, required: true, maxlength: 500 },
    data: { type: Schema.Types.Mixed },
    type: { 
      type: String, 
      enum: ['bus_arrival', 'delay', 'route_change', 'emergency', 'general'],
      required: true,
      index: true
    },
    isRead: { type: Boolean, default: false, index: true },
    isSent: { type: Boolean, default: false, index: true },
    scheduledFor: { type: Date, index: true },
    busId: { type: String, index: true },
    routeId: { type: String, index: true },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    expiresAt: { 
      type: Date, 
      index: { expireAfterSeconds: 0 }  // TTL index for automatic cleanup
    }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
PushNotificationSchema.index({ userId: 1, isRead: 1 });
PushNotificationSchema.index({ userType: 1, type: 1, createdAt: -1 });
PushNotificationSchema.index({ scheduledFor: 1, isSent: 1 });

const PushNotification = mongoose.model<IPushNotification>("PushNotification", PushNotificationSchema);
export default PushNotification;