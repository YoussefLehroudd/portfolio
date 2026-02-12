const { mongoose, sequelize, DataTypes, isSQL } = require('../config/database');
const { attachMySQLHelpers, parseSort } = require('../utils/dbHelpers');

let Statistics;

if (isSQL) {
    Statistics = sequelize.define(
        'Statistics',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                unique: true
            },
            visits: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            project_clicks: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            project_details: {
                type: DataTypes.JSON,
                defaultValue: []
            }
        },
        {
            tableName: 'statistics',
            timestamps: true
        }
    );

    attachMySQLHelpers(Statistics);

    Statistics.incrementVisits = async function() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateOnly = today.toISOString().split('T')[0];

        const [stats] = await Statistics.findOrCreate({
            where: { date: dateOnly },
            defaults: { visits: 0, project_clicks: 0, project_details: [] }
        });

        stats.visits += 1;
        await stats.save();
        return stats;
    };

    Statistics.incrementProjectClicks = async function(projectId, projectTitle, projectImage) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateOnly = today.toISOString().split('T')[0];

        const [stats] = await Statistics.findOrCreate({
            where: { date: dateOnly },
            defaults: { visits: 0, project_clicks: 0, project_details: [] }
        });

        const details = Array.isArray(stats.project_details) ? [...stats.project_details] : [];
        const index = details.findIndex((d) => d.project_id === projectId);

        if (index >= 0) {
            details[index].clicks = (details[index].clicks || 0) + 1;
        } else {
            details.push({
                project_id: projectId,
                title: projectTitle,
                image: projectImage,
                clicks: 1
            });
        }

        stats.project_clicks += 1;
        stats.project_details = details;
        await stats.save();
        return stats;
    };

    Statistics.getStatistics = async function() {
        return Statistics.findAll({
            order: parseSort({ date: -1 }),
            limit: 30
        });
    };
} else {
    const statisticsSchema = new mongoose.Schema({
        date: {
            type: Date,
            required: true,
            default: Date.now,
            unique: true
        },
        visits: {
            type: Number,
            default: 0
        },
        project_clicks: {
            type: Number,
            default: 0
        },
        project_details: [{
            project_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Project'
            },
            title: String,
            image: String,
            clicks: {
                type: Number,
                default: 0
            }
        }]
    }, { timestamps: true });

    // Static methods
    statisticsSchema.statics.incrementVisits = async function() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await this.findOneAndUpdate(
            { date: today },
            { $inc: { visits: 1 } },
            { upsert: true, new: true }
        );
        return stats;
    };

    statisticsSchema.statics.incrementProjectClicks = async function(projectId, projectTitle, projectImage) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // First try to update existing project details
        const existingStats = await this.findOneAndUpdate(
            { 
                date: today,
                'project_details.project_id': projectId
            },
            { 
                $inc: { 
                    project_clicks: 1,
                    'project_details.$.clicks': 1
                }
            },
            { new: true }
        );

        if (existingStats) {
            return existingStats;
        }

        // If project doesn't exist in today's stats, create new entry
        return this.findOneAndUpdate(
            { date: today },
            { 
                $inc: { project_clicks: 1 },
                $push: { 
                    project_details: {
                        project_id: projectId,
                        title: projectTitle,
                        image: projectImage,
                        clicks: 1
                    }
                }
            },
            { upsert: true, new: true }
        );
    };

    statisticsSchema.statics.getStatistics = async function() {
        return this.find()
            .sort({ date: -1 })
            .limit(30);
    };

    Statistics = mongoose.model('Statistics', statisticsSchema);
}

module.exports = Statistics;
