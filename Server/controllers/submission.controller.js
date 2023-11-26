const Submission = require("../models/submission.model.js");
const Participation = require("../models/participation.model.js");
var moment = require("moment");

const contestUtil = require("../services/contestUtil.js");
const questionUtil = require("../services/questionUtil.js");
const judgeUtil = require("../services/judgeUtil.js");
const responseUtil = require("../services/responseUtil.js");
const submissionUtil = require("../services/submissionUtil.js");

const fs = require("fs");
const path = require("path");
// Create and Save a new submission
exports.create = async (req, result) => {
  try {
    // Validate request
    if (!result.submissionToken) {
      throw new Error("Submission token can not be empty");
    }

    if (!result.username) {
      throw new Error("Username can not be empty");
    }

    // Create a Submission
    const submission = new Submission({
      questionId: result.questionId,
      username: result.username,
      languageId: result.languageId,
      sourceCode: result.sourceCode,
      result: result.result,
      score: result.score,
      submissionToken: result.submissionToken,
      submissionTime: moment(),
      participationId: result.participationId,
      ipAddress: result.clientIp,
    });

    if (submission.score === 100) {
      submission.color = "#21BA45";
    } else if (submission.score < 100 && submission.score >= 25) {
      submission.color = "orange";
    } else {
      submission.color = "red";
    }

    // Save in the database
    const savedSubmission = await submission.save();
    return savedSubmission;
  } catch (err) {
    throw new Error("Error occurred while Submitting.");
  }
};

// Retrieve and return all submissions from the database.
exports.findAll = (req, res) => {
  Submission.find({ questionId: req.params.questionId })
    .then((submission) => {
      res.send(submission);
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message:
          err.message || "Some error occurred while retrieving submission.",
      });
    });
};

exports.findUser = (req, res) => {
  Submission.find({
    username: req.params.username,
    questionId: req.params.questionId,
  })
    .then((submission) => {
      res.send(submission);
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message:
          err.message || "Some error occurred while retrieving submission.",
      });
    });
};

exports.validateSubmission = async (req, res) => {
  //validations
  if (req.body.contestId === undefined) {
    return responseUtil.sendResponse(res, false, null, "ContestId cannot be empty", 400);
  }
  
  if (req.body.questionId === undefined) {
    return responseUtil.sendResponse(res, false, null, "QuestionId cannot be empty", 400);
  }

  if (req.body.username === undefined) {
    return responseUtil.sendResponse(res, false, null, "Username cannot be empty", 400);
  }
  
  if (req.body.sourceCode === undefined) {
    return responseUtil.sendResponse(res, false, null, "sourceCode cannot be empty", 400);
  }
  
  if (req.body.languageId === undefined) {
    return responseUtil.sendResponse(res, false, null, "languageId cannot be empty", 400);
  }

  try {
    //check if contest is active
    const contest = await contestUtil.getOneContest(req.body.contestId);
    const isContestActive = await contestUtil.isContestActive(contest);
    if(!isContestActive && !req.decoded.admin) {
      return responseUtil.sendResponse(res, false, null, "Contest is not active", 400);
    }
    // get the question testcases
    const testcases = await questionUtil.getQuestionTestCases(req.body.questionId);
    try {
      const judgeResponse = await judgeUtil.sendRequestsToJudge(testcases, req.body);
      return responseUtil.sendResponse(res, true, judgeResponse, "Submission validated successfully", 200);
    } catch(error) {
      return responseUtil.sendResponse(res, true, {
        "score" : 0,
        "message" : "Submission could not be validated"
      }, "Submission could not be validated", 200);
    }
  } catch(error) {
    return responseUtil.sendResponse(res, false, null, error.message, 400);
  }
}

exports.validateMCQSubmission = async(req, res) => {
  if (req.body.contestId === undefined) {
    return responseUtil.sendResponse(res, false, null, "ContestId cannot be empty", 400);
  }

  if (req.body.username === undefined) {
    return responseUtil.sendResponse(res, false, null, "Username cannot be empty", 400);
  }
  try {
    //check if contest is active
    const contest = await contestUtil.getOneContest(req.body.contestId);
    const isContestActive = await contestUtil.isContestActive(contest);
    if(!isContestActive && !req.decoded.admin) {
      return responseUtil.sendResponse(res, false, null, "Contest is not active", 400);
    }
    // get the correct options
    const responseMap = await questionUtil.getCorrectOptionsTopicsAndSubjectsMap(contest.questionsList);
    const participationId = req.body.username.toLowerCase() +  req.body.contestId;
    const participation = await Participation.findOne({participationId : participationId});
    const evaluateResponse = await submissionUtil.evaluateMCQResponse(participationId, req.body.responses, responseMap.questionIdToCorrectOptionMap, responseMap.questionIdToSubject, responseMap.questionIdToTopic, participation); 
    return responseUtil.sendResponse(res, true, evaluateResponse, "MCQ Submission validated successfully", 200);
  } catch(error) {
    return responseUtil.sendResponse(res, false, null, error.message, 400);
  }
}

exports.findProfileData = (req, res) => {
  Submission.find({ username: req.params.username })
    .then((submissions) => {
      let returnArray = [];
      submissions.forEach((submission) => {
        let data = {};
        data["languageId"] = submission.languageId;
        data["questionId"] = submission.questionId;
        data["submissionTime"] = submission.submissionTime;
        data["score"] = submission.score;
        returnArray.push(data);
      });
      res.send(returnArray);
    })
    .catch((err) => {
      res.send([]);
    });
};
