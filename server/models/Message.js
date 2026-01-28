const { mongoose, sequelize, DataTypes, dbType } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Message;

if (dbType === 'mysql') {
  Message = sequelize.define(
    'Message',
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
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: 'messages',
      timestamps: true
    }
  );

  attachMySQLHelpers(Message);
} else {
  const messageSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  Message = mongoose.model('Message', messageSchema);
}

module.exports = Message;
