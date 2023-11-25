const Question = require("../models/question.model.js");
const Contest = require("../models/contest.model.js");
const Counter = require("../models/counter.model.js");
const Participation = require("../models/participation.model.js");

const xlsx = require("xlsx");

const questionUtil = require("../services/questionUtil.js");
const participationUtil = require("../services/participationUtil.js");
const contestUtil = require("../services/contestUtil.js");
const responseUtil = require("../services/responseUtil.js");

const dotenv = require("dotenv");
dotenv.config({ path: "../util/config.env" });

var questionCode = process.env.questionCode
var mcqCode = process.env.mcqCode

// const Base64 = require('js-base64').Base64;
// Create and Save a new question
exports.create = async (req, res) => {
  // Validate request
  if (req.body.questionName === undefined) {
    return responseUtil.sendResponse(res, false, null, "Question name can not be empty", 400);
  }
  try {
    const counter = await Counter.findOne();
    const questionId = req.body.isMcq ? mcqCode + (Number(counter.mcqCount) + 1).toString() : questionCode + (Number(counter.questionCount) + 1).toString();
    const question = new Question({
      questionId: questionId,
      questionName: req.body.questionName,
      questionDescriptionText: req.body.questionDescriptionText,
      questionInputText: req.body.questionInputText,
      questionOutputText: req.body.questionOutputText,
      questionExampleInput1: req.body.questionExampleInput1,
      questionExampleOutput1: req.body.questionExampleOutput1,
      questionExampleInput2: req.body.questionExampleInput2,
      questionExampleOutput2: req.body.questionExampleOutput2,
      questionExampleInput3: req.body.questionExampleInput3,
      questionExampleOutput3: req.body.questionExampleOutput3,
      questionHiddenInput1: req.body.questionHiddenInput1,
      questionHiddenInput2: req.body.questionHiddenInput2,
      questionHiddenInput3: req.body.questionHiddenInput3,
      questionHiddenOutput1: req.body.questionHiddenOutput1,
      questionHiddenOutput2: req.body.questionHiddenOutput2,
      questionHiddenOutput3: req.body.questionHiddenOutput3,
      questionExplanation: req.body.questionExplanation,
      author: req.body.author,
      editorial: req.body.editorial,
      difficulty: req.body.difficulty,
      company: req.body.company,
      topic: req.body.topic,
      //mcq attributes
      isMcq: req.body.isMcq,
      options: req.body.options,
      correctOption: req.body.correctOption,
      mcqImage: req.body.mcqImage,
      mcqTopic: req.body.mcqTopic,
      mcqSubject: req.body.mcqSubject
    });
    // Save Question in the database
    const newQuestion = await question.save();
    req.body.isMcq ? counter.mcqCount = Number(counter.mcqCount) + 1 : counter.questionCount = Number(counter.questionCount) + 1;
    const updatedCounter = await counter.save();
    //only for mcq
    if (req.body.isMcq === true) {
      const updatedCounterAndTag = await questionUtil.updateTagAndCounter(req.body);
    }
    return responseUtil.sendResponse(res, true, newQuestion, "Question(s) created successfully", 201);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Some error occurred while saving question to db", 500);
  }
  // Create a Question
};

exports.createMcqQuestion = async (req, res) => {
  var questions = [];
  for (var i = 0; i < req.body.length; i++) {
    try {
      const counter = await Counter.findOne();
      const questionId = req.body[i].isMcq ? mcqCode + (Number(counter.mcqCount) + 1).toString() : questionCode + (Number(counter.questionCount) + 1).toString();
      const question = new Question({
        questionId: questionId,
        questionName: req.body[i].questionName,
        questionDescriptionText: req.body[i].questionDescriptionText,
        questionInputText: req.body[i].questionInputText,
        questionOutputText: req.body[i].questionOutputText,
        questionExampleInput1: req.body[i].questionExampleInput1,
        questionExampleOutput1: req.body[i].questionExampleOutput1,
        questionExampleInput2: req.body[i].questionExampleInput2,
        questionExampleOutput2: req.body[i].questionExampleOutput2,
        questionExampleInput3: req.body[i].questionExampleInput3,
        questionExampleOutput3: req.body[i].questionExampleOutput3,
        questionHiddenInput1: req.body[i].questionHiddenInput1,
        questionHiddenInput2: req.body[i].questionHiddenInput2,
        questionHiddenInput3: req.body[i].questionHiddenInput3,
        questionHiddenOutput1: req.body[i].questionHiddenOutput1,
        questionHiddenOutput2: req.body[i].questionHiddenOutput2,
        questionHiddenOutput3: req.body[i].questionHiddenOutput3,
        questionExplanation: req.body[i].questionExplanation,
        author: req.body[i].author,
        editorial: req.body[i].editorial,
        difficulty: req.body[i].difficulty,
        company: req.body[i].company,
        topic: req.body[i].topic,
        //mcq attributes
        isMcq: req.body[i].isMcq,
        options: req.body[i].options,
        correctOption: req.body[i].correctOption,
        mcqImage: req.body[i].mcqImage,
        mcqTopic: req.body[i].mcqTopic,
        mcqSubject: req.body[i].mcqSubject
      });
      // Save Question in the database
      const newQuestion = await question.save();
      req.body[i].isMcq ? counter.mcqCount = Number(counter.mcqCount) + 1 : counter.questionCount = Number(counter.questionCount) + 1;
      const updatedCounter = await counter.save();
      //only for mcq
      if (req.body[i].isMcq === true) {
        const updatedCounterAndTag = await questionUtil.updateTagAndCounter(req.body[i]);
      }
      questions.push(newQuestion);
    } catch (error) {
      return responseUtil.sendResponse(res, false, null, "Some error occurred while saving question to db", 500);
    }
  }
  return responseUtil.sendResponse(res, true, questions, "Question(s) created successfully", 201);
}

exports.createExcel = (req, res) => {
  if (req.files.upfile) {
    var file = req.files.upfile,
      name = file.name,
      type = file.mimetype;
    var uploadpath = "../quesxlsx" + name;
    file.mv(uploadpath, function (err) {
      if (err) {
        res.send("Error occurred!");
      } else {
        let wb = xlsx.readFile("../quesxlsx" + name);
        let ws = wb.Sheets["Sheet1"];
        let data = xlsx.utils.sheet_to_json(ws);
        let question;
        Question.find()
          .then((questions) => {
            let currQuestions = questions.length;
            for (let i = 0; i < data.length; i++) {
              question = new Question({
                questionId: "KLHCode" + (currQuestions + (i + 1)).toString(),
                questionName: data[i].questionName,
                contestId: data[i].contestId,
                questionDescriptionText: data[i].questionDescriptionText,
                questionInputText: data[i].questionInputText,
                questionOutputText: data[i].questionOutputText,
                questionExampleInput1: data[i].questionExampleInput1,
                questionExampleOutput1: data[i].questionExampleOutput1,
                questionExampleInput2: data[i].questionExampleInput2,
                questionExampleOutput2: data[i].questionExampleOutput2,
                questionExampleInput3: data[i].questionExampleInput3,
                questionExampleOutput3: data[i].questionExampleOutput3,
                questionHiddenInput1: data[i].questionHiddenInput1,
                questionHiddenInput2: data[i].questionHiddenInput2,
                questionHiddenInput3: data[i].questionHiddenInput3,
                questionHiddenOutput1: data[i].questionHiddenOutput1,
                questionHiddenOutput2: data[i].questionHiddenOutput2,
                questionHiddenOutput3: data[i].questionHiddenOutput3,
                questionExplanation: data[i].questionExplanation,
                author: data[i].author,
                editorial: data[i].editorial,
                difficulty: data[i].level,
                company: data[i].company,
                topic: data[i].topic,
              });
              question.save();
            }
            res.send({
              success: true,
              message: "Done! Uploaded files",
            });
          })
          .catch((err) => {
            res.status(500).send({
              success: false,
              message:
                err.message ||
                "Some error occurred while retrieving questions.",
            });
          });
      }
    });
  } else {
    res.send({
      success: false,
      message: "No File selected !",
    });
    res.end();
  }
};

// Retrieve and return all questions from the database.
exports.getAllQuestions = async (req, res) => {
  try {
    const filters = (req.query.queryString !== undefined) ? req.query.queryString.split(",") : [];
    const questions = await questionUtil.getAllQuestions(questionUtil.decodeFilters(filters),req.params.isMcq === "mcq");
    return responseUtil.sendResponse(res, true, questions, "Questions retrieved successfully", 200);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while fetching all Questions", 500);
  }
};

// Find a single question with a questionId
exports.findOneQuestion = async (req, res) => {
  try {
    if (req.params.questionId === undefined) {
      return responseUtil.sendResponse(res, false, null, "questionId is not provided", 400);
    }
    const question = await questionUtil.getOneQuestion(req.params.questionId, (req.isAdmin) ? {} : questionUtil.decodeFilters(filters));
    return responseUtil.sendResponse(res, true, question, "Question retrieved successfully", 200);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while fetching all Questions", 500);
  }
};

// Update a question identified by the questionId in the request
exports.updateQuestion = async (req, res) => {
  if (req.params.questionId === undefined) {
    return responseUtil.sendResponse(res, false, null, "QuestionId cannot be empty", 400);
  }
  try {
    const updatedQuestion = await questionUtil.updateQuestion(req.params.questionId, req.body);
    return responseUtil.sendResponse(res, true, updatedQuestion, "Question updated successfully", 200);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while updating Question with questionId " + req.body.questionId, 500);
  }
};

// Delete a question with the specified questionId in the request
exports.deleteQuestion = async (req, res) => {
  if (req.params.questionId === undefined) {
    return responseUtil.sendResponse(res, false, null, "QuestionId cannot be empty", 400);
  }
  try {
    const deletedQuestion = await questionUtil.deleteQuestion(req.params.questionId);
    return responseUtil.sendResponse(res, true, deletedQuestion, "Question deleted successfully", 200);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while deleting Question with questionId " + req.params.questionId, 500);
  }
};

// Delete questions with the specified questionIds in the request
exports.deleteMultiple = async (req, res) => {
  if (req.body.questionIds === undefined) {
    return responseUtil.sendResponse(res, false, null, "QuestionIds cannot be empty", 400);
  }
  try {
    const deletedQuestions = await questionUtil.deleteMultipleQuestions(req.body.questionIds);
    return responseUtil.sendResponse(res, true, deletedQuestions, "Questions deleted successfully", 200);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, error.message, 500);
  }
};

const getQuestions = async (contest) => {
  var questionsList = [];
  if (contest.isManual) {
    if (contest.questionsList.length === 0) {
      return Promise.reject(new Error("Contest does not have any questions (Manual Contest)"));
    }
    questionsList = contest.questionsList;
  } else if (contest.isMultipleSet) {
    if (contest.sets.length === 0) {
      return Promise.reject(new Error("Contest does not have any sets (Multiple Set Contest)"));
    }
    const sets = contest.sets;
    for (var index in sets) {
      const randomIndex = Math.floor(Math.random() * (sets[index].length));
      questionsList.push(sets[index][randomIndex]);
    }
  }
  return questionsList;
}

// Gets all questions of a specific contest and creates/ fetches participation
exports.getAllQuestionsRelatedToContest = async (req, res) => {
  if (req.params.contestId === undefined) {
    return responseUtil.sendResponse(res, false, null, "ContestId cannot be empty", 400);
  }
  try {
    const contest = await contestUtil.getOneContest(req.params.contestId);
    if (!contest) {
      return responseUtil.sendResponse(res, false, null, "Contest could not fetched due with contestId " + req.params.contestId, 400);
    }
    const participationId = req.body.username.toLowerCase() + req.params.contestId;
    if(contest.isMcqContest === true) {
      var participationData = {
        username: req.body.username.toLowerCase(),
        branch: req.body.branch,
        contestId: req.params.contestId,
      };
      const participation = await participationUtil.createParticipation(participationId, participationData);
      const questions = await questionUtil.getMultipleQuestions(contest.questionsList, questionUtil.decodeFilters(req.filters));
      return responseUtil.sendResponse(res, true, { participation, questions }, "Questions and Participation fetched successfully ", 200);
    } else {
      var participationData = {
        username: req.body.username.toLowerCase(),
        branch: req.body.branch,
        contestId: req.params.contestId,
        questionsList: [],
        submissionResults: {}
      };
      const exisitingParticipation = await participationUtil.getOneParticipation(participationId);
      var questionsList = [];
      if (exisitingParticipation !== null) {
        questionsList = exisitingParticipation.questionsList;
      } else {
        questionsList = await getQuestions(contest);
      }
      participationData.questionsList = questionsList;
      //participation is only created if a record does not exist with given participationId
      const participation = await participationUtil.createParticipation(participationId, participationData);
      const questions = await questionUtil.getMultipleQuestions(participation.questionsList, questionUtil.decodeFilters(req.filters));
      return responseUtil.sendResponse(res, true, { participation, questions }, "Questions and Participation fetched successfully ", 200);
    }
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, error.message, 500);
  }
}
