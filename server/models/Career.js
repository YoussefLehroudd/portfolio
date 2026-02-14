const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Career;

if (isSQL) {
  Career = sequelize.define(
    'Career',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      headline: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Career Journey'
      },
      subheadline: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Where I studied and what I build today'
      },
      intro: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          'From structured learning to real-world delivery, I build full-stack products that feel fast, intentional, and reliable.'
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      }
    },
    {
      tableName: 'career',
      timestamps: true
    }
  );

  attachMySQLHelpers(Career);
} else {
  const CareerItemSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    place: {
      type: String,
      required: true
    },
    period: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    tags: [{
      type: String,
      required: false
    }],
    isCurrent: {
      type: Boolean,
      default: false
    }
  });

  const CareerSchema = new mongoose.Schema(
    {
      headline: {
        type: String,
        required: true
      },
      subheadline: {
        type: String,
        required: true
      },
      intro: {
        type: String,
        required: true
      },
      items: [CareerItemSchema]
    },
    { timestamps: true }
  );

  Career = mongoose.model('Career', CareerSchema);
}

module.exports = Career;
