// Load envioronment variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};
const mongoose = require('mongoose');

// Connect to DB
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'diabetes-at-home'
});

// connect-mongo
const mongooseClient = mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    dbName: 'diabetes-at-home' 
}).then((m) => m.connection.getClient())

// Exit on error
const db = mongoose.connection.on('error', err => {
    console.error(err);
    process.exit(1);
});
// Log to console once the database is open
db.once('open', async () => {
    console.log(`Mongo connection started on ${db.host}:${db.port}`);
});

require('./patient')
require('./clinician')

module.exports = mongooseClient