import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE'],
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Note',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    details: {
      type: Object, // Stores before/after state for updates
    },
  },
  {
    timestamps: true,
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;