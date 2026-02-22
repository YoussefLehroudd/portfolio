const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let EmailSettings;

if (isSQL) {
  EmailSettings = sequelize.define(
    'EmailSettings',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      fromName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: true
      },
      fromEmail: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notifyEmail: {
        type: DataTypes.STRING,
        allowNull: true
      },
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      smtpHost: {
        type: DataTypes.STRING,
        allowNull: true
      },
      smtpPort: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      smtpUser: {
        type: DataTypes.STRING,
        allowNull: true
      },
      smtpPass: {
        type: DataTypes.STRING,
        allowNull: true
      },
      smtpSecure: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      }
    },
    {
      tableName: 'email_settings',
      timestamps: true
    }
  );

  attachMySQLHelpers(EmailSettings);
} else {
  const emailSettingsSchema = new mongoose.Schema({
    fromName: {
      type: String,
      trim: true
    },
    provider: {
      type: String,
      trim: true
    },
    fromEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    notifyEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    logoUrl: {
      type: String,
      trim: true
    },
    smtpHost: {
      type: String,
      trim: true
    },
    smtpPort: {
      type: Number
    },
    smtpUser: {
      type: String,
      trim: true
    },
    smtpPass: {
      type: String
    },
    smtpSecure: {
      type: Boolean
    }
  }, {
    timestamps: true
  });

  EmailSettings = mongoose.model('EmailSettings', emailSettingsSchema);
}

module.exports = EmailSettings;
