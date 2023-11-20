const Submission = require("../models/submission.model.js");
const Participation = require("../models/participation.model.js");
var moment = require("moment");

const createSubmission = async (data) => {
    // Create a Submission
    const submission = new Submission({
        submissionId : data.submissionId,
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
        return Promise.reject(new Error(error.message));
    }

}

const evaluateMCQResponse = async (participationId, responses, correctOptionsMap, questionIdToSubject, questionIdToTopic, participation) => {
    try {
        var mcqTopicScore = new Map();
        var mcqSubjectScore = new Map();
        var mcqTotalScore = 0;
        for(var i=0; i<responses.length; i++) {
            const correctOption = correctOptionsMap.get(responses[i].questionId);
            if(correctOption === responses[i].response) {
                const questionTopic = questionIdToTopic.get(responses[i].questionId);
                const questionSubject = questionIdToSubject.get(responses[i].questionId);
                (mcqTopicScore.has(questionTopic)) ? mcqTopicScore.set(questionTopic, mcqTopicScore.get(questionTopic) + 1) : mcqTopicScore.set(questionTopic, 1);
                (mcqSubjectScore.has(questionSubject)) ? mcqSubjectScore.set(questionSubject, mcqSubjectScore.get(questionSubject) + 1) : mcqSubjectScore.set(questionSubject, 1);
                mcqTotalScore += 1;
            }
        }
        const data = {mcqTopicScore, mcqSubjectScore, mcqTotalScore};
        const updatedParticipation = await Participation.findOneAndUpdate(
            { participationId: participationId },
            {
                $set: data
            },
            { new: true }
        );
        return updatedParticipation;
    } catch (error) {
        return Promise.reject(new Error(error.message));
    }
}


module.exports = {
    createSubmission,
    evaluateMCQResponse
}