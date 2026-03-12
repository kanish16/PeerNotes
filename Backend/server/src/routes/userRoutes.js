import express from 'express';
const router = express.Router();
import { registerUser, authUser, getUserProfileById, getAllUsers, updateUserRole, deleteUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/:id', getUserProfileById);

// admin routes
router.get('/', protect, admin, getAllUsers);
router.put('/:id/admin', protect, admin, updateUserRole);
router.delete('/:id', protect, admin, deleteUser);

export default router;
