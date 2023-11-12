const Submission = require("../models/submission.model.js");
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
  if (req.body.contestId === null) {
    return responseUtil.sendResponse(res, false, null, "ContestId cannot be empty", 400);
  }
  
  if (req.body.questionId === null) {
    return responseUtil.sendResponse(res, false, null, "QuestionId cannot be empty", 400);
  }

  if (req.body.username === null) {
    return responseUtil.sendResponse(res, false, null, "Username cannot be empty", 400);
  }
  
  if (req.body.sourceCode === null) {
    return responseUtil.sendResponse(res, false, null, "sourceCode cannot be empty", 400);
  }
  
  if (req.body.languageId === null) {
    return responseUtil.sendResponse(res, false, null, "languageId cannot be empty", 400);
  }

  try {
    //check if contest is active
    const contest = await contestUtil.getOneContest(req.body.contestId);
    const isContestActive = await contestUtil.isContestActive(contest);
    if(!isContestActive && !req.body.isAdmin) {
      return responseUtil.sendResponse(res, false, null, "Contest is not active", 400);
    }
    // get the question testcases
    const testcases = await questionUtil.getQuestionTestCases(req.body.questionId);
    const judgeResponse = await judgeUtil.sendRequestsToJudge(testcases, req.body);
    // Create the submission
    return responseUtil.sendResponse(res, true, judgeResponse, "Submission validated successfully", 200);
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
