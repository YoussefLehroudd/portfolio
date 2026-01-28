const { mongoose, sequelize, DataTypes, dbType } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Category;

if (dbType === 'mysql') {
  Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    },
    {
      tableName: 'categories',
      timestamps: true
    }
  );

  attachMySQLHelpers(Category);
} else {
  const categorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  Category = mongoose.model('Category', categorySchema);
}

module.exports = Category;
