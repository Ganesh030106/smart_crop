const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanningSession = sequelize.define('PlanningSession', {
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
    land_size: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    soil_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ph: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    organic_matter: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    water_source: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    season: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    rainfall: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    temp_min: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    temp_max: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    region: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    imd_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    soil_image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    top_crop: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'planning_sessions',
    timestamps: true,
    underscored: true,
});

PlanningSession.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.farmerId = values.farmer_id;
    values.landSize = values.land_size;
    values.soilType = values.soil_type;
    values.organicMatter = values.organic_matter;
    values.waterSource = values.water_source;
    values.tempMin = values.temp_min;
    values.tempMax = values.temp_max;
    values.imdNote = values.imd_note;
    values.soilImageUrl = values.soil_image_url;
    values.topCrop = values.top_crop;
    values.createdAt = values.created_at;
    values.updatedAt = values.updated_at;
    delete values.farmer_id;
    delete values.land_size;
    delete values.soil_type;
    delete values.organic_matter;
    delete values.water_source;
    delete values.temp_min;
    delete values.temp_max;
    delete values.imd_note;
    delete values.soil_image_url;
    delete values.top_crop;
    delete values.created_at;
    delete values.updated_at;
    return values;
};

module.exports = PlanningSession;
