import express from "express";
import mongoose from "mongoose";
import User from "./models/User.ts";
import Admin from "./models/Admin.ts";
import Notification from "./models/Notification.ts";
import BusLocation from "./models/BusLocation.ts";
import Route from "./models/Route.ts";
import PushNotification from "./models/PushNotification.ts";
import EmergencyAlert from "./models/EmergencyAlert.ts";
import TripHistory from "./models/TripHistory.ts";
const PORT = 3000;
import bcrypt from "bcryptjs";
import driverRoutes from "./Routes/Driver.ts";
import adminRoutes from "./Routes/adminRoutes.ts";
import notificationRoutes from "./Routes/notificationRoutes.ts";
import Driver from "./models/Driver.ts";

const app = express();

app.use(express.json());

app.use("/drivers", driverRoutes);
app.use("/admins", adminRoutes);
app.use("/notifications", notificationRoutes);

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/RAAHTRACK")
  .then(async () => {
    console.log("✅ MongoDB Connected");
    
    // Create sample notifications if none exist
    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      const sampleNotifications = [
        {
          type: "driver_report",
          title: "Driver Safety Issue",
          message: "Driver reported brake malfunction on Route 12",
          priority: "high",
          relatedUser: "DRV001"
        },
        {
          type: "passenger_report",
          title: "Passenger Complaint",
          message: "Passenger complained about overcrowding on Bus 45",
          priority: "medium",
          relatedUser: "USR123"
        },
        {
          type: "bus_delay",
          title: "Bus Delay Alert",
          message: "Bus 23 delayed by 15 minutes due to traffic",
          priority: "medium",
          relatedUser: "BUS23"
        },
        {
          type: "admin_report",
          title: "System Maintenance",
          message: "Scheduled maintenance completed successfully",
          priority: "low",
          relatedUser: "ADMIN"
        },
        {
          type: "system_alert",
          title: "High Server Load",
          message: "Server experiencing high load - monitoring required",
          priority: "critical"
        }
      ];
      
      await Notification.insertMany(sampleNotifications);
      console.log("✅ Sample notifications created");
    }

    // Create sample routes if none exist
    const routeCount = await Route.countDocuments();
    if (routeCount === 0) {
      const sampleRoutes = [
        {
          routeId: "RT001",
          name: "City Center - Airport",
          description: "Main route connecting city center to airport",
          startLocation: "City Center Bus Terminal",
          endLocation: "Bangalore International Airport",
          stops: [
            { stopId: "ST001", name: "City Center Bus Terminal", latitude: 12.9716, longitude: 77.5946, order: 1, estimatedTime: 0 },
            { stopId: "ST002", name: "MG Road", latitude: 12.9759, longitude: 77.6061, order: 2, estimatedTime: 15 },
            { stopId: "ST003", name: "Indiranagar", latitude: 12.9719, longitude: 77.6412, order: 3, estimatedTime: 30 },
            { stopId: "ST004", name: "Whitefield", latitude: 12.9698, longitude: 77.7500, order: 4, estimatedTime: 60 },
            { stopId: "ST005", name: "Airport", latitude: 13.1986, longitude: 77.7066, order: 5, estimatedTime: 90 }
          ],
          totalDistance: 45.5,
          estimatedDuration: 90,
          isActive: true,
          operatingHours: { start: "06:00", end: "22:00" },
          frequency: 20,
          assignedBuses: ["BUS001", "BUS002"],
          assignedDrivers: []
        },
        {
          routeId: "RT002", 
          name: "Electronics City - Koramangala",
          description: "Tech hub to residential area route",
          startLocation: "Electronics City",
          endLocation: "Koramangala",
          stops: [
            { stopId: "ST006", name: "Electronics City", latitude: 12.8456, longitude: 77.6603, order: 1, estimatedTime: 0 },
            { stopId: "ST007", name: "BTM Layout", latitude: 12.9165, longitude: 77.6101, order: 2, estimatedTime: 25 },
            { stopId: "ST008", name: "Jayanagar", latitude: 12.9279, longitude: 77.5838, order: 3, estimatedTime: 40 },
            { stopId: "ST009", name: "Koramangala", latitude: 12.9352, longitude: 77.6245, order: 4, estimatedTime: 55 }
          ],
          totalDistance: 28.2,
          estimatedDuration: 55,
          isActive: true,
          operatingHours: { start: "06:30", end: "21:30" },
          frequency: 15,
          assignedBuses: ["BUS003"],
          assignedDrivers: []
        }
      ];
      
      await Route.insertMany(sampleRoutes);
      console.log("✅ Sample routes created");
    }

    // Create sample admin users if none exist
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const sampleAdmins = [
        {
          name: "HARINI",
          email: "harini@raahtrack.com",
          password: "admin123",
          role: "Admin"
        },
        {
          name: "NARAYANAN",
          email: "narayanan@raahtrack.com",
          password: "admin123",
          role: "Admin"
        },
        {
          name: "NAVEEN",
          email: "naveen@raahtrack.com",
          password: "superadmin123",
          role: "SuperAdmin"
        },
        {
          name: "MONAL",
          email: "monal@raahtrack.com",
          password: "superadmin123",
          role: "SuperAdmin"
        }
      ];
      
      await Admin.insertMany(sampleAdmins);
      console.log("✅ Sample admin users created");
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, DriverID } = req.body;

    // ✅ require DriverID if user is Driver
    if (role === "Driver" && !DriverID) {
      return res.status(400).json({ error: "Driver ID is required for drivers" });
    }

    const newUser = new User({ name, email, password, role, DriverID });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // First, try to find in Admin collection
    const admin = await Admin.findOne({
      $or: [{ name }, { email }],
    });

    if (admin) {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      return res.json({
        message: "Login successful",
        role: admin.role,
        name: admin.name,
        email: admin.email,
      });
    }

    // If not found in Admin, try User collection
    const user = await User.findOne({
      $or: [{ name }, { email }],
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/count-admin", async (req, res) => {
  const Admincount = await Admin.countDocuments();
  res.send({ Admincount });
});

app.get("/count-users", async (req, res) => {
  const Usercount = await User.countDocuments();
  res.send({ Usercount });
});
app.get("/count-drivers", async (req, res) => {
  const DriverCount = await Driver.countDocuments();
  res.send({ DriverCount });
});

// User/Passenger routes
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update user status
app.patch("/users/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    await User.findByIdAndUpdate(req.params.id, { isActive });
    res.json({ message: "User status updated successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update driver status
app.patch("/drivers/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    await Driver.findByIdAndUpdate(req.params.id, { isActive });
    res.json({ message: "Driver status updated successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Create driver without authentication for testing
app.post("/drivers", async (req, res) => {
  try {
    console.log('Received driver data:', req.body);
    
    const { name, email, driverId, driverID, phone, busRoute, licenseNumber, password, isActive } = req.body;
    
    // Accept both driverId and driverID for backwards compatibility
    const driverIdValue = driverID || driverId;
    
    // Validate required fields
    if (!name || !email || !driverIdValue || !password) {
      return res.status(400).json({ 
        error: "Missing required fields: name, email, driverID (or driverId), and password are required" 
      });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create driver with correct field mapping
    const driverData = {
      name,
      email,
      driverID: driverIdValue, // Use the resolved driverID value
      phone,
      busRoute,
      licenseNumber,
      password: hashedPassword,
      isActive: isActive !== undefined ? isActive : true
    };
    
    console.log('Creating driver with data:', { ...driverData, password: '[HIDDEN]' });
    
    const driver = new Driver(driverData);
    await driver.save();
    
    // Remove password from response
    const driverResponse = driver.toObject() as any;
    delete driverResponse.password;
    
    console.log('Driver created successfully:', driverResponse);
    res.status(201).json({ message: "Driver added successfully", driver: driverResponse });
  } catch (err: any) {
    console.error('Error creating driver:', err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        error: `Driver with this ${field === 'driverID' ? 'driver ID' : field} already exists` 
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(400).json({ error: err.message });
  }
});

// Get drivers without authentication for testing
app.get("/drivers", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System settings endpoints
app.get("/api/system/settings", async (req, res) => {
  try {
    // Return mock system settings
    const settings = [
      { id: '1', title: 'Real-time Tracking', key: 'realtime_tracking', value: true },
      { id: '2', title: 'Push Notifications', key: 'push_notifications', value: true },
      { id: '3', title: 'Auto Backup', key: 'auto_backup', value: false },
      { id: '4', title: 'Maintenance Mode', key: 'maintenance_mode', value: false },
      { id: '5', title: 'Emergency Alerts', key: 'emergency_alerts', value: true }
    ];
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/system/status", async (req, res) => {
  try {
    const status = {
      appVersion: '2.1.0',
      databaseStatus: 'Healthy',
      serverStatus: 'Online',
      lastBackup: '2 hours ago',
      activeSessions: 1234,
      storageUsed: '2.4 GB / 10 GB',
      systemHealth: 'healthy'
    };
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/system/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    console.log(`Updating system setting ${key} to ${value}`);
    res.json({ message: "System setting updated successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/system/actions/:action", async (req, res) => {
  try {
    const { action } = req.params;
    console.log(`Executing system action: ${action}`);
    res.json({ message: `System action ${action} completed successfully` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ===== REAL-TIME BUS TRACKING ENDPOINTS =====

// Update bus location (for drivers)
app.post("/api/bus-location", async (req, res) => {
  try {
    const { busId, driverID, routeId, latitude, longitude, speed, heading, passengerCount, nextStop, status } = req.body;
    
    if (!busId || !driverID || !routeId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required location data" });
    }

    const locationData = new BusLocation({
      busId,
      driverID,
      routeId,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      passengerCount: passengerCount || 0,
      nextStop: nextStop || '',
      status: status || 'on_route',
      isActive: true
    });

    await locationData.save();
    
    // Keep only last 100 location records per bus to prevent database bloat
    const locationCount = await BusLocation.countDocuments({ busId });
    if (locationCount > 100) {
      const oldestLocations = await BusLocation.find({ busId })
        .sort({ timestamp: 1 })
        .limit(locationCount - 100)
        .select('_id');
      
      await BusLocation.deleteMany({ 
        _id: { $in: oldestLocations.map(loc => loc._id) } 
      });
    }

    res.status(201).json({ message: "Location updated successfully", location: locationData });
  } catch (err: any) {
    console.error('Error updating bus location:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get real-time locations for all active buses
app.get("/api/bus-locations", async (req, res) => {
  try {
    const { routeId } = req.query;
    
    const query: any = { isActive: true };
    if (routeId) {
      query.routeId = routeId;
    }

    // Get the latest location for each bus
    const locations = await BusLocation.aggregate([
      { $match: query },
      { $sort: { busId: 1, timestamp: -1 } },
      {
        $group: {
          _id: "$busId",
          latestLocation: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestLocation" } },
      { $sort: { timestamp: -1 } }
    ]);

    res.json(locations);
  } catch (err: any) {
    console.error('Error fetching bus locations:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get specific bus location and history
app.get("/api/bus-location/:busId", async (req, res) => {
  try {
    const { busId } = req.params;
    const { history = 'false' } = req.query;

    if (history === 'true') {
      // Return last 20 locations for route history
      const locations = await BusLocation.find({ busId })
        .sort({ timestamp: -1 })
        .limit(20);
      return res.json(locations);
    }

    // Return latest location
    const location = await BusLocation.findOne({ busId, isActive: true })
      .sort({ timestamp: -1 });
      
    if (!location) {
      return res.status(404).json({ error: "Bus location not found" });
    }

    res.json(location);
  } catch (err: any) {
    console.error('Error fetching bus location:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== ROUTE MANAGEMENT ENDPOINTS =====

// Get all routes
app.get("/api/routes", async (req, res) => {
  try {
    const { active } = req.query;
    const query = active === 'true' ? { isActive: true } : {};
    
    const routes = await Route.find(query).sort({ name: 1 });
    res.json(routes);
  } catch (err: any) {
    console.error('Error fetching routes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create new route
app.post("/api/routes", async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json({ message: "Route created successfully", route });
  } catch (err: any) {
    console.error('Error creating route:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: "Route ID already exists" });
    }
    
    res.status(400).json({ error: err.message });
  }
});

// Get specific route with real-time bus locations
app.get("/api/routes/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const route = await Route.findOne({ routeId });
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Get current bus locations on this route
    const busLocations = await BusLocation.aggregate([
      { $match: { routeId, isActive: true } },
      { $sort: { busId: 1, timestamp: -1 } },
      {
        $group: {
          _id: "$busId",
          latestLocation: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestLocation" } }
    ]);

    res.json({ route, busLocations });
  } catch (err: any) {
    console.error('Error fetching route:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update route
app.put("/api/routes/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = await Route.findOneAndUpdate(
      { routeId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json({ message: "Route updated successfully", route });
  } catch (err: any) {
    console.error('Error updating route:', err);
    res.status(400).json({ error: err.message });
  }
});

// ===== PUSH NOTIFICATION ENDPOINTS =====

// Send notification
app.post("/api/notifications", async (req, res) => {
  try {
    const { userId, userType, title, body, type, data, priority, busId, routeId, scheduledFor } = req.body;
    
    if (!userId || !userType || !title || !body || !type) {
      return res.status(400).json({ error: "Missing required notification fields" });
    }

    const notification = new PushNotification({
      userId,
      userType,
      title,
      body,
      type,
      data,
      priority: priority || 'medium',
      busId,
      routeId,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire after 24 hours
    });

    await notification.save();

    // In production, you would integrate with FCM/APNs here
    console.log(`📱 Notification sent: ${title} to ${userType} user ${userId}`);
    
    res.status(201).json({ message: "Notification sent successfully", notification });
  } catch (err: any) {
    console.error('Error sending notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get notifications for user
app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { unread = 'false', limit = '50' } = req.query;
    
    const query: any = { 
      $or: [
        { userId },
        { userType: 'all' }
      ]
    };
    
    if (unread === 'true') {
      query.isRead = false;
    }

    const notifications = await PushNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json(notifications);
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
app.patch("/api/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await PushNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send bulk notifications (for emergencies)
app.post("/api/notifications/bulk", async (req, res) => {
  try {
    const { userType, title, body, type, data, priority = 'high' } = req.body;
    
    if (!userType || !title || !body || !type) {
      return res.status(400).json({ error: "Missing required notification fields" });
    }

    let userIds: string[] = [];
    
    if (userType === 'passenger') {
      const passengers = await User.find({ role: 'Passenger' }).select('_id');
      userIds = passengers.map(p => (p._id as any).toString());
    } else if (userType === 'driver') {
      const drivers = await User.find({ role: 'Driver' }).select('_id');
      userIds = drivers.map(d => (d._id as any).toString());
    } else if (userType === 'admin') {
      const admins = await Admin.find().select('_id');
      userIds = admins.map(a => (a._id as any).toString());
    }

    const notifications = userIds.map(userId => ({
      userId,
      userType,
      title,
      body,
      type,
      data,
      priority,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }));

    const result = await PushNotification.insertMany(notifications);
    
    console.log(`📱 Bulk notification sent: ${title} to ${result.length} ${userType} users`);
    
    res.status(201).json({ 
      message: `Bulk notification sent to ${result.length} users`, 
      count: result.length 
    });
  } catch (err: any) {
    console.error('Error sending bulk notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// Auto-generate bus arrival notifications
app.post("/api/notifications/bus-arrival", async (req, res) => {
  try {
    const { busId, routeId, stopName, estimatedMinutes } = req.body;
    
    if (!busId || !routeId || !stopName) {
      return res.status(400).json({ error: "Missing bus arrival notification data" });
    }

    // Get passengers on this route (in production, you'd track subscribed users)
    const passengers = await User.find({ role: 'Passenger' }).select('_id').limit(10);
    
    const notifications = passengers.map(passenger => ({
      userId: (passenger._id as any).toString(),
      userType: 'passenger',
      title: `Bus ${busId} Approaching`,
      body: `Your bus will arrive at ${stopName} in approximately ${estimatedMinutes} minutes.`,
      type: 'bus_arrival',
      priority: 'medium',
      busId,
      routeId,
      data: { stopName, estimatedMinutes },
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    }));

    const result = await PushNotification.insertMany(notifications);
    
    res.status(201).json({ 
      message: `Bus arrival notifications sent to ${result.length} passengers`,
      count: result.length 
    });
  } catch (err: any) {
    console.error('Error sending bus arrival notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== EMERGENCY ALERT SYSTEM ENDPOINTS =====

// Create emergency alert
app.post("/api/emergency-alerts", async (req, res) => {
  try {
    const {
      reporterType,
      reporterId,
      reporterName,
      alertType,
      severity,
      title,
      description,
      location,
      busId,
      routeId,
      driverID,
      contactInfo,
      mediaUrls
    } = req.body;

    if (!reporterType || !reporterId || !reporterName || !alertType || !severity || !title || !description || !location) {
      return res.status(400).json({ error: "Missing required emergency alert fields" });
    }

    const alert = new EmergencyAlert({
      reporterType,
      reporterId,
      reporterName,
      alertType,
      severity,
      title,
      description,
      location,
      busId,
      routeId,
      driverID,
      contactInfo,
      mediaUrls: mediaUrls || [],
      affectedUsers: [],
      notificationsSent: false
    });

    await alert.save();
    console.log(`🚨 Emergency alert created: ${alert.alertId} - ${title} (${severity})`);

    // Auto-send notifications for critical alerts
    if (severity === 'critical' || severity === 'high') {
      await sendEmergencyNotifications(alert);
    }

    res.status(201).json({ 
      message: "Emergency alert created successfully", 
      alert: {
        ...alert.toObject(),
        id: alert.alertId
      }
    });
  } catch (err: any) {
    console.error('Error creating emergency alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all emergency alerts
app.get("/api/emergency-alerts", async (req, res) => {
  try {
    const { 
      status,
      severity,
      alertType,
      reporterType,
      busId,
      routeId,
      limit = '50',
      page = '1'
    } = req.query;

    const query: any = {};
    
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (alertType) query.alertType = alertType;
    if (reporterType) query.reporterType = reporterType;
    if (busId) query.busId = busId;
    if (routeId) query.routeId = routeId;

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const alerts = await EmergencyAlert.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await EmergencyAlert.countDocuments(query);

    res.json({
      alerts,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (err: any) {
    console.error('Error fetching emergency alerts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get specific emergency alert
app.get("/api/emergency-alerts/:alertId", async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await EmergencyAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ error: "Emergency alert not found" });
    }

    res.json(alert);
  } catch (err: any) {
    console.error('Error fetching emergency alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update emergency alert status
app.patch("/api/emergency-alerts/:alertId/status", async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, adminId, adminName, resolutionNotes, estimatedResolutionTime } = req.body;

    if (!status || !adminId) {
      return res.status(400).json({ error: "Status and admin ID are required" });
    }

    const updateData: any = { status };
    
    if (status === 'acknowledged') {
      updateData.acknowledgedBy = adminName || adminId;
      updateData.acknowledgedAt = new Date();
    } else if (status === 'resolved') {
      updateData.resolvedBy = adminName || adminId;
      updateData.resolvedAt = new Date();
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
    }

    if (estimatedResolutionTime) {
      updateData.estimatedResolutionTime = new Date(estimatedResolutionTime);
    }

    const alert = await EmergencyAlert.findOneAndUpdate(
      { alertId },
      updateData,
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: "Emergency alert not found" });
    }

    // Send status update notifications
    if (alert.affectedUsers.length > 0) {
      await sendStatusUpdateNotifications(alert, status);
    }

    console.log(`🚨 Emergency alert ${alertId} status updated to: ${status}`);

    res.json({ message: "Alert status updated successfully", alert });
  } catch (err: any) {
    console.error('Error updating emergency alert status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get active emergency alerts for specific route/bus
app.get("/api/emergency-alerts/active/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params; // type: 'route' or 'bus', id: routeId or busId
    
    const query: any = { status: 'active' };
    if (type === 'route') query.routeId = id;
    else if (type === 'bus') query.busId = id;
    else return res.status(400).json({ error: "Invalid type. Use 'route' or 'bus'" });

    const alerts = await EmergencyAlert.find(query)
      .sort({ severity: 1, createdAt: -1 }); // Critical first

    res.json(alerts);
  } catch (err: any) {
    console.error('Error fetching active alerts:', err);
    res.status(500).json({ error: err.message });
  }
});

}

// ========== TRIP HISTORY API ENDPOINTS ==========

// Start a new trip
app.post('/api/trips/start', async (req, res) => {
  try {
    const { busId, routeId, driverID, driverName, startLocation, plannedStops } = req.body;
    
    console.log('📊 Starting new trip:', { busId, routeId, driverID });
    
    // Check if driver has an active trip
    const activeTrip = await TripHistory.findOne({
      driverID,
      status: 'active'
    });
    
    if (activeTrip) {
      return res.status(400).json({
        error: 'Driver already has an active trip',
        activeTripId: activeTrip.tripId
      });
    }
    
    const newTrip = new TripHistory({
      busId,
      routeId,
      driverID,
      driverName,
      startTime: new Date(),
      startLocation,
      route: {
        plannedStops: plannedStops || 10,
        completedStops: 0,
        skippedStops: []
      },
      status: 'active'
    });
    
    await newTrip.save();
    
    console.log('✅ New trip started:', newTrip.tripId);
    res.status(201).json({
      success: true,
      trip: newTrip
    });
    
  } catch (error) {
    console.error('❌ Error starting trip:', error);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

// End a trip
app.patch('/api/trips/:tripId/end', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { endLocation, status = 'completed', notes } = req.body;
    
    console.log('📊 Ending trip:', tripId);
    
    const trip = await TripHistory.findOne({ tripId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    if (trip.status !== 'active') {
      return res.status(400).json({ error: 'Trip is not active' });
    }
    
    // Update trip details
    trip.endTime = new Date();
    trip.endLocation = endLocation;
    trip.status = status;
    trip.notes = notes;
    
    // Calculate duration and performance metrics
    if (trip.endTime && trip.startTime) {
      trip.duration = Math.round((trip.endTime.getTime() - trip.startTime.getTime()) / (1000 * 60));
    }
    
    // Update performance metrics
    if (trip.locationPoints.length > 1) {
      const speeds = trip.locationPoints.map((point: any) => point.speed).filter((speed: number) => speed > 0);
      if (speeds.length > 0) {
        trip.performance.averageSpeed = Math.round(speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length);
        trip.performance.maxSpeed = Math.round(Math.max(...speeds));
      }
      
      const passengerCounts = trip.locationPoints.map((point: any) => point.passengerCount);
      if (passengerCounts.length > 0) {
        trip.passengers.peak = Math.max(...passengerCounts);
      }
    }
    
    await trip.save();
    
    console.log('✅ Trip ended:', tripId, 'Duration:', trip.duration, 'minutes');
    res.json({
      success: true,
      trip
    });
    
  } catch (error) {
    console.error('❌ Error ending trip:', error);
    res.status(500).json({ error: 'Failed to end trip' });
  }
});

// Update trip location and passenger count
app.patch('/api/trips/:tripId/location', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, speed = 0, passengerCount = 0 } = req.body;
    
    const trip = await TripHistory.findOne({ tripId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    if (trip.status !== 'active') {
      return res.status(400).json({ error: 'Trip is not active' });
    }
    
    // Add location point
    trip.locationPoints.push({
      timestamp: new Date(),
      latitude,
      longitude,
      speed,
      passengerCount
    });
    
    // Keep only last 100 location points to manage document size
    if (trip.locationPoints.length > 100) {
      trip.locationPoints = trip.locationPoints.slice(-100);
    }
    
    // Update current passenger count
    trip.passengers.final = passengerCount;
    
    await trip.save();
    
    res.json({
      success: true,
      message: 'Location updated'
    });
    
  } catch (error) {
    console.error('❌ Error updating trip location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get trip history (with filters)
app.get('/api/trips', async (req, res) => {
  try {
    const { 
      driverID, 
      busId, 
      routeId, 
      status,
      startDate, 
      endDate,
      page = '1',
      limit = '20'
    } = req.query;
    
    console.log('📊 Getting trip history with filters:', req.query);
    
    const filters: any = {};
    
    if (driverID) filters.driverID = driverID;
    if (busId) filters.busId = busId;
    if (routeId) filters.routeId = routeId;
    if (status) filters.status = status;
    
    if (startDate || endDate) {
      filters.startTime = {};
      if (startDate) filters.startTime.$gte = new Date(startDate as string);
      if (endDate) filters.startTime.$lte = new Date(endDate as string);
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const trips = await TripHistory.find(filters)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-locationPoints'); // Exclude location points for list view
      
    const total = await TripHistory.countDocuments(filters);
    
    console.log('✅ Found', trips.length, 'trips out of', total, 'total');
    res.json({
      success: true,
      trips,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting trip history:', error);
    res.status(500).json({ error: 'Failed to get trip history' });
  }
});

// Get detailed trip information
app.get('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    console.log('📊 Getting detailed trip info for:', tripId);
    
    const trip = await TripHistory.findOne({ tripId });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    console.log('✅ Trip found:', tripId);
    res.json({
      success: true,
      trip
    });
    
  } catch (error) {
    console.error('❌ Error getting trip details:', error);
    res.status(500).json({ error: 'Failed to get trip details' });
  }
});

// Get driver analytics
app.get('/api/analytics/driver/:driverID', async (req, res) => {
  try {
    const { driverID } = req.params;
    const { days = '30' } = req.query;
    
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    
    console.log('📊 Getting driver analytics for:', driverID, 'over', daysNum, 'days');
    
    const trips = await TripHistory.find({
      driverID,
      startTime: { $gte: startDate },
      status: 'completed'
    });
    
    if (trips.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalTrips: 0,
          totalDistance: 0,
          totalDuration: 0,
          averageSpeed: 0,
          onTimePerformance: 0,
          passengersSaved: 0,
          fuelEfficiency: 0,
          incidents: 0,
          rating: 0
        }
      });
    }
    
    // Calculate analytics
    const totalTrips = trips.length;
    const totalDuration = trips.reduce((sum, trip) => sum + (trip.duration || 0), 0);
    const totalPassengers = trips.reduce((sum, trip) => sum + trip.passengers.totalBoarded, 0);
    const averageSpeed = trips.reduce((sum, trip) => sum + trip.performance.averageSpeed, 0) / totalTrips;
    const onTimePerformance = trips.reduce((sum, trip) => sum + trip.performance.onTimePerformance, 0) / totalTrips;
    const totalIncidents = trips.reduce((sum, trip) => sum + 
      trip.incidents.emergencyAlerts + trip.incidents.breakdowns + 
      trip.incidents.trafficDelays + trip.incidents.weatherIssues, 0);
    const averageRating = trips.filter(trip => trip.feedback.driverRating)
      .reduce((sum, trip) => sum + (trip.feedback.driverRating || 0), 0) / 
      trips.filter(trip => trip.feedback.driverRating).length || 0;
    
    const analytics = {
      totalTrips,
      totalDuration: Math.round(totalDuration),
      totalPassengers,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      onTimePerformance: Math.round(onTimePerformance * 100) / 100,
      totalIncidents,
      averageRating: Math.round(averageRating * 100) / 100,
      tripsPerDay: Math.round((totalTrips / daysNum) * 100) / 100,
      averageTripDuration: Math.round((totalDuration / totalTrips) * 100) / 100
    };
    
    console.log('✅ Driver analytics calculated:', analytics);
    res.json({
      success: true,
      analytics,
      period: `${daysNum} days`
    });
    
  } catch (error) {
    console.error('❌ Error getting driver analytics:', error);
    res.status(500).json({ error: 'Failed to get driver analytics' });
  }
});

// Get route analytics
app.get('/api/analytics/route/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { days = '30' } = req.query;
    
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    
    console.log('📊 Getting route analytics for:', routeId, 'over', daysNum, 'days');
    
    const trips = await TripHistory.find({
      routeId,
      startTime: { $gte: startDate },
      status: 'completed'
    });
    
    if (trips.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalTrips: 0,
          totalPassengers: 0,
          averagePassengerLoad: 0,
          onTimePerformance: 0,
          averageSpeed: 0,
          totalIncidents: 0,
          popularTimes: {},
          averageRevenue: 0
        }
      });
    }
    
    // Calculate analytics
    const totalTrips = trips.length;
    const totalPassengers = trips.reduce((sum, trip) => sum + trip.passengers.totalBoarded, 0);
    const averagePassengerLoad = trips.reduce((sum, trip) => sum + trip.passengers.peak, 0) / totalTrips;
    const onTimePerformance = trips.reduce((sum, trip) => sum + trip.performance.onTimePerformance, 0) / totalTrips;
    const averageSpeed = trips.reduce((sum, trip) => sum + trip.performance.averageSpeed, 0) / totalTrips;
    const totalIncidents = trips.reduce((sum, trip) => sum + 
      trip.incidents.emergencyAlerts + trip.incidents.breakdowns + 
      trip.incidents.trafficDelays + trip.incidents.weatherIssues, 0);
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.revenue?.totalFare || 0), 0);
    
    // Popular times analysis
    const hourlyTrips: { [key: number]: number } = {};
    trips.forEach(trip => {
      const hour = trip.startTime.getHours();
      hourlyTrips[hour] = (hourlyTrips[hour] || 0) + 1;
    });
    
    const analytics = {
      totalTrips,
      totalPassengers,
      averagePassengerLoad: Math.round(averagePassengerLoad * 100) / 100,
      onTimePerformance: Math.round(onTimePerformance * 100) / 100,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      totalIncidents,
      averageRevenue: Math.round((totalRevenue / totalTrips) * 100) / 100,
      popularTimes: hourlyTrips,
      tripsPerDay: Math.round((totalTrips / daysNum) * 100) / 100
    };
    
    console.log('✅ Route analytics calculated:', analytics);
    res.json({
      success: true,
      analytics,
      period: `${daysNum} days`
    });
    
  } catch (error) {
    console.error('❌ Error getting route analytics:', error);
    res.status(500).json({ error: 'Failed to get route analytics' });
  }
});

// Get system-wide analytics
app.get('/api/analytics/system', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    
    console.log('📊 Getting system analytics over', daysNum, 'days');
    
    const trips = await TripHistory.find({
      startTime: { $gte: startDate }
    });
    
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    const activeTrips = trips.filter(trip => trip.status === 'active');
    const cancelledTrips = trips.filter(trip => trip.status === 'cancelled');
    
    // Driver performance
    const driverStats: { [key: string]: any } = {};
    trips.forEach(trip => {
      if (!driverStats[trip.driverID]) {
        driverStats[trip.driverID] = {
          trips: 0,
          totalDuration: 0,
          totalPassengers: 0,
          incidents: 0,
          rating: []
        };
      }
      driverStats[trip.driverID].trips++;
      driverStats[trip.driverID].totalDuration += trip.duration || 0;
      driverStats[trip.driverID].totalPassengers += trip.passengers.totalBoarded;
      driverStats[trip.driverID].incidents += 
        trip.incidents.emergencyAlerts + trip.incidents.breakdowns + 
        trip.incidents.trafficDelays + trip.incidents.weatherIssues;
      if (trip.feedback.driverRating) {
        driverStats[trip.driverID].rating.push(trip.feedback.driverRating);
      }
    });
    
    const analytics = {
      overview: {
        totalTrips: trips.length,
        completedTrips: completedTrips.length,
        activeTrips: activeTrips.length,
        cancelledTrips: cancelledTrips.length,
        completionRate: trips.length > 0 ? Math.round((completedTrips.length / trips.length) * 10000) / 100 : 0
      },
      passengers: {
        totalPassengers: trips.reduce((sum, trip) => sum + trip.passengers.totalBoarded, 0),
        averagePerTrip: trips.length > 0 ? Math.round((trips.reduce((sum, trip) => sum + trip.passengers.totalBoarded, 0) / trips.length) * 100) / 100 : 0,
        peakLoad: Math.max(...trips.map(trip => trip.passengers.peak), 0)
      },
      performance: {
        averageSpeed: trips.length > 0 ? Math.round((trips.reduce((sum, trip) => sum + trip.performance.averageSpeed, 0) / trips.length) * 100) / 100 : 0,
        onTimePerformance: completedTrips.length > 0 ? Math.round((completedTrips.reduce((sum, trip) => sum + trip.performance.onTimePerformance, 0) / completedTrips.length) * 100) / 100 : 0,
        totalIncidents: trips.reduce((sum, trip) => sum + trip.incidents.emergencyAlerts + trip.incidents.breakdowns + trip.incidents.trafficDelays + trip.incidents.weatherIssues, 0)
      },
      drivers: {
        totalActiveDrivers: Object.keys(driverStats).length,
        topPerformers: Object.entries(driverStats)
          .map(([driverId, stats]: [string, any]) => ({
            driverId,
            trips: stats.trips,
            averageRating: stats.rating.length > 0 ? Math.round((stats.rating.reduce((a: number, b: number) => a + b, 0) / stats.rating.length) * 100) / 100 : 0,
            totalPassengers: stats.totalPassengers,
            incidents: stats.incidents
          }))
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 5)
      }
    };
    
    console.log('✅ System analytics calculated');
    res.json({
      success: true,
      analytics,
      period: `${daysNum} days`
    });
    
  } catch (error) {
    console.error('❌ Error getting system analytics:', error);
    res.status(500).json({ error: 'Failed to get system analytics' });
  }
});

// Helper function to send emergency notifications
async function sendEmergencyNotifications(alert: any) {
  try {
    let userIds: string[] = [];
    
    // Get affected users based on alert context
    if (alert.busId) {
      // Get passengers who might be on this bus (in production, you'd track this)
      const passengers = await User.find({ role: 'Passenger' }).select('_id').limit(50);
      userIds = passengers.map((p: any) => p._id.toString());
    } else if (alert.routeId) {
      // Get passengers who use this route
      const passengers = await User.find({ role: 'Passenger' }).select('_id').limit(100);
      userIds = passengers.map((p: any) => p._id.toString());
    } else {
      // Broadcast to all users for general emergencies
      const allUsers = await User.find().select('_id').limit(200);
      userIds = allUsers.map((u: any) => u._id.toString());
    }

    // Always notify admins
    const admins = await Admin.find().select('_id');
    const adminIds = admins.map((a: any) => a._id.toString());
    userIds = [...userIds, ...adminIds];

    // Create notifications for all affected users
    const notifications = userIds.map(userId => ({
      userId,
      userType: 'all',
      title: `🚨 ${alert.title}`,
      body: alert.description,
      type: 'emergency',
      priority: alert.severity,
      data: {
        alertId: alert.alertId,
        alertType: alert.alertType,
        busId: alert.busId,
        routeId: alert.routeId,
        location: alert.location
      },
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
    }));

    await PushNotification.insertMany(notifications);
    
    // Update alert to mark notifications as sent
    await EmergencyAlert.findOneAndUpdate(
      { alertId: alert.alertId },
      { 
        notificationsSent: true,
        affectedUsers: userIds
      }
    );

    console.log(`📱 Emergency notifications sent to ${notifications.length} users for alert ${alert.alertId}`);
  } catch (error) {
    console.error('Error sending emergency notifications:', error);
  }
}

// Helper function to send status update notifications
async function sendStatusUpdateNotifications(alert: any, newStatus: string) {
  try {
    const statusMessages = {
      acknowledged: `Emergency alert "${alert.title}" has been acknowledged by admin team.`,
      resolved: `Emergency alert "${alert.title}" has been resolved. Thank you for your patience.`,
      dismissed: `Emergency alert "${alert.title}" has been dismissed.`
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages];
    if (!message) return;

    const notifications = alert.affectedUsers.map((userId: string) => ({
      userId,
      userType: 'all',
      title: `Update: ${alert.title}`,
      body: message,
      type: 'emergency',
      priority: 'medium',
      data: {
        alertId: alert.alertId,
        status: newStatus,
        resolutionNotes: alert.resolutionNotes
      },
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
    }));

    await PushNotification.insertMany(notifications);
    
    console.log(`📱 Status update notifications sent for alert ${alert.alertId}`);
  } catch (error) {
    console.error('Error sending status update notifications:', error);
  }
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
