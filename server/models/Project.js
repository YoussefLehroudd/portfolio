const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  demoLink: {
    type: String,
    required: true
  },
  githubLink: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['HTML & CSS', 'JavaScript', 'React & MUI', 'Node & Express']
  },
  technologies: [{
    type: String,
    required: true
  }],
  timeline: {
    type: String,
    required: true
  },
  features: [{
    type: String,
    required: true
  }],
  isVisible: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
