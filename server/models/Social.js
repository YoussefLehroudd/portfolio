const { mongoose, sequelize, DataTypes, dbType } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Social;

if (dbType === 'mysql') {
  Social = sequelize.define(
    'Social',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      github: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://github.com'
      },
      whatsapp: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://wa.me'
      },
      instagram: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://instagram.com'
      },
      linkedin: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://linkedin.com'
      }
    },
    {
      tableName: 'social',
      timestamps: true
    }
  );

  attachMySQLHelpers(Social);
} else {
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

  Social = mongoose.model('Social', socialSchema);
}

module.exports = Social;
