const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Stock;

if (isSQL) {
  Stock = sequelize.define(
    'Stock',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      emailBody: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'draft'
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      }
    },
    {
      tableName: 'stocks',
      timestamps: true
    }
  );

  attachMySQLHelpers(Stock);
} else {
  const stockSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true
      },
      emailBody: {
        type: String,
        default: ''
      },
      imageUrl: {
        type: String,
        default: ''
      },
      status: {
        type: String,
        enum: ['draft', 'active'],
        default: 'draft'
      },
      tags: [
        {
          type: String,
          trim: true
        }
      ]
    },
    {
      timestamps: true
    }
  );

  Stock = mongoose.model('Stock', stockSchema);
}

module.exports = Stock;
