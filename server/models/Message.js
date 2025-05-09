const { mongoose } = require('../config/database');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// MongoDB Schema
const mongoMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// MySQL Model
const sqlMessageModel = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Create a unified model interface
class MessageModel {
  constructor(dbType) {
    this.dbType = dbType;
    this.MongoMessage = mongoose.model('Message', mongoMessageSchema);
    this.SQLMessage = sqlMessageModel;
  }

  async create(messageData) {
    if (this.dbType === 'mongodb') {
      const message = new this.MongoMessage(messageData);
      return await message.save();
    } else {
      return await this.SQLMessage.create(messageData);
    }
  }

  async findAll() {
    if (this.dbType === 'mongodb') {
      return await this.MongoMessage.find();
    } else {
      return await this.SQLMessage.findAll();
    }
  }
}

module.exports = MessageModel;
