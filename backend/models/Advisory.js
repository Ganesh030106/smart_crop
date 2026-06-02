const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Advisory = sequelize.define('Advisory', {
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
    region: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    crop: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    advice: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'advisories',
    timestamps: true,
    underscored: true,
});

Advisory.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.farmerId = values.farmer_id;
    values.createdAt = values.created_at;
    values.updatedAt = values.updated_at;
    delete values.farmer_id;
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = Advisory;
