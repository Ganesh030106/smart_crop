const { sequelize } = require('../config/database');

const User = require('./User');
const AdvisoryRule = require('./AdvisoryRule');
const AlertRule = require('./AlertRule');
const Log = require('./Log');
const SoilHealth = require('./SoilHealth');
const Advisory = require('./Advisory');
const PlanningSession = require('./PlanningSession');

// ── Associations ────────────────────────────────────────────────────────────
User.hasMany(Log, { foreignKey: 'farmer_id', as: 'logs' });
Log.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });

User.hasMany(SoilHealth, { foreignKey: 'farmer_id', as: 'soilHealthRecords' });
SoilHealth.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });

User.hasMany(Advisory, { foreignKey: 'farmer_id', as: 'advisories' });
Advisory.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });

User.hasMany(PlanningSession, { foreignKey: 'farmer_id', as: 'planningSessions' });
PlanningSession.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });

AdvisoryRule.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

module.exports = {
    sequelize,
    User,
    AdvisoryRule,
    AlertRule,
    Log,
    SoilHealth,
    Advisory,
    PlanningSession,
};
