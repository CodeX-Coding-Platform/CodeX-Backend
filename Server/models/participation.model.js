// MONGOOSE SCHEMA

const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var participationSchema = new Schema({
    participationId: String,
    username: String,
    branch: String,
    contestId: String,
    participationTime: String,
    submissionResults: Object,
    validTill: String,
    questionsList: Array,
    endContest: {
        type: Number,
        default: 0,
    },
    // mcq
    mcqResponses : Object,
    mcqSubjectScore : Object,
    mcqTopicScore : Object,
    mcqTotalScore : Number
});

module.exports = mongoose.model("Participation", participationSchema)

