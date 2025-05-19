const mongoose = require('mongoose');

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

const Statistics = mongoose.model('Statistics', statisticsSchema);

module.exports = Statistics;
