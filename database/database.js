const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const options = {
    dbName: process.env.DB_NAME
};
const Database = {
    connect: async function() {
        try {
            await mongoose.connect(process.env.DB_URI, options);
            console.log('Database is connected');
        } catch(err) {
            console.log(err);
        }        
    }
}

module.exports = Database;