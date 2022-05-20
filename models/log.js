const mongoose = require('mongoose');

const loggingSchema = mongoose.Schema ({
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


const log = mongoose.model('log', loggingSchema);
module.exports = log;

