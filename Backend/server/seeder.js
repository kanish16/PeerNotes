import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./src/models/userModel.js";
import Note from "./src/models/noteModel.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const importData = async () => {
  try {
    await connectDB();

    // Clear collections
    await User.deleteMany();
    await Note.deleteMany();

    // Create users
    const users = await User.insertMany([
      {
        name: "Admin User",
        email: "admin@example.com",
        password: bcrypt.hashSync("123456", 10),
        isAdmin: true,
      },
      {
        name: "Student One",
        email: "student1@example.com",
        password: bcrypt.hashSync("123456", 10),
        isAdmin: false,
      },
      {
        name: "Student Two",
        email: "student2@example.com",
        password: bcrypt.hashSync("123456", 10),
        isAdmin: false,
      },
    ]);

    const admin = users[0];
    const student1 = users[1];
    const student2 = users[2];

    // Create sample notes (uploaded by students)
    await Note.insertMany([
      {
        title: "CSE 1st Year Notes",
        content: "Introduction to Programming basics",
        year: "1st Year",
        department: "CSE",
        approved: true, // already approved for testing
        user: student1._id,
      },
      {
        title: "ECE 2nd Year Notes",
        content: "Digital Electronics",
        year: "2nd Year",
        department: "ECE",
        approved: false, // pending approval
        user: student2._id,
      },
      {
        title: "EEE 3rd Year Notes",
        content: "Power Systems Analysis",
        year: "3rd Year",
        department: "EEE",
        approved: false,
        user: student1._id,
      },
    ]);

    console.log("✅ Admin, Students & Notes created successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

importData();
