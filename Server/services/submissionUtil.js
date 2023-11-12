const Submission = require("../models/submission.model.js");
var moment = require("moment");


const createSubmission = async (data) => {
    // Create a Submission
    const submission = new Submission({
        questionId: data.questionId,
        username: data.username,
        languageId: data.languageId,
        sourceCode: data.sourceCode,
        score: data.score,
        submissionTokens: data.submissionTokens,
        submissionTime: moment(),
        participationId: data.participationId
    });
    try {
        const newSubmission = await submission.save();
        return newSubmission;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }

}


module.exports = {
    createSubmission
}