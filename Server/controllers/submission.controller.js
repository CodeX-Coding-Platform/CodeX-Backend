const Submission = require("../models/submission.model.js");
var moment = require("moment");
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
exports.genSource = (req, res) => {
  Submission.find({ questionId: req.params.questionId })
    .then((submission) => {
      if (submission.length === 0) {
        res.send("Submissions not found");
      }
      // result = [];
      // submission = submission[0];
      users = [];
      for (let i = 0; i < submission.length; i++) {
        users.push(submission[i].username);
      }
      users = users.filter((a, b) => users.indexOf(a) === b);
      let dir = path.resolve("../Public/source_codes/" + req.params.questionId);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      // gen folders for all langs
      genLangs = [
        path.resolve("../Public/source_codes/" + req.params.questionId + "/c/"),
        path.resolve(
          "../Public/source_codes/" + req.params.questionId + "/java/"
        ),
        path.resolve(
          "../Public/source_codes/" + req.params.questionId + "/py/"
        ),
      ];
      for (let i = 0; i < genLangs.length; i++) {
        dir = genLangs[i];
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
      }
      users.forEach((user) => {
        Submission.find({
          questionId: req.params.questionId,
          username: user,
          score: 100,
        })
          .then((dup) => {
            langCode = {
              4: "c",
              10: "c",
              26: "java",
              27: "java",
              28: "java",
              34: "py",
              36: "py",
            };
            for (let s = 0; s < dup.length; s++) {
              // result.push({questionId: dup[s].questionId, username: dup[s].username, languageId: dup[s].languageId, sourceCode: dup[s].sourceCode});
              let l = dup.length - 1;
              fs.writeFile(
                "../Public/source_codes/" +
                  dup[l].questionId +
                  "/" +
                  langCode[dup[l].languageId] +
                  "/" +
                  dup[l].username +
                  "." +
                  langCode[dup[l].languageId],
                dup[l].sourceCode,
                (err) => {
                  if (err) {
                    console.log("File gen failed!", err);
                  }
                }
              );
            }
          })
          .catch((err) => {
            if (err.kind === "ObjectId") {
              res.send("Submission not found with Id ");
            }
            res.send("Error updating Submission with Id ");
          });
      });
      let response =
        "Files Generation started! " + submission.length.toString() + " Files";
      res.send(response);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        res.send("Submission not found with Id ");
      }
      res.send("Error updating Submission with Id ");
    });
};

// exports.findContestUser = (req, res) => {
//     Submission.find({contestId: req.body.contestId, username: req.body.username, questionId: req.body.questionId})
//     .then(submission => {
//         res.send(submission);
//     }).catch(err => {
//         res.status(500).send({
//             success: false,
//             message: err.message || "Some error occurred while retrieving submission."
//         });
//     });
// };

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
