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

var testcasesFilter = { questionHiddenInput1: 0, questionHiddenInput2: 0, questionHiddenInput3: 0, questionHiddenOutput1: 0, questionHiddenOutput2: 0, questionHiddenOutput3: 0 }

// const Base64 = require('js-base64').Base64;
// Create and Save a new question
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.questionId) {
    return responseUtil.sendResponse(res, false, null, "QuestionId can not be empty", 400);
  }
  if (!req.body.questionName) {
    return responseUtil.sendResponse(res, false, null, "Question name can not be empty", 400);
  }
  try {
    const counter = await Counter.findOne();
    const questionId = questionCode + (Number(counter.questionCount) + 1).toString();
    counter.questionCount = Number(counter.questionCount) + 1;
    const updatedCounter = await counter.save();
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
      company: req.body.company.split(","),
      topic: req.body.topic.split(","),
    });

    // Save Question in the database
    const newQuestion = await question.save();
    return responseUtil.sendResponse(res, true, newQuestion, "Question created successfully with questionId " + questionId, 201);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Some error occurred while saving question to db", 500);
  }
  // Create a Question
};

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
    const questions = await questionUtil.getAllQuestions(testcasesFilter);
    return responseUtil.sendResponse(res, true, questions, "Questions retrieved successfully", 200);
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while fetching all Questions", 500);
  }
};

// Find a single question with a questionId
exports.findOneQuestion = async (req, res) => {
  try {
    if(!req.query.questionId) {
      return responseUtil.sendResponse(res, false, null, "questionId is not provided", 400); 
    }
    const question = await questionUtil.getOneQuestion(req.params.questionId, testcasesFilter);
    return responseUtil.sendResponse(res, true, question, "Question retrieved successfully", 200); 
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while fetching all Questions", 500);
  }
};

// Update a question identified by the questionId in the request
exports.updateQuestion = async (req, res) => {
  if (!req.params.questionId) {
    return responseUtil.sendResponse(res, false, null, "QuestionId cannot be empty", 400);
  }
  try {
    const updatedQuestion = await questionUtil.updateQuestion(req.params.questionId, req.body);
    return responseUtil.sendResponse(res, true, updatedQuestion, "Question updated successfully", 200); 
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while updating Question with questionId "+req.body.questionId, 500);
  }
};

// Delete a question with the specified questionId in the request
exports.deleteQuestion = async (req, res) => {
  if (!req.params.questionId) {
    return responseUtil.sendResponse(res, false, null, "QuestionId cannot be empty", 400);
  }
  try {
    const deletedQuestion = await questionUtil.deleteQuestion(req.params.questionId);
    return responseUtil.sendResponse(res, true, deletedQuestion, "Question deleted successfully", 200); 
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Error while deleting Question with questionId "+req.params.questionId, 500);
  }
};

// Delete questions with the specified questionIds in the request
exports.deleteMultiple = (req, res) => {
  if (!req.params.questionIds) {
    return responseUtil.sendResponse(res, false, null, "QuestionIds cannot be empty", 400);
  }
  try {
    var questionIds = req.params.questionIds.split(",").filter((item) => !item.includes("-")).map((item) => item.trim());
    const deletedQuestions = questionUtil.deleteMultipleQuestions(questionIds);
    return responseUtil.sendResponse(res, true, deletedQuestions, "Questions deleted successfully", 200); 
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, error.message, 500);
  }
};

// Gets all questions of a specific contest and creates/ fetches participation
exports.getAllQuestionsRelatedToContest = async (req, res) => {
  if (!req.params.contestId) {
    return responseUtil.sendResponse(res, false, null, "ContestId cannot be empty", 400);
  }
  try {
    const contest = await contestUtil.getOneContest(req.params.contestId);
    if(!contest) {
      return responseUtil.sendResponse(res, false, null, "Contestcould not fetched due with contestId "+req.params.contestId, 400);
    }
    try {
      const participationId = req.body.username.toLowerCase() + req.params.contestId;
      var participationData = {
        username: req.body.username.toLowerCase(),
        branch: req.body.branch,
        contestId: req.params.contestId,
        questionsList : []
      };
      const participation = await participationUtil.getOneParticipation(participationId);
      var questionsList = [];
      if(participation !== null) {
        questionsList = participation.questionsList;
      } else {
        if (contest.isManual) {
          if(contest.questionsList.length === 0) {
            return responseUtil.sendResponse(res, false, null, "Contest with contestId "+req.params.contestId+" does not consist of any questions (Manual Type)", 400);
          }
          participationData.questionsList = contest.questionsList;
        } else if(contest.isMultipleSet) {
          if(contest.sets.length === 0) {
            return responseUtil.sendResponse(res, false, null, "Contest with contestId "+req.params.contestId+" does not consist of any questions (MultipleSet Type)", 400);
          }
          const sets = contest.sets;
          for (var index in sets) {
            const randomIndex = Math.floor(Math.random() * (sets[index].length));
            participationData.questionsList.push(sets[index][randomIndex]);
          }
        }
      }
      try {
        const newParticipation = await participationUtil.createParticipation(participationId, participationData);
        try {
          const questions = await questionUtil.getMultipleQuestions(participationData.questionsList, testcasesFilter);
          return responseUtil.sendResponse(res, true, {newParticipation, questions}, "Questions and Participation fecthed successfully ", 200);
        } catch(error) {
          return responseUtil.sendResponse(res, false, null , error.message, 500);
        }
      } catch(error) {
        return responseUtil.sendResponse(res, false, null , error.message, 500);
      }
    } catch(error) {
      return responseUtil.sendResponse(res, false, null , error.message, 500);
    }
  } catch (error) {
    return responseUtil.sendResponse(res, false, null , error.message, 500);
  }
}

exports.findContestQuestions = async (req, res) => {
  try {
    const contest = await Contest.findOne({ contestId: req.params.contestId });
    if (contest.multiSet === true) {
      let sets = contest.sets;
      const questionIds = new Set();
      sets.forEach((sublist) => {
        sublist.forEach((id) => {
          questionIds.add(id);
        });
      });
      const questionIdArray = Array.from(questionIds);
      try {
        const questions = await Question.find(
          { questionId: { $in: questionIdArray } },
          { questionId: 1, questionName: 1, _id: 0 }
        );
        return res.status(200).send(questions);
      } catch (err) {
        return res.status(500).send({
          success: false,
          message:
            "Error retrieving questions from questionIdArray" +
            questionIdArray.toString(),
        });
      }
    } else {
      try {
        const questions = await Question.find({
          contestId: req.params.contestId,
        });
        return res.status(200).send(questions);
      } catch (err) {
        return res.status(500).send({
          success: false,
          message:
            "Error retrieving questions from questionIdArray" +
            questionIdArray.toString(),
        });
      }
    }
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Error retrieving contest with id " + req.params.contestId,
    });
  }
};