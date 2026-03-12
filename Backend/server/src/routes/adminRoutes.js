import express from "express";
import asyncHandler from "express-async-handler";
import Note from "../models/noteModel.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import User from "../models/userModel.js";

const router = express.Router();

// @desc    Get all notes
// @route   GET /api/admin/notes
// @access  Admin
router.get(
  "/notes",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const notes = await Note.find().populate("user", "name email");
    res.json(notes);
  })
);

// @desc    Delete any note
// @route   DELETE /api/admin/notes/:id
// @access  Admin
router.delete(
  "/notes/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);
    if (note) {
      await note.remove();
      res.json({ message: "Note deleted by admin" });
    } else {
      res.status(404);
      throw new Error("Note not found");
    }
  })
);
// @desc    Approve a note
// @route   PUT /api/admin/notes/:id/approve
// @access  Admin
router.put(
  "/notes/:id/approve",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (note) {
      note.approved = true;
      note.approvedBy = req.user._id;
      const updatedNote = await note.save();
      res.json(updatedNote);
    } else {
      res.status(404);
      throw new Error("Note not found");
    }
  })
);
// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
router.get(
  "/stats",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const totalUsers = await (await import("../models/userModel.js")).default.countDocuments();
    const totalNotes = await (await import("../models/noteModel.js")).default.countDocuments();
    const approvedNotes = await (await import("../models/noteModel.js")).default.countDocuments({ approved: true });
    const pendingNotes = await (await import("../models/noteModel.js")).default.countDocuments({ approved: false });

    res.json({
      totalUsers,
      totalNotes,
      approvedNotes,
      pendingNotes,
    });
  })
);



// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
router.get(
  "/users",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
  })
);

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
router.delete(
  "/users/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.isAdmin) {
        res.status(400);
        throw new Error("Cannot delete another admin");
      }
      await user.remove();
      res.json({ message: "User deleted" });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

// @desc    Toggle admin role
// @route   PUT /api/admin/users/:id/toggle-admin
// @access  Admin
router.put(
  "/users/:id/toggle-admin",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot change your own role");
      }
      user.isAdmin = !user.isAdmin;
      await user.save();
      res.json({ message: "User role updated", user });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);




export default router;
