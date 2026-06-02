const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdvisoryRule = sequelize.define('AdvisoryRule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    crop: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category: {
        type: DataTypes.ENUM('crop', 'pest', 'fertilizer', 'market'),
        allowNull: false,
    },
    season: {
        type: DataTypes.STRING,
        defaultValue: 'all',
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    recommendation: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    pest_name: {
        type: DataTypes.STRING,
        defaultValue: '',
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    is_private: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    tableName: 'advisory_rules',
    timestamps: true,
    underscored: true,
});

AdvisoryRule.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.pestName = values.pest_name;
    values.isActive = values.is_active;
    values.isPrivate = values.is_private;
    values.updatedBy = values.updated_by;
    values.createdAt = values.created_at;
    values.updatedAt = values.updated_at;
    delete values.pest_name;
    delete values.is_active;
    delete values.is_private;
    delete values.updated_by;
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = AdvisoryRule;
