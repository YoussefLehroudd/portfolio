const mongoose = require('mongoose');

const socialSchema = new mongoose.Schema({
  github: {
    type: String,
    required: true,
    default: 'https://github.com'
  },
  whatsapp: {
    type: String,
    required: true,
    default: 'https://wa.me'
  },
  instagram: {
    type: String,
    required: true,
    default: 'https://instagram.com'
  },
  linkedin: {
    type: String,
    required: true,
    default: 'https://linkedin.com'
  }
}, { timestamps: true });

module.exports = mongoose.model('Social', socialSchema);
