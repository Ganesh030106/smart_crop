
const { Sequelize } = require('sequelize');

const IS_PROD = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    // Only enable SSL in production (Neon, Render, etc.)
    ...(IS_PROD && {
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: true,
            },
        },
    }),
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

module.exports = { sequelize };
