const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers, parseSort } = require('../utils/dbHelpers');

let VisitLog;

if (isSQL) {
  VisitLog = sequelize.define(
    'VisitLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      ip: {
        type: DataTypes.STRING
      },
      country: {
        type: DataTypes.STRING
      },
      region: {
        type: DataTypes.STRING
      },
      city: {
        type: DataTypes.STRING
      },
      timezone: {
        type: DataTypes.STRING
      },
      latitude: {
        type: DataTypes.FLOAT
      },
      longitude: {
        type: DataTypes.FLOAT
      },
      userAgent: {
        type: DataTypes.TEXT
      },
      referrer: {
        type: DataTypes.STRING
      },
      path: {
        type: DataTypes.STRING
      },
      language: {
        type: DataTypes.STRING
      },
      device: {
        type: DataTypes.STRING
      },
      platform: {
        type: DataTypes.STRING
      },
      screen: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: 'visit_logs',
      timestamps: true
    }
  );

  attachMySQLHelpers(VisitLog);

  VisitLog.getRecent = function(limit = 50) {
    return VisitLog.findAll({
      order: parseSort({ createdAt: -1 }),
      limit
    });
  };
} else {
  const visitLogSchema = new mongoose.Schema(
    {
      ip: String,
      country: String,
      region: String,
      city: String,
      timezone: String,
      latitude: Number,
      longitude: Number,
      userAgent: String,
      referrer: String,
      path: String,
      language: String,
      device: String,
      platform: String,
      screen: String
    },
    { timestamps: true }
  );

  visitLogSchema.statics.getRecent = function(limit = 50) {
    return this.find().sort({ createdAt: -1 }).limit(limit);
  };

  VisitLog = mongoose.model('VisitLog', visitLogSchema);
}

module.exports = VisitLog;
