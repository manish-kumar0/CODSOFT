const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: [true, 'Please add your company name']
  },
  website: {
    type: String
  },
  description: {
    type: String
  },
  address: {
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

module.exports = mongoose.model('Employer', EmployerSchema);