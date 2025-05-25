const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  attachments: [{
    type: String // URLs to uploaded files
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
leaveRequestSchema.index({ employee: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });
leaveRequestSchema.index({ status: 1 });

// Calculate duration in days
leaveRequestSchema.virtual('duration').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest; 