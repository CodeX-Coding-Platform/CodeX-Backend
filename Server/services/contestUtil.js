const Contest = require("../models/contest.model.js");

const moment = require("moment-timezone");

const getOneContest = async(contestId) => {
    try {
        const contest = await Contest.findOne({contestId: contestId});
        return contest;
    } catch(error) {
        return Promise.reject(new Error(err.message));
    }
}

const getAllContests = async(isMcq) => {
    try {
        const contests = await Contest.find((isMcq) ? {isMcqContest : true} : {isMcqContest : false});
        return contests;
    } catch(error) {
        return Promise.reject(new Error(err.message));
    }
}

const updateContest =  async(contestId, contestUpdates) => {

    if (contestUpdates.contestId) {
        return Promise.reject(new Error("contestId cannot be updated"));
    }
    try {
        const updatedContest = await Contest.findOneAndUpdate(
            { contestId: contestId },
            { $set: contestUpdates },
            { new: true }
        );
        return updatedContest;
    } catch(err) {
        return Promise.reject(new Error(err.message));
    }
}

const deleteContest = async(contestId) => {
    try {
        const deletedContest = await Contest.deleteOne({contestId: contestId});
        if(deletedContest.deletedCount === 0) {
            return Promise.reject(new Error("Contest not found with given contestId "+contestId));
        }
        return deletedContest;
    } catch(err) {
        return Promise.reject(new Error(err.message));
    }
}


const isContestActive = async (contest) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const currentTime = moment().tz("Asia/Kolkata").format("HHmm");

    if (
        contest &&
        contest.contestDate === today &&
        contest.contestStartTime < currentTime &&
        contest.contestEndTime > currentTime
    ) {
        return true;
    }

    return false;
};

module.exports = {
    isContestActive,
    updateContest,
    deleteContest,
    getAllContests,
    getOneContest
}