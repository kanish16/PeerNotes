import mongoose from 'mongoose';

const chatSchema = mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  message: { type: String, required: true },
  noteId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Note' },
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
