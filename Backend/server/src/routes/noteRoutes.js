// server/src/routes/noteRoutes.js
import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import {
  getAllApprovedNotes,
  getAllNotesForAdmin,
  getNoteById,
  getMyNotes,
  createNote,
  createNoteReview,
  updateNoteStatus,
  updateNote,
  deleteNote,
  getNoteChatHistory,
  downloadNoteFile,
} from '../controllers/noteController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// PUBLIC - approved notes (dashboard / search)
router.get('/', getAllApprovedNotes);

// ADMIN - all notes (pending + approved + rejected)
router.get('/admin', protect, admin, getAllNotesForAdmin);

// PRIVATE - user's own notes
router.get('/mynotes', protect, getMyNotes);

// PRIVATE - create note
router.post('/', protect, upload.single('file'), createNote);

// DOWNLOAD - return file URL for a note (protected)
router.get('/download/:id', protect, downloadNoteFile);

// Reviews (private)
router.post('/:id/reviews', protect, createNoteReview);

// Chat history (public)
router.get('/:id/chat', getNoteChatHistory);

// Admin endpoints (status update) - must come before general ':id' GET
router.put('/:id/status', protect, admin, updateNoteStatus);

// Update note, delete note (owner)
router.put('/:id', protect, upload.single('file'), updateNote);
router.delete('/:id', protect, deleteNote);

// GENERAL: get note by id (last, after specific routes)
router.get('/:id', getNoteById);

export default router;
