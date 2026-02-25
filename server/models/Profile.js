const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Profile;

if (isSQL) {
  Profile = sequelize.define(
    'Profile',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      seoTitle: {
        type: DataTypes.STRING,
        allowNull: true
      },
      seoDescription: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      seoImage: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      tableName: 'profiles',
      timestamps: true
    }
  );

  attachMySQLHelpers(Profile);
} else {
  const profileSchema = new mongoose.Schema({
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    seoTitle: {
      type: String,
      trim: true,
      default: ''
    },
    seoDescription: {
      type: String,
      trim: true,
      default: ''
    },
    seoImage: {
      type: String,
      trim: true,
      default: ''
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  }, {
    timestamps: true
  });

  Profile = mongoose.model('Profile', profileSchema);
}

module.exports = Profile;
