const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SoilHealth = sequelize.define('SoilHealth', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    farmer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    residue_burned: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    manure_kg: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    compost_kg: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    ph: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    health_score: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    synced: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'soil_health',
    timestamps: true,
    underscored: true,
});

SoilHealth.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.farmerId = values.farmer_id;
    values.residueBurned = values.residue_burned;
    values.manureKg = values.manure_kg;
    values.compostKg = values.compost_kg;
    values.healthScore = values.health_score;
    values.createdAt = values.created_at;
    values.updatedAt = values.updated_at;
    delete values.farmer_id;
    delete values.residue_burned;
    delete values.manure_kg;
    delete values.compost_kg;
    delete values.health_score;
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = SoilHealth;
