const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Log = sequelize.define('Log', {
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
    crop: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    urea_kg: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    synced: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'logs',
    timestamps: true,
    underscored: true,
});

Log.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.farmerId = values.farmer_id;
    values.ureaKg = values.urea_kg;
    values.imageUrl = values.image_url;
    values.createdAt = values.created_at;
    values.updatedAt = values.updated_at;
    delete values.farmer_id;
    delete values.urea_kg;
    delete values.image_url;
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = Log;
