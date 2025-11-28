import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["driver_report", "passenger_report", "bus_delay", "admin_report", "system_alert"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["unread", "read", "resolved"],
    default: "unread",
  },
  relatedUser: {
    type: String, // Could be driver ID, passenger ID, etc.
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;