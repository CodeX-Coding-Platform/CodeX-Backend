const Participation = require("../models/participation.model.js");

const contestUtil = require("./contestUtil.js");

const moment = require("moment-timezone");

const getOneParticipation = async (participationId) => {
    try {
        const participation = await Participation.findOne({ participationId: participationId });
        return participation;
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


module.exports = {
    getOneParticipation,
    createParticipation
}