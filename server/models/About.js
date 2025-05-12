const mongoose = require('mongoose');

const SkillCategory = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    required: true
  }]
});

const AboutSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  skillCategories: [SkillCategory]
}, { timestamps: true });

module.exports = mongoose.model('About', AboutSchema);
