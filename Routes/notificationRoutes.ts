import express from "express";
import Notification from "../models/Notification.ts";

const router = express.Router();

// Get all notifications (for admin dashboard)
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20); // Get latest 20 notifications
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notifications count
router.get("/count-unread", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ status: "unread" });
    res.json({ unreadCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new notification
router.post("/", async (req, res) => {
  try {
    const { type, title, message, priority, relatedUser } = req.body;
    const notification = new Notification({
      type,
      title,
      message,
      priority,
      relatedUser,
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: "read" },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as resolved
router.patch("/:id/resolve", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: "resolved", resolvedAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;