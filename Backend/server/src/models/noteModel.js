import mongoose from 'mongoose';

const noteSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  filePathUrl: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  fileType: { type: String, enum: ['pdf','word','image','other'], required: true },
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);
export default Note;
