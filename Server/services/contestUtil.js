const Contest = require("../models/contest.model.js");

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
        contest.date === today &&
        contest.startTime < currentTime &&
        contest.endTime > currentTime
    ) {
        return true;
    }

    return false;
};

module.exports = {
    isContestActive,
    updateContest,
    deleteContest
}