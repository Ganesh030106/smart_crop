const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlertRule = sequelize.define('AlertRule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    region: {
        type: DataTypes.STRING,
        defaultValue: 'all',
    },
    type: {
        type: DataTypes.ENUM('weather', 'pest', 'market'),
        allowNull: false,
    },
    severity: {
        type: DataTypes.ENUM('high', 'medium', 'low'),
        defaultValue: 'medium',
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'alert_rules',
    timestamps: true,
    underscored: true,
});

AlertRule.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.isActive = values.is_active;
    values.expiresAt = values.expires_at;
    values.createdAt = values.created_at;
    values.updatedAt = values.updated_at;
    delete values.is_active;
    delete values.expires_at;
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = AlertRule;
