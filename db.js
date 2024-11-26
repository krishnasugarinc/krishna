const config = require('../config.json'); // Ensure correct path to config.json
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = { frameworkquery };

initialize();

async function initialize() {
    // Destructure the database configuration from config.json
    const { host, port, user, password, database } = config.database;

    // Create the database if it doesn't exist
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    connection.end(); // Close the connection after the query

    // Connect to the database using Sequelize
    const sequelize = new Sequelize(database, user, password, {
        host,
        port,
        dialect: 'mysql',
        logging: console.log, // Enables SQL query logging
    });

    // Check if the connection was successful
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        return;
    }

    // Initialize models and add them to the exported db object
    db.Account = require('../_framework_modules/accounts/account.model')(sequelize);
    db.RefreshToken = require('../_framework_modules/accounts/refresh-token.model')(sequelize);

    // Define relationships between models
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    // Sync models with the database (creates tables if they don't exist)
    await sequelize.sync();
}

// New connection function and Raw Query Execution
async function frameworkquery(sql, params) {
    const connection = await mysql.createConnection(config.database);
    const [results] = await connection.execute(sql, params);
    connection.end(); // Close the connection after execution
    return results;
}
