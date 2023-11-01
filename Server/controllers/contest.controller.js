const Contest = require("../models/contest.model.js");
const Counter = require("../models/counter.model.js");

const contestUtil = require("../services/contestUtil.js");
const questionUtil = require("../services/questionUtil.js");
const responseUtil = require("../services/responseUtil.js");

const dotenv = require("dotenv");
dotenv.config({ path: "../util/config.env" });

var contestCode = process.env.contestCode

exports.createContest = async (req, res) => {
  try {
    const counter = await Counter.findOne();
    const contestId = contestCode + (Number(counter.contestCount) + 1).toString();
    counter.contestCount = Number(counter.contestCount) + 1;
    const updatedCounter = await counter.save();
    var questionsList = [];
    //In case of manual
    if (req.body.isManual) {
      const areQuestionIdsValid = await questionUtil.isValidQuestionIds(req.body.questionsList);
      if (!areQuestionIdsValid) {
        return responseUtil.sendResponse(res, false, null, "Contest Creation failed due to invalid questionIds", 400);
      }
      questionsList = questionsList.concat(req.body.questionsList);
    }
    //In case of MultipleSet
    if (req.body.isMultipleSet) {
      var flattenedSets = req.body.sets.flat();
      const uniqueSet = new Set(flattenedSets);
      //check if all questionIds are valid or not
      const areQuestionIdsValid = await questionUtil.isValidQuestionIds(Array.from(uniqueSet));
      if (!areQuestionIdsValid) {
        return responseUtil.sendResponse(res, false, null, "Contest Creation failed due to invalid questionIds in sets", 400);
      }
    }
    const contest = new Contest({
      contestId: contestId,
      contestName: req.body.contestName,
      contestDate: req.body.contestDate,
      contestDuration: req.body.contestDuration,
      contestStartTime: req.body.contestStartTime,
      contestEndTime: req.body.contestEndTime,
      isManual: req.body.isManual,
      questionsList: questionsList,
      isMultipleSet: req.body.isMultipleSet,
      sets: (req.body.isMultipleSet == true) ? req.body.sets : null,
      sections: req.body.sections,
      contestPassword: req.body.contestPassword
    });

    const newContest = await contest.save();
    return responseUtil.sendResponse(res, true, newContest, "New Contest with " + contestId + " is created!", 201);

  } catch (err) {
    return responseUtil.sendResponse(res, false, null, "Contest Creation failed with error " + err.message, 500);
  }
}

// Retrieve and return all contests from the database.
exports.getAllContests = async (req, res) => {
  try {
    const contests = await contestUtil.getAllContests();
    responseUtil.sendResponse(res, true, contests, "All contests fetched successfully!", 200);
  } catch (error) {
    responseUtil.sendResponse(res, false, null, "An error occurred while fetching all contests", 500);
  }
};


//check whether contest is active
exports.activeContest = async (req, res) => {
  try {
    if (!req.params.contestId) {
      return responseUtil.sendResponse(res, false, null, "contestId is not provided", 400);
    }
    const contest = await contestUtil.getOneContest(req.params.contestId);
    const isContestActive = await contestUtil.isContestActive(contest);
    
    if (isContestActive || req.decoded.admin) {
      return responseUtil.sendResponse(res, true, isContestActive, "Contest window is open!", 200);
    } else {
      return responseUtil.sendResponse(res, false, null, "Contest window isn't open!", 400);
    }

  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "An error occurred while checking the contest status.", 500);
  }
};

// Find a single contest with a contestId
exports.findOneContest = async (req, res) => {
  try {
    if (!req.params.contestId) {
      return responseUtil.sendResponse(res, false, null, "contestId is not provided", 400);
    }
    const contest = await contestUtil.getOneContest(req.params.contestId);
    if (!contest) {
      return responseUtil.sendResponse(res, false, null, "Contest not found with id " + req.params.contestId, 400);
    }
    return responseUtil.sendResponse(res, true, contest, "Contest successfully retrieved with id " + req.params.contestId, 200);

  } catch (error) {
    if (error.kind === "ObjectId") {
      return responseUtil.sendResponse(res, false, null, "Contest not found with id " + req.params.contestId, 400);
    }
    return responseUtil.sendResponse(res, false, null, "Error retrieving contest with id " + req.params.contestId, 500);
  }
};

exports.updateContest = async (req, res) => {
  try {
    if (!req.params.contestId) {
      return responseUtil.sendResponse(res, false, null, "contestId is not provided", 400);
    }
    const updatedContest = await contestUtil.updateContest(req.params.contestId, req.body);
    if (updatedContest) {
      return responseUtil.sendResponse(res, true, updatedContest, "Contest updated successfully.", 200);
    } else {
      return responseUtil.sendResponse(res, false, null, "Contest not found with id " + req.params.contestId, 400);
    }
  } catch (error) {
    if (error.kind === "ObjectId") {
      return responseUtil.sendResponse(res, false, null, "Contest not found with id " + req.params.contestId, 400);
    }
    return responseUtil.sendResponse(res, false, null, "Error updating contest with id " + req.params.contestId, 500);
  }
};

exports.deleteContest = async (req, res) => {
  try {
    if (!req.params.contestId) {
      return responseUtil.sendResponse(res, false, null, "contestId is not provided", 400);
    }
    const deletedContest = await contestUtil.deleteContest(req.params.contestId);
    if (deletedContest) {
      return responseUtil.sendResponse(res, true, deletedContest, "Contest deleted successfully.", 200);
    } else {
      return responseUtil.sendResponse(res, false, null, "Contest not found with id " + req.params.contestId, 400);
    }
  } catch (error) {
    return responseUtil.sendResponse(res, false, null, error.message, 500);
  }
};

exports.checkContestPassword = (req, res) => {
  if (req.body.username.toLowerCase() === req.body.rollNumber.toLowerCase()) {
    Contest.findOne({ contestId: req.body.contestId })
      .then((data) => {
        if (data.contestPassword === req.body.password) {
          res.status(200).send({
            success: true,
            contestId: req.body.contestId,
          });
        } else {
          res.status(200).send({
            success: false,
          });
        }
      })
      .catch((err) => {
        res.status(400).send({
          success: false,
          message: err.message,
        });
      });
  } else {
    res.status(400).send({
      success: false,
      message: err.message,
    });
  }
};
