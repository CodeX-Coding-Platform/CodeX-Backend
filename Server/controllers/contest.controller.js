const Contest = require("../models/contest.model.js");
const Counter = require("../models/counter.model.js");

const contestUtil = require("../services/contestUtil.js");
const questionUtil = require("../services/questionUtil.js");
const responseUtil = require("../services/responseUtil.js");

const dotenv = require("dotenv");
dotenv.config({ path: "../util/config.env" });

var contestCode = process.env.contestCode
var mcqContestCode = process.env.mcqContestCode

exports.createContest = async (req, res) => {
  try {
    const counter = await Counter.findOne();
    const contestId = req.body.isMcqContest ? mcqContestCode + (Number(counter.mcqContestCount) + 1).toString() : contestCode + (Number(counter.contestCount) + 1).toString();
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
    //In case of mcq
    var mcqTopics = [];
    var mcqSubjects = [];
    if(req.body.isMcqContest ) {
      const difficultyDistribution = req.body.difficultyDistribution;
      for(var subject in difficultyDistribution) {
        mcqSubjects.push(subject);
        for(var topic in difficultyDistribution[subject]) {
          mcqTopics.push(topic);
          for(var i=0;i< difficultyDistribution[subject][topic].length;i++) {
            if(i==0) {
              const conditions = {
                "difficulty" : "Easy",
                "mcqTopic" : topic,
                "mcqSubject" : subject
              }
              const questions = await questionUtil.getQuestions(conditions, {questionId : 1}, difficultyDistribution[subject][topic][0]);
              for(var question in questions) {
                questionsList.push(questions[question].questionId);
              }
            } else if(i == 1) {
              const conditions = {
                "difficulty" : "Medium",
                "mcqTopic" : topic,
                "mcqSubject" : subject
              }
              const questions = await questionUtil.getQuestions(conditions, {questionId : 1}, difficultyDistribution[subject][topic][1]);
              for(var question in questions) {
                questionsList.push(questions[question].questionId);
              }
            } else {
              const conditions = {
                "difficulty" : "Hard",
                "mcqTopic" : topic,
                "mcqSubject" : subject
              }
              const questions = await questionUtil.getQuestions(conditions, {questionId : 1}, difficultyDistribution[subject][topic][2]);
              for(var question in questions) {
                questionsList.push(questions[question].questionId);
              }
            }
          }
        }
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
      isMcqContest: req.body.isMcqContest,
      mcqTopics: (req.body.isMcqContest == true) ? mcqTopics : null,
      mcqSubjects: (req.body.isMcqContest == true) ? mcqSubjects : null,
      difficultyDistribution : (req.body.isMcqContest == true) ? req.body.difficultyDistribution : null,
      sections: req.body.sections,
      contestPassword: req.body.contestPassword
    });

    const newContest = await contest.save();
    req.body.isMcqContest ? counter.mcqContestCount = Number(counter.mcqContestCount) + 1 : counter.contestCount = Number(counter.contestCount) + 1;
    const updatedCounter = await counter.save();
    return responseUtil.sendResponse(res, true, newContest, "New Contest with " + contestId + " is created!", 201);

  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "Contest Creation failed with error " + error.message, 500);
  }
}

// Retrieve and return all contests from the database.
exports.getAllContests = async (req, res) => {
  try {
    const contests = await contestUtil.getAllContests(req.params.isMcq === "mcq");
    responseUtil.sendResponse(res, true, contests, "All contests fetched successfully!", 200);
  } catch (error) {
    responseUtil.sendResponse(res, false, null, "An error occurred while fetching all contests", 500);
  }
};


//check whether contest is active
exports.activeContest = async (req, res) => {
  try {
    if (req.params.contestId === undefined) {
      return responseUtil.sendResponse(res, false, null, "contestId is not provided", 400);
    }
    const contest = await contestUtil.getOneContest(req.params.contestId);
    const isContestActive = await contestUtil.isContestActive(contest);
    
    if (isContestActive || req.decoded.admin) {
      return responseUtil.sendResponse(res, true, isContestActive, "Contest window is open!", 200);
    } else {
      return responseUtil.sendResponse(res, false, null, "Contest window isn't open!", 200);
    }

  } catch (error) {
    return responseUtil.sendResponse(res, false, null, "An error occurred while checking the contest status.", 500);
  }
};

// Find a single contest with a contestId
exports.findOneContest = async (req, res) => {
  try {
    if (req.params.contestId === undefined) {
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
    if (req.params.contestId === undefined) {
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
    if (req.params.contestId === undefined) {
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
