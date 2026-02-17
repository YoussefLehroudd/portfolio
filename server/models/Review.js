const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Review;

if (isSQL) {
  Review = sequelize.define(
    'Review',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
      }
    },
    {
      tableName: 'reviews',
      timestamps: true
    }
  );

  attachMySQLHelpers(Review);
} else {
  const reviewSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      imageUrl: {
        type: String,
        default: ''
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    },
    {
      timestamps: true
    }
  );

  Review = mongoose.model('Review', reviewSchema);
}

module.exports = Review;
