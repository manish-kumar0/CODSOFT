const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  requirements: {
    type: [String],
    required: [true, 'Please add at least one requirement']
  },
  skills: {
    type: [String],
    required: [true, 'Please add at least one skill']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    default: 'full-time'
  },
  salary: {
    type: Number
  },
  employer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employer',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Job', JobSchema);