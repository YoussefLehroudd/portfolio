const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Hero;

if (isSQL) {
  Hero = sequelize.define(
    'Hero',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Hi, I'm"
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Youssef'
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Full Stack Developer'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'I create engaging web experiences with modern technologies'
      },
      splineUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://prod.spline.design/daHslO6sl8nd7EVW/scene.splinecode'
      },
      primaryButton: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          text: 'View My Work',
          link: '#projects'
        }
      },
      secondaryButton: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          text: 'Get in Touch',
          link: '#contact'
        }
      },
      cvButton: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          text: 'Download CV',
          link: '/youssef_cv.pdf'
        }
      }
    },
    {
      tableName: 'heroes',
      timestamps: true
    }
  );

  attachMySQLHelpers(Hero);
} else {
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
    },
    cvButton: {
      text: {
        type: String,
        required: true,
        default: "Download CV"
      },
      link: {
        type: String,
        required: true,
        default: "/youssef_cv.pdf"
      }
    }
  }, { timestamps: true });

  Hero = mongoose.model('Hero', heroSchema);
}

module.exports = Hero;
