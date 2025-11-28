import express from "express";
import Driver from "../models/Driver.ts"
import  verifyAdmin  from "../middleware/adminAuth.ts";

const router = express.Router();

// Get all drivers
router.get("/", verifyAdmin, async (req, res) => {
  const drivers = await Driver.find();
  res.json(drivers);
});

// Add driver
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();
    res.status(201).json({ message: "Driver added successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update driver
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    await Driver.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Driver updated successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete driver
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ message: "Driver deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
