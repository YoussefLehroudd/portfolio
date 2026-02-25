const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let EmailLog;

if (isSQL) {
  EmailLog = sequelize.define(
    'EmailLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      trackingId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      recipient: {
        type: DataTypes.STRING,
        allowNull: false
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: true
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      openedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      openCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: 'email_logs',
      timestamps: true
    }
  );

  attachMySQLHelpers(EmailLog);
} else {
  const emailLogSchema = new mongoose.Schema({
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    subject: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: ''
    },
    provider: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: 'pending'
    },
    error: {
      type: String,
      default: ''
    },
    sentAt: {
      type: Date
    },
    openedAt: {
      type: Date
    },
    openCount: {
      type: Number,
      default: 0
    }
  }, {
    timestamps: true
  });

  EmailLog = mongoose.model('EmailLog', emailLogSchema);
}

module.exports = EmailLog;
