const Participation = require("../models/participation.model.js");

const getOneParticipation = async(participationId) => {
    try {
        const participation = await Participation.findOne({participationId: participationId});
        return participation;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}


module.exports = {
    getOneParticipation
}