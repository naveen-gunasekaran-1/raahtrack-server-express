import mongoose from "mongoose";
import  Admin  from "./models/Admin.ts";
const seedAdmin = async() =>{
    mongoose.connect("mongodb://127.0.0.1:27017/RAAHTRACK");
    const admins = [
      { name: "NAVEEN", email: "naveen@raahtrack.com", password: "Super123!", role: "SuperAdmin" },
      { name: "MONAL", email: "monal@raahtrack.com", password: "Super456!", role: "SuperAdmin" },
      { name: "HARINI", email: "harini@raahtrack.com", password: "Admin123!", role: "Admin" },
      { name: "NARAYANAN", email: "narayanan@raahtrack.com", password: "Admin456!", role: "Admin" },
    ];
    for(const a of admins)
    {
        const admin = new Admin(a);
        await admin.save();
    }
    mongoose.disconnect();
}

seedAdmin();