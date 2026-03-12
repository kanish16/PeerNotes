import express from 'express';
const router = express.Router();
import { uploadFile } from '../controllers/uploadController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, upload.single('document'), uploadFile);

export default router;