const Question = require("../models/question.model.js");

const getOneQuestion = async (questionId, filters) => {
    try {
        const question = await Question.findOne({ questionId: questionId }, filters);
        return question;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const getMultipleQuestions = async(questionIds, filters) => {
    try {
        const question = await Question.find({ questionId: {$in : questionIds} }, filters);
        return question;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const getAllQuestions = async (filters) => {
    try {
        const questions = await Question.find({}, filters);
        return questions;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const updateQuestion = async (questionId, questionUpdates) => {

    if (questionUpdates.questionId) {
        return Promise.reject(new Error("questionId cannot be updated"));
    }

    try {
        const updatedQuestion = await Question.findOneAndUpdate(
            { questionId: questionId },
            { $set: questionUpdates },
            { new: true }
        );
        return updatedQuestion;
    } catch (err) {
        return Promise.reject(new Error(err.message));
    }
}

const deleteQuestion = async (questionId) => {
    try {
        const deletedQuestion = await Question.deleteOne({ questionId: questionId });
        return deletedQuestion;
    } catch (err) {
        return Promise.reject(new Error(err.message));
    }
}

const deleteMultipleQuestions = async (questionIds) => {
    try {
        const deletedQuestions = await Question.deleteMany({ questionId: { $in: questionIds } });
        return deletedQuestions;
    } catch (err) {
        return Promise.reject(new Error(err.message));
    }
}

const isValidQuestionIds = async (questionIds) => {
    if (questionIds.length === 0) {
        return false;
    }
    const count = await Question.countDocuments({ questionId: { $in: questionIds } });
    return count === questionIds.length;
}

const getQuestionTestCases = async (questionId) => {
    try {
        const question = await getOneQuestion(questionId, {});

        if (!question) {
            return Promise.reject(new Error("No Question with the given questionId "+questionId));
        }

        const testcases = {
            contestId: question.contestId,
            HI1: question.questionHiddenInput1,
            HI2: question.questionHiddenInput2,
            HI3: question.questionHiddenInput3,
            HO1: question.questionHiddenOutput1,
            HO2: question.questionHiddenOutput2,
            HO3: question.questionHiddenOutput3,
            difficulty: question.difficulty,
            language: question.language,
            courseId: question.courseId,
        };

        return testcases;
    } catch (err) {
        if (err.kind === "ObjectId") {
            throw new Error("Couldn't find question, caught exception");
        }
        throw new Error("Error retrieving data");
    }
};

module.exports = {
    isValidQuestionIds,
    deleteQuestion,
    updateQuestion,
    getAllQuestions,
    getOneQuestion,
    getMultipleQuestions,
    getQuestionTestCases,
    deleteMultipleQuestions
}