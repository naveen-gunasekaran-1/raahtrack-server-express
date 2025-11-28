import express from "express";
import Admin from "../models/Admin.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import  verifyAdmin from "../middleware/adminAuth.ts";
import verifySuperAdmin from "../middleware/adminAuth.ts"

const router = express.Router();

// 🔑 Login Admin
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(400).json({ error: "Admin not found" });

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  res.json({ token, role: admin.role, name: admin.name });
});

// 👑 Add Admin (SuperAdmin only) - Temporarily disabled auth for testing
router.post("/add", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ error: "Admin already exists" });

    const newAdmin = new Admin({ name, email, password, role: role || "Admin" });
    await newAdmin.save();

    res.json({ message: "Admin created successfully", admin: newAdmin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ❌ Delete Admin (SuperAdmin only) - Temporarily disabled auth for testing
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    await Admin.findByIdAndDelete(id);
    res.json({ message: "Admin deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 List Admins (SuperAdmin only) - Temporarily disabled auth for testing
router.get("/", async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
