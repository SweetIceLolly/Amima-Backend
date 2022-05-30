const mongoose = require('mongoose');

const loggingSchema = new mongoose.Schema ({
    IP: {
        type: String
    },
    reqURL: {
        type: String
    },
    rBody: {
        type: String
    },
    responseCode: {
        type: Number
    },
    responseContent: {
        type: String
    },
    userAgent: {
        type: String
    },
    timeStamp: {
        type: Date,
        default: Date.now
    }
});


const Log = mongoose.model('Log', loggingSchema);
module.exports = Log;

