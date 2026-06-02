const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
    },
    region: {
        type: DataTypes.STRING,
        defaultValue: '',
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'en',
    },
    gps_lat: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    gps_lon: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    consent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
});

// Return camelCase fields for frontend compatibility
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password; // Never expose hashed password in API responses
    values._id = values.id;
    values.isActive = values.is_active;
    values.lastLogin = values.last_login;
    values.gpsCoords = { lat: values.gps_lat, lon: values.gps_lon };
    values.createdAt = values.created_at;
    values.updatedAt = values.updated_at;
    delete values.is_active;
    delete values.last_login;
    delete values.gps_lat;
    delete values.gps_lon;
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = User;
