const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Avatar;

if (isSQL) {
  Avatar = sequelize.define(
    'Avatar',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
      },
      publicId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'avatars',
      timestamps: true
    }
  );

  attachMySQLHelpers(Avatar);
} else {
  const avatarSchema = new mongoose.Schema(
    {
      imageUrl: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        default: ''
      },
      label: {
        type: String,
        default: ''
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    { timestamps: true }
  );

  Avatar = mongoose.model('Avatar', avatarSchema);
}

module.exports = Avatar;
