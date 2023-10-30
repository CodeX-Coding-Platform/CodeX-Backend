const Question = require("../models/question.model.js");


const isValidQuestionIds = async (questionIds) => {
    if (questionIds.length === 0) {
        return false;
    }
    const count = await Question.countDocuments({ questionId: { $in: questionIds } });
    return count === questionIds.length;
}

module.exports = {
    isValidQuestionIds
}