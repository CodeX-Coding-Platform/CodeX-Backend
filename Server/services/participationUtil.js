const Participation = require("../models/participation.model.js");

const contestUtil = require("./contestUtil.js");
const submissionUtil = require("./submissionUtil.js");

const moment = require("moment-timezone");

const getOneParticipation = async (participationId) => {
    try {
        const participation = await Participation.findOne({ participationId: participationId });
        return participation;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const getAllParticipations = async () => {
    try {
        const participations = await Participation.find({});
        return participations;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const createParticipation = async (participationId, data) => {
    if (!data.username) {
        return Promise.reject(new Error("username not provided"));
    }
    if (!data.branch && data.username !== "admin") {
        return Promise.reject(new Error("branch not provided"));
    }
    if (!data.contestId) {
        return Promise.reject(new Error("contestId not provided"));
    }
    const existingParticipation = await Participation.findOne({ participationId });
    if (existingParticipation !== null) {
        return existingParticipation;
    }
    // If it does not exist, create a new one.
    let contest = await contestUtil.getOneContest(data.contestId);
    if (!contest) {
        return Promise.reject(new Error("contestId does not exist with the given id "+data.contestId));
    }

    let date = moment();
    let duration = contest.contestDuration;
    let endTime = moment(date, "HH:mm:ss").add(duration, "minutes");

    // Create a Participation
    const participation = new Participation({
        participationId: participationId,
        username: data.username,
        branch: data.branch,
        contestId: data.contestId,
        participationTime: date,
        submissionResults: [],
        validTill: endTime,
        questionsList : data.questionsList
    });
    try {
        const newParticipation = await participation.save();
        return newParticipation;
    } catch (error) {
        return Promise.reject(new Error("Failed to Create Participation with participationId "+participationId));
    }
}

const updateParticipation = async(participationId, data) => {
    if (data.participationId) {
        return Promise.reject(new Error("questionId cannot be updated"));
    }

    try {
        const updatedParticipation = await Participation.findOneAndUpdate(
            { participationId: participationId },
            { $set: data },
            { new: true }
        );
        return updatedParticipation;
    } catch (err) {
        return Promise.reject(new Error(err.message));
    }

}

const modifyScore = async(data) => {
    try {
        const participation = await getOneParticipation(data.participationId);
        if(participation === null) {
            return Promise.reject(new Error("Participation does not exist with participationId "+data.participationId));
        }
        //update participation with latest score if score is greater than previous
        var submissionResults = participation.submissionResults;
        const updatedParticipation = null;
        if(Number(submissionResults[data.questionId]) <= Number(data.score) ) {
            submissionResults[data.questionId] = data.score;
            updatedParticipation = await updateParticipation(data.participationId, submissionResults);
        }
        const submission = await submissionUtil.createSubmission(data);
        return (updatedParticipation !== null) ? updatedParticipation : participation;
    } catch(error) {
        return Promise.reject(new Error(err.message));
    }
}

const isValidParticipationTime = async(participationId) => {
    try {
        const participation = await getOneParticipation(participationId);
        if(!participation) {
            return Promise.reject(new Error("Participation does not exist with participationId "+data.participationId));
        }
        const momentDate = moment();
        const validTime = participation.validTill;
        return (momentDate.isBefore(validTime));
    } catch(error) {
        return Promise.reject(new Error(err.message));
    }
}


module.exports = {
    getOneParticipation,
    getAllParticipations,
    createParticipation,
    modifyScore,
    isValidParticipationTime
}