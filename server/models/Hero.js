const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    default: "Hi, I'm"
  },
  lastName: {
    type: String,
    required: true,
    default: "Youssef"
  },
  title: {
    type: String,
    required: true,
    default: "Full Stack Developer"
  },
  description: {
    type: String,
    required: true,
    default: "I create engaging web experiences with modern technologies"
  },
  splineUrl: {
    type: String,
    required: true,
    default: "https://prod.spline.design/daHslO6sl8nd7EVW/scene.splinecode"
  },
  primaryButton: {
    text: {
      type: String,
      required: true,
      default: "View My Work"
    },
    link: {
      type: String,
      required: true,
      default: "#projects"
    }
  },
  secondaryButton: {
    text: {
      type: String,
      required: true,
      default: "Get in Touch"
    },
    link: {
      type: String,
      required: true,
      default: "#contact"
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Hero', heroSchema);
