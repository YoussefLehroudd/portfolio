const { mongoose, sequelize, DataTypes, dbType } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let About;

if (dbType === 'mysql') {
  About = sequelize.define(
    'About',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      skillCategories: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      }
    },
    {
      tableName: 'about',
      timestamps: true
    }
  );

  attachMySQLHelpers(About);
} else {
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

  About = mongoose.model('About', AboutSchema);
}

module.exports = About;
