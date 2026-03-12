import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Note',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;