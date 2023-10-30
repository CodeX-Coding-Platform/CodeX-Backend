// MONGOOSE SCHEMA

const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var participationSchema = new Schema({
    participationId: String,
    username: String,
    branch: String,
    contestId: String,
    participationTime: String,
    submissionResults: Array,
    validTill: String,
    questions: Array,
    endContest: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model("Participation", participationSchema)

