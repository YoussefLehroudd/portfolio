const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');
const ensureDirectories = require('../utils/ensureDirectories');
require('dotenv').config();

const rawDbType = (process.env.DB_TYPE || 'mongodb').toLowerCase();
const isMySQL = rawDbType === 'mysql';
const isPostgres = ['postgres', 'postgresql', 'pg'].includes(rawDbType);
const isSQL = isMySQL || isPostgres;
const dbType = isPostgres ? 'postgresql' : rawDbType;

// Initialize Sequelize instance early so models can import it
let sequelize = null;
if (isSQL) {
  const sqlOptions = {
    dialect: isPostgres ? 'postgres' : 'mysql',
    logging: false,
  };

  if (isPostgres) {
    sqlOptions.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  const connectionUri =
    process.env.POSTGRES_URI ||
    process.env.POSTGRES_URL ||
    process.env.PG_URI ||
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL;

  if (connectionUri) {
    sequelize = new Sequelize(connectionUri, sqlOptions);
  } else {
    const dbName = isPostgres
      ? process.env.POSTGRES_DB || process.env.PGDATABASE || process.env.DB_NAME
      : process.env.MYSQL_DATABASE || process.env.MYSQL_DB || process.env.DB_NAME;

    const username = isPostgres
      ? process.env.POSTGRES_USER || process.env.PGUSER
      : process.env.MYSQL_USER;

    const password = isPostgres
      ? process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD
      : process.env.MYSQL_PASSWORD;

    const host = isPostgres
      ? process.env.POSTGRES_HOST || process.env.PGHOST
      : process.env.MYSQL_HOST;

    const port = isPostgres
      ? process.env.POSTGRES_PORT || process.env.PGPORT
      : process.env.MYSQL_PORT;

    sequelize = new Sequelize(dbName, username, password, {
      host,
      port,
      ...sqlOptions,
    });
  }
}

const shouldExit = () => !process.env.VERCEL; // avoid process.exit in serverless

const connectDatabase = async () => {
  // Ensure required directories exist for file uploads
  await ensureDirectories();

  if (isSQL) {
    if (!sequelize) {
      const msg = `FATAL ERROR: ${isPostgres ? 'PostgreSQL' : 'MySQL'} configuration is not defined.`;
      console.error(msg);
      if (shouldExit()) process.exit(1);
      throw new Error(msg);
    }

    try {
      await sequelize.authenticate();
      // Sync all defined models to ensure tables exist
      await sequelize.sync();

      // Ensure message read status column exists for SQL stores
      try {
        const queryInterface = sequelize.getQueryInterface();
        const table = await queryInterface.describeTable('messages');
        if (!table.isRead) {
          await queryInterface.addColumn('messages', 'isRead', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          });
        }
      } catch (err) {
        console.error('Failed to ensure messages.isRead column:', err);
      }
      // Ensure email settings optional columns exist for SQL stores
      try {
        const queryInterface = sequelize.getQueryInterface();
        const table = await queryInterface.describeTable('email_settings');
        if (!table.logoUrl) {
          await queryInterface.addColumn('email_settings', 'logoUrl', {
            type: DataTypes.STRING,
            allowNull: true
          });
        }
      } catch (err) {
        console.error('Failed to ensure email_settings.logoUrl column:', err);
      }
      console.log(`Connected to ${isPostgres ? 'PostgreSQL' : 'MySQL'}`);
    } catch (err) {
      console.error(`${isPostgres ? 'PostgreSQL' : 'MySQL'} connection error:`, err);
      if (shouldExit()) process.exit(1);
      throw err;
    }
    return;
  }

  if (!process.env.MONGODB_URI) {
    const msg = 'FATAL ERROR: MONGODB_URI is not defined.';
    console.error(msg);
    if (shouldExit()) process.exit(1);
    throw new Error(msg);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (shouldExit()) process.exit(1);
    throw err;
  }
};

module.exports = {
  connectDatabase,
  mongoose,
  sequelize,
  Sequelize,
  DataTypes,
  dbType,
  isSQL,
  isMySQL,
  isPostgres,
};
