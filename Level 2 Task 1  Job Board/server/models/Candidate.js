const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  skills: {
    type: [String],
    required: [true, 'Please add at least one skill']
  },
  experience: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    default: 'entry'
  },
  education: {
    type: String,
    enum: ['highschool', 'bachelor', 'master', 'phd'],
    default: 'highschool'
  },
  resume: {
    type: String
  },
  location: {
    type: String
  },
  phone: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema);