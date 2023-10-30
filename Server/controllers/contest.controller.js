const Contest = require("../models/contest.model.js");
const Question = require("../models/question.model.js");
const Counter = require("../models/counter.model.js");
const contestUtil = require("../services/contestUtil.js");
const questionUtil = require("../services/questionUtil.js");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config({ path: "../util/config.env" });
const xlsx = require("xlsx");

var contestCode = process.env.contestCode

exports.createContest = async (req, res) => {
  try {
    const counter = await Counter.findOne();
    const contestId = contestCode + (Number(counter.contestCount) + 1).toString();
    counter.contestCount = Number(counter.contestCount) + 1;
    const updatedCounter = await counter.save();
    var questionsList = [];
    //In case of manual
    if(req.body.isManual) {
      questionsList = questionsList.concat(req.body.questionsList);
    }
    if(req.body.isMultipleSet) {
      var flattenedSets = req.body.sets.flat();
      const uniqueSet = new Set(flattenedSets);
      const areQuestionIdsValid = await questionUtil.isValidQuestionIds(Array.from(uniqueSet));
      if(!areQuestionIdsValid) {
        return res.status(500).send({
          success : false,
          message : "Contest Creation failed due to invalid questionIds in sets"
        });
      }
    }
    const contest = new Contest({
      contestId: contestId,
      contestName: req.body.contestName,
      contestDate: req.body.contestDate,
      contestDuration: req.body.contestDuration,
      contestStartTime: req.body.contestStartTime,
      contestEndTime: req.body.contestEndTime,
      isManual : req.body.isManual,
      questionsList : questionsList,
      isMultipleSet : req.body.isMultipleSet,
      sets : (req.body.isMultipleSet == true)? req.body.sets : null,
      sections: req.body.sections,
      contestPassword: req.body.contestPassword,
      visibility: req.body.visibility == "on",
    });

    const newContest = await contest.save();
    return res.status(200).send({
      success : true,
      message : "New Contest with "+contestId+" is created!",
      date : newContest
    });
  } catch(err) {
    return res.status(500).send({
      success : false,
      message : "Contest Creation failed with error "+err.message
    });
  }
}

// Retrieve and return all contests from the database.
exports.getAllContests = async (req, res) => {
  try {
    const contests = await Contest.find({});
    res.status(200).send({
      success: true,
      data : contests
    });
  } catch(error) {
    res.status(404).send({
      success: false,
      message: "An error occurred while fetching all contests"
    });
  }
};

//check whether contest is active
exports.activeContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({ contestId: req.params.contestId });

    const isContestActive = await contestUtil.isContestActive(contest);

    if (isContestActive || req.decoded.admin) {
      res.status(200).send({
        success: true,
        message: "Contest window is open!"
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Contest window isn't open!"
      });
    }
  } catch (error) {
    res.status(404).send({
      success: false,
      message: "An error occurred while checking the contest status."
    });
  }
};

// Find a single contest with a contestId
exports.findOneContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({contestId : req.params.contestId});
    if (!contest) {
      return res.status(404).send({
        success: false,
        message: "Contest not found with id " + req.params.contestId,
      });
    }
    res.status(200).send({
      success : true,
      data : contest
    });

  } catch(error) {
    if (err.kind === "ObjectId") {
      return res.status(404).send({
        success: false,
        message: "Contest not found with id " + req.params.contestId,
        data : null
      });
    }
    return res.status(500).send({
      success: false,
      message: "Error retrieving contest with id " + req.params.contestId,
      data : null
    });
  }
};

exports.updateContest = async (req, res) => {
  try {
    if(!req.params.contestId) {
      return res.status(404).send({
        success: false,
        message: "ContestId is not provided",
      });
    }
    const updatedContest = await contestUtil.updateContest(req.params.contestId,req.body);
    if (updatedContest) {
      res.status(200).send({
        success: true,
        message: "Contest updated successfully.",
        data : updatedContest
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Contest not found with id " + req.params.contestId,
      });
    }
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).send({
        success: false,
        message: "Contest not found with id " + req.params.contestId,
      });
    }
    return res.status(500).send({
      success: false,
      message: "Error updating Contest with id " + req.params.contestId + " due to "+err.message,
    });
  }
};

exports.deleteContest = async (req, res) => {
  try {
    const deletedContest = await contestUtil.deleteContest(req.params.contestId);
    if (deletedContest) {
      res.status(200).send({
        success: true,
        message: "Contest deleted successfully.",
        data : deletedContest
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Contest not found with id " + req.params.contestId,
      });
    }
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).send({
        success: false,
        message: "Contest not found with id " + req.params.contestId,
      });
    }
    return res.status(500).send({
      success: false,
      message: "Error updating Contest with id " + req.params.contestId + " due to "+err.message,
    });
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
