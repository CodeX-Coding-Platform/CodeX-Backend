const Question = require("../models/question.model.js");
const Tag = require("../models/tag.model.js");
const Counter = require("../models/counter.model.js");

const tagUtil = require("./tagUtil");
const counterUtil = require("./counterUtil");

const getOneQuestion = async (questionId, filters) => {
    try {
        const question = await Question.findOne({ questionId: questionId }, filters);
        return question;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const getQuestions = async(conditions, filters, limit) => {
    try {
        const question = await Question.find(conditions, filters).limit(limit);
        return question;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const getMultipleQuestions = async (questionIds, filters) => {
    try {
        const question = await Question.find({ questionId: { $in: questionIds } }, filters);
        return question;
    } catch (error) {
        return Promise.reject(new Error(err.message));
    }
}

const getAllQuestions = async (filters, isMcq) => {
    try {
        const questions = await Question.find((isMcq) ? {isMcq : true} : {}, filters);
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
            return Promise.reject(new Error("No Question with the given questionId " + questionId));
        }

        const testcases = {
            questionId: question.questionId,
            HI1: question.questionHiddenInput1,
            HI2: question.questionHiddenInput2,
            HI3: question.questionHiddenInput3,
            HO1: question.questionHiddenOutput1,
            HO2: question.questionHiddenOutput2,
            HO3: question.questionHiddenOutput3,
        };

        return testcases;
    } catch (err) {
        if (err.kind === "ObjectId") {
            throw new Error("Couldn't find question, caught exception");
        }
        throw new Error("Error retrieving data");
    }
};

const decodeFilters = (filters) => {
    var questionFilters = {};
    for (var filter in filters) {
        questionFilters[filters[filter]] = 1;
    }
    return questionFilters;
}

const updateTagAndCounter = async (data) => {
    const tags = await Tag.findOne({});
    const counter = await Counter.findOne({});
    var mcqSubject = data.mcqSubject;
    var mcqTopic = data.mcqTopic;
    var updatedTags = null;
    var updatedCounter = null;
    if (tags.mcqSubjects === undefined || !tags.mcqSubjects.hasOwnProperty(mcqSubject)) {
        var newSubjectTag = {
            [mcqSubject] : [mcqTopic]
        }
        tags.mcqSubjects = {
            ...tags.mcqSubjects,
            ...newSubjectTag,
        };
        const newCounter = {
            [mcqSubject]: {
                [mcqTopic]: [data.difficulty === "Easy" ? 1 : 0, data.difficulty === "Medium" ? 1 : 0, data.difficulty === "Hard" ? 1 : 0]
            },
        }
        counter.subjectCount = {
            ...counter.subjectCount,
            ...newCounter,
        };
        updatedTags = await tags.save();
        updatedCounter = await counter.save();
    } else {
        if (!tags.mcqSubjects[mcqSubject].includes(mcqTopic)) {
            const mcqSubjects = tags.mcqSubjects;
            mcqSubjects[mcqSubject].push(mcqTopic);
            updatedTags = await tagUtil.pushTopic(mcqSubjects);
            const subjectCount = counter.subjectCount;
            subjectCount[mcqSubject][mcqTopic] = [data.difficulty === "Easy" ? 1 : 0, data.difficulty === "Medium" ? 1 : 0, data.difficulty === "Hard" ? 1 : 0];
            updatedCounter = await counterUtil.pushTopic(subjectCount);
        } else {
            const incrementIndex = data.difficulty === "Easy" ? 0 : data.difficulty === "Medium" ? 1 : data.difficulty === "Hard" ? 2 : -1;
            const subjectCount = counter.subjectCount;
            subjectCount[mcqSubject][mcqTopic][incrementIndex]+=1;
            updatedCounter = await counterUtil.pushTopic(subjectCount);
        }
        updatedCounter = await counter.save();
    }
    return { updatedTags, updatedCounter };
}

const getCorrectOptionsTopicsAndSubjectsMap = async (questionsList) => {
    try {
        const questions = await getMultipleQuestions(questionsList);
        var questionIdToCorrectOptionMap = new Map();
        var questionIdToTopic = new Map();
        var questionIdToSubject = new Map();
        for (let i = 0; i < questions.length; i++) {
            questionIdToCorrectOptionMap.set(questions[i].questionId, questions[i].correctOption);
            questionIdToTopic.set(questions[i].questionId, questions[i].mcqTopic);
            questionIdToSubject.set(questions[i].questionId, questions[i].mcqSubject);
        }

        return {questionIdToCorrectOptionMap, questionIdToTopic, questionIdToSubject};

    } catch (err) {
        if (err.kind === "ObjectId") {
            throw new Error("Couldn't find question, caught exception");
        }
        throw new Error("Error retrieving data");
    }
}

module.exports = {
    isValidQuestionIds,
    deleteQuestion,
    updateQuestion,
    getAllQuestions,
    getOneQuestion,
    getQuestions,
    getMultipleQuestions,
    getQuestionTestCases,
    deleteMultipleQuestions,
    decodeFilters,
    updateTagAndCounter,
    getCorrectOptionsTopicsAndSubjectsMap
}