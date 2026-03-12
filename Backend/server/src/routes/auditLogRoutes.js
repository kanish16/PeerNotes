import express from 'express';
const router = express.Router();
import AuditLog from '../models/auditLogModel.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'name email')
      .populate('documentId', 'title')
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;