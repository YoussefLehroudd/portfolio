const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers } = require('../utils/dbHelpers');

let Project;

if (isSQL) {
  Project = sequelize.define(
    'Project',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false
      },
      demoLink: {
        type: DataTypes.STRING,
        allowNull: false
      },
      githubLink: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false
      },
      technologies: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      timeline: {
        type: DataTypes.STRING,
        allowNull: false
      },
      features: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      isVisible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'projects',
      timestamps: true
    }
  );

  attachMySQLHelpers(Project);
} else {
  const projectSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    demoLink: {
      type: String,
      required: true
    },
    githubLink: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      validate: {
        validator: async function(value) {
          // Import Category model here to avoid circular dependency
          const Category = mongoose.model('Category');
          const category = await Category.findOne({ name: value });
          return !!category;
        },
        message: 'Category "{VALUE}" does not exist. Please create the category first.'
      }
    },
    technologies: [{
      type: String,
      required: true
    }],
    timeline: {
      type: String,
      required: true
    },
    features: [{
      type: String,
      required: true
    }],
    isVisible: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  Project = mongoose.model('Project', projectSchema);
}

module.exports = Project;
