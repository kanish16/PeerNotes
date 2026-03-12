import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import mongoose from 'mongoose';

// register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, university } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const user = await User.create({ name, email, password, university });
  if (user) {
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      isAdmin: user.isAdmin, token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// login
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id, name: user.name, email: user.email,
      isAdmin: user.isAdmin, token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// get profile by id (public)
const getUserProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid User ID format');
  }
  const user = await User.findById(id).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json(user);
});

// admin: get all users
const getAllUsers = asyncHandler(async (req,res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// admin: update role (promote/demote)
const updateUserRole = asyncHandler(async (req,res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isAdmin = !!req.body.isAdmin;
  await user.save();
  res.json({ message: 'User role updated', user });
});

// admin: delete
const deleteUser = asyncHandler(async (req,res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.isAdmin) { res.status(400); throw new Error('Cannot delete admin'); }
  await user.deleteOne();
  res.json({ message: 'User removed' });
});

export { registerUser, authUser, getUserProfileById, getAllUsers, updateUserRole, deleteUser };
