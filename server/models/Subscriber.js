const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Subscriber;

if (isSQL) {
  Subscriber = sequelize.define(
    'Subscriber',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    },
    {
      tableName: 'subscribers',
      timestamps: true
    }
  );

  attachMySQLHelpers(Subscriber);
} else {
  const subscriberSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  Subscriber = mongoose.model('Subscriber', subscriberSchema);
}

module.exports = Subscriber;
