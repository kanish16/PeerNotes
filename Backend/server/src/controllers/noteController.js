// server/src/controllers/noteController.js
import mongoose from 'mongoose';
import Note from '../models/noteModel.js';
import Review from '../models/reviewModel.js';
import Chat from '../models/chatModel.js';
import cloudinary from '../config/cloudinaryConfig.js';

// GET /api/notes  -> approved notes (public)
const getAllApprovedNotes = async (req, res) => {
  try {
    const query = { status: 'approved' };

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    if (req.query.year) query.year = Number(req.query.year);
    if (req.query.semester) query.semester = Number(req.query.semester);

    let sortOptions = {};
    if (req.query.sortBy === 'rating') {
      sortOptions.rating = req.query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const notes = await Note.find(query).populate('uploader', 'name').sort(sortOptions);
    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/notes/admin -> admin: list all notes
const getAllNotesForAdmin = async (req, res) => {
  try {
    const notes = await Note.find({}).populate('uploader', 'name email').sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error (admin list)' });
  }
};

// GET /api/notes/:id -> public route to get single note (only approved visible? depends)
const getNoteById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Note ID format' });
  }

  try {
    const note = await Note.findById(id).populate({
      path: 'reviews',
      populate: { path: 'user', select: 'name' },
    }).populate('uploader', 'name');

    if (note) res.json(note);
    else res.status(404).json({ message: 'Note not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching note' });
  }
};

// GET /api/notes/mynotes -> user's notes
const getMyNotes = async (req, res) => {
  try {
    const notes = await Note.find({ uploader: req.user._id }).populate('uploader', 'name');
    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching user notes' });
  }
};

// POST /api/notes -> create note (protected)
const createNote = async (req, res) => {
  try {
    const { title, description, year, semester } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!title || !description || !year || !semester) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // upload to cloudinary, choose resource_type
    const isImage = file.mimetype.startsWith('image/');
    const isPDF = file.mimetype === 'application/pdf';
    const resource_type = isImage ? 'image' : 'raw';
    
    const uploadResult = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      { folder: 'peernotes', resource_type}
    );

    const fileType = isImage ? 'image' : isPDF ? 'pdf' : 'word';

    const filePathUrl =
      !isPDF && resource_type === 'raw'
        ? uploadResult.secure_url.replace('/upload/', '/upload/fl_attachment/')
        : uploadResult.secure_url;


    //const fileType = isImage ? 'image' : file.mimetype.includes('pdf') ? 'pdf' : 'word';

    //const filePathUrl = resource_type === "raw" ? uploadResult.secure_url.replace("/upload/", "/upload/fl_attachment/") : uploadResult.secure_url;
    //const fileType = isImage ? 'image' : (uploadResult.format === 'pdf' ? 'pdf' : 'word');

    /*const filePathUrl = (() => {
      if (resource_type === "raw") {
        const ext = uploadResult.format?.toLowerCase();
        if (ext === "pdf") {
          // Allow inline preview for PDFs
          return uploadResult.secure_url.replace("/upload/", "/upload/fl_attachment:false/");
        } else {
          // Force download for Word or others
          return uploadResult.secure_url.replace("/upload/", "/upload/fl_attachment:true/");
        }
      }
      return uploadResult.secure_url; // image
    })();
*/

    
    const note = await Note.create({
      title,
      description,
      year: Number(year),
      semester: Number(semester),
      filePathUrl,
      uploader: req.user._id,
      fileType,
      status: 'pending',
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Create Note error', error);
    res.status(500).json({ message: 'Server error while creating note' });
  }
};

// POST /api/notes/:id/reviews  -> add review
const createNoteReview = async (req, res) => {
  const { id: noteId } = req.params;
  const { rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    return res.status(400).json({ message: 'Invalid Note ID format' });
  }

  try {
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const alreadyReviewed = await Review.findOne({ note: noteId, user: req.user._id });
    if (alreadyReviewed) return res.status(400).json({ message: 'You have already reviewed this note' });

    const review = new Review({
      rating: Number(rating),
      comment,
      note: noteId,
      user: req.user._id,
    });
    await review.save();

    const reviews = await Review.find({ note: noteId });
    note.numReviews = reviews.length;
    note.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await note.save();

    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating review' });
  }
};

// PUT /api/notes/:id/status -> admin approve/reject
const updateNoteStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Note ID format' });
  }

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (status === 'approved' || status === 'rejected') {
      note.status = status;
      const updated = await note.save();
      res.json(updated);
    } else {
      res.status(400).json({ message: 'Invalid status provided' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating note status' });
  }
};

// PUT /api/notes/:id -> update note (uploader only)
const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, description, year, semester } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Note ID format' });
  }

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.uploader.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to edit this note' });
    }

    const file = req.file;
    if (file) {
      const isImage = file.mimetype.startsWith('image/');
      const resource_type = isImage ? 'image' : 'raw';
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        { folder: 'peernotes', resource_type}
      );
      note.filePathUrl = uploadResult.secure_url;
      note.fileType = isImage ? 'image' : (uploadResult.format === 'pdf' ? 'pdf' : 'word');
    }

    note.title = title || note.title;
    note.description = description || note.description;
    note.year = year ? Number(year) : note.year;
    note.semester = semester ? Number(semester) : note.semester;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating note' });
  }
};

// DELETE /api/notes/:id -> uploader only
const deleteNote = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Note ID format' });

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.uploader.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'User not authorized to delete this note' });

    // Optionally remove from cloudinary: extract public id if needed
    // const publicId = ... (depends on how you stored it)

    await note.deleteOne();
    res.json({ message: 'Note removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting note' });
  }
};

// GET /api/notes/download/:id -> return file URL for front-end to open
const downloadNoteFile = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Note ID format' });

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    // return URL so frontend can open in new tab or trigger download
    //res.json({ url: note.filePathUrl });
    res.redirect(note.filePathUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching file' });
  }
};

// GET /api/notes/:id/chat -> chat history
const getNoteChatHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const messages = await Chat.find({ noteId: id }).populate('sender', 'name').sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching chat history' });
  }
};

export {
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
};
