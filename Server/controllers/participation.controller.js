const Participation = require("../models/participation.model.js");
const contests = require("./contest.controller.js");

const participationUtil = require("../services/participationUtil");
const responseUtil = require("../services/responseUtil");
const contestUtil = require("../services/contestUtil");
var moment = require("moment");

exports.create = async (req, res) => {
  req.body.username = req.decoded.username;
  // Validate request
  if (req.body.username === undefined) {
    return res.status(400).send({
      success: false,
      message: "user Id can not be empty",
    });
  }

  if (req.body.branch === undefined && req.body.username !== "admin") {
    return res.status(400).send({
      success: false,
      message: "user Branch can not be empty",
    });
  }
  if (req.body.contestId  === undefined) {
    return res.status(400).send({
      success: false,
      message: "contest Id can not be empty",
    });
  }
  Participation.find({
    participationId: req.body.username + req.body.contestId,
  })
    .then(async (participation) => {
      if (participation.length === 0) {
        let duration = await contests.getDuration(req);
        if (!duration) {
          res.send({ success: false, message: "Error occured" });
        }

        let date = moment();
        let d = duration.duration;
        let endTime = moment(date, "HH:mm:ss").add(d, "minutes");

        // Create a Participation
        const participation = new Participation({
          participationId: req.body.username + req.body.contestId,
          username: req.body.username,
          branch: req.body.branch,
          contestId: req.body.contestId,
          participationTime: date,
          submissionResults: [],
          validTill: endTime,
        });
        // Save participation in the database
        participation
          .save()
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            res.status(500).send({
              success: false,
              message: err.message || "Some error occurred while Registering.",
            });
          });
      } else {
        res.send({ success: false, message: "User already participated" });
      }
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message:
          err.message || "Some error occurred while retrieving participation.",
      });
    });
};

// Retrieve and return all participations from the database.
exports.findAll = async (req, res) => {
  try {
    const participations = await participationUtil.getAllParticipations();
    return responseUtil.sendResponse(res, true, participations, "Participations fetched successfully", 200); 
  } catch(error) {
    return responseUtil.sendResponse(res, false, null, "Participations fetched failed due to "+error.message, 500);
  }
};

// Retrieve and return all participation details for user in contest.
exports.findUser = async (req, res) => {
  try {
    const participation = await participationUtil.getOneParticipation(req.params.username + req.params.contestId);
    return responseUtil.sendResponse(res, true, participation, "Participation fetched successfully", 200);
  } catch(error) {
    return responseUtil.sendResponse(res, false, null, "Participation fetched failed due to "+error.message, 500);
  }
};

exports.findAllContestsUser = (req, res) => {
  Participation.find({ username: req.body.username })
    .then((participation) => {
      let data = [];
      participation.forEach((item) => {
        let temp = {};
        temp["contestId"] = item.contestId;
        temp["participationTime"] = item.participationTime;
        data.push(temp);
      });
      res.send({
        success: true,
        count: participation.length,
        data: data,
      });
    })
    .catch((err) => {
      res.send({
        success: false,
        count: 0,
        data: [],
      });
    });
};

exports.findParticipation = (req, callback) => {
  Participation.find({
    participationId: req.decoded.username + req.params.contestId,
  })
    .then((participation) => {
      if (participation.length === 0) {
        return callback("participation not found ", null);
      }

      participation = participation[0];
      return callback(null, participation);
    })
    .catch((err) => {
      return callback(err || "Error retrieving contest", null);
    });
};

exports.findUserTime = async (result) => {
  try {
    var participation = await Participation.find({
      participationId: result.participationId,
    });

    if (!participation) {
      throw new Error("Couldn't find participation");
    }
    participation = participation[0];
    return participation;
  } catch (err) {
    if (err.kind === "ObjectId") {
      throw new Error("Couldn't find participation, caught exception");
    }
    throw new Error("Error retrieving data");
  }
};

exports.updateParticipation = (req, questionIds, callback) => {
  Participation.findOneAndUpdate(
    { participationId: req.decoded.username + req.params.contestId },
    {
      $set: {
        questions: questionIds,
      },
    },
    { new: true }
  )
    .then((participation) => {
      console.log(participation);
      if (!participation) {
        return callback("Contest not found ", null);
      }
      participation = participation[0];
      return callback(null, participation);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return callback("Contest not found", null);
      }
      return callback("Error retrieving contest", null);
    });
};

exports.getLeaderboard = async(req,res) => {
  if(req.params.contestId  === undefined) {
    return responseUtil.sendResponse(res,false,null,"ContestId cannot be empty",400);
  }
  try {
    const contest = await contestUtil.getOneContest(req.params.contestId);
    if(contest.isMcqContest === true) {
      const participations = await participationUtil.getAllParticipationsContest(contest.contestId);
      var mcqContestResults = [];
      var mcqTopicsAndSubjects = {};
      mcqTopicsAndSubjects["mcqTopics"] = contest.mcqTopics;
      mcqTopicsAndSubjects["mcqSubjects"] = contest.mcqSubjects;
      mcqContestResults.push(mcqTopicsAndSubjects);
      for(var participation in participations) {
        var userResult = {};
        userResult["username"] = participations[participation].username;
        userResult["mcqTopicScore"] = participations[participation].mcqTopicScore;
        userResult["mcqSubjectScore"] = participations[participation].mcqSubjectScore;
        userResult["TotalScore"] = participations[participation].mcqTotalScore;
        mcqContestResults.push(userResult)
      }
      return responseUtil.sendResponse(res,true,mcqContestResults,"Leaderboard Fetched Successfully",200);
    } else {
      var questionIds = [];
      if(contest.isMultipleSet) {
        const questionIdSet = new Set();
        const sets = contest.sets;
        for(const set of sets) {
          for(const questionId of set){
            questionIdSet.add(questionId);
          }
        }
        questionIds = Array.from(questionIdSet);
      } else {
        questionIds = contest.questionsList;
      }
      const participations = await participationUtil.getAllParticipationsContest(req.params.contestId);
      var contestResults = [];
      for(var participation in participations) {
        var userResult = {};
        userResult["username"] = participations[participation].username;
        var totalScore=0;
        for(var question in questionIds) {
          userResult[questionIds[question]] = (participations[participation].submissionResults[questionIds[question]] !== undefined) ? participations[participation].submissionResults[questionIds[question]] : "Not Attempted";
          totalScore += (userResult[questionIds[question]] !== "Not Attempted") ? userResult[questionIds[question]] : 0;
        }
        contestResults.push(userResult);
      }
      return responseUtil.sendResponse(res,true,contestResults,"Leaderboard Fetched Successfully",200);
    }
  } catch(error) {
    return responseUtil.sendResponse(res,false,null,error.message,400);
  }
}

exports.acceptSubmission = async (sub) => {
  try {
    let participation = await Participation.findOne({
      participationId: sub.participationId,
    });

    let multiSet = true;
    if (participation.questions.length !== 0) {
      if (!participation.questions.includes(sub.questionId)) {
        multiSet = false;
        return participation;
      }
    }
    if (multiSet) {
      let found = false;
      let updated = false;

      if (participation.submissionResults.length !== 0) {
        for (let i = 0; i < participation.submissionResults.length; i++) {
          if (
            participation.submissionResults[i].questionId === sub.questionId
          ) {
            found = true;
            if (participation.submissionResults[i].score < sub.score) {
              // Update higher score
              updated = true;
              await Participation.updateOne(
                {
                  participationId: sub.participationId,
                  "submissionResults.questionId": sub.questionId,
                },
                {
                  $set: {
                    "submissionResults.$.score": sub.score,
                    "submissionResults.$.ipAddress": sub.ipAddress,
                  },
                },
                { new: true }
              );
            }
          }
        }
        if (found && !updated) {
          return participation;
        }
      }

      if (!found) {
        await Participation.findOneAndUpdate(
          { participationId: sub.participationId },
          {
            $addToSet: {
              submissionResults: {
                questionId: sub.questionId,
                score: sub.score,
                ipAddress: sub.ipAddress,
              },
            },
          },
          { new: true }
        );
      }
    }
    return participation;
  } catch (err) {
    throw err;
  }
};

exports.endContest = async (req, res) => {
  let findVal = req.body.username.toLowerCase() + req.body.contestId;
  Participation.findOne({ participationId: findVal })
    .then((participation) => {
      let setVal = participation.participationTime;
      Participation.findOneAndUpdate(
        { participationId: findVal },
        {
          $set: {
            validTill: setVal,
          },
        }
      )
        .then(() => {
          res.send("done");
        })
        .catch((err) => {
          res.send("error");
        });
    })
    .catch((err) => {
      res.send("error");
    });
};

exports.changeValidTime = (req, res) => {
  const username = req.body.username.toLowerCase();
  const contestId = req.body.contestId;
  var participationId = username + contestId;
  Participation.findOne({ participationId: participationId })
    .then((data) => {
      const time = Number(req.body.time);
      var data = new Date(data.validTill);
      data.setTime(data.getTime() + time * 60 * 1000);
      Participation.findOneAndUpdate(
        { participationId: participationId },
        {
          $set: {
            participationId: participationId,
            validTill: data,
            endContest: 0,
          },
        },
        { upsert: true }
      )
        .then((data) => {
          res.status(200).send("Updated Successfully!");
        })
        .catch((err) => {
          res.status(500).send({
            success: false,
            message: "Error occurred!",
          });
        });
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: err.message || "Error occurred!",
      });
    });
};

exports.findUserPartTime = (req, res) => {
  Participation.find({ participationId: req.params.participationId })
    .then((participation) => {
      res.send({
        success: true,
        data: participation,
      });
    })
    .catch((err) => {
      res.send({
        success: false,
      });
    });
};

// Retrieve and return all participation details.
exports.findContestPart = (req, res) => {
  Participation.find({ contestId: req.body.contestId })
    .then((participation) => {
      res.send(participation);
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message:
          err.message || "Some error occurred while retrieving participation.",
      });
    });
};
