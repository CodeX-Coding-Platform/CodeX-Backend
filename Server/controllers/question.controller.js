const Question = require("../models/question.model.js");
const Contest = require("../models/contest.model.js");
const Counter = require("../models/counter.model.js");
const Participation = require("../models/participation.model.js");
const xlsx = require("xlsx");
const contests = require("./contest.controller.js");
const participations = require("./participation.controller.js");
// const Base64 = require('js-base64').Base64;
// Create and Save a new question
exports.create = async (req, res) => {
  // Validate request

  if (!req.body.questionName) {
    return res.status(400).send({
      success: false,
      message: "Question name can not be empty",
    });
  }
  try {
    const counter = await Counter.findOne();
    const questionId =
      "KLHCODE" + (Number(counter.questionCount) + 1).toString();
    counter.questionCount = Number(counter.questionCount) + 1;
    const updatedCounter = await counter.save();
    const question = new Question({
      questionId: questionId,
      questionName: req.body.questionName,
      contestId: req.body.contestId,
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
    question
      .save()
      .then((data) => {
        res.send({
          success: true,
          message: "Question Created Successfully ",
          questionData: data,
          countersData: updatedCounter,
        });
      })
      .catch((err) => {
        res.status(500).send({
          success: false,
          message:
            err.message || "Some error occurred while creating the Question.",
        });
      });
  } catch (err) {
    res.status(500).send({
      success: false,
      message:
        err.message ||
        "Some error occurred while fetching counters, please check if counters are created or not",
    });
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

exports.getAllQuestions = async (req) => {
  try {
    const questions = await Question.find({ contestId: req.cookies.contestId });
    if (!questions) {
      throw "Questions not found";
    }
    return questions;
  } catch (err) {
    if (err.kind === "ObjectId") {
      throw "Questions not found";
    }
    throw "Error retrieving questions";
  }
};

// Retrieve and return all questions from the database.
exports.findAll = (req, res) => {
  Question.find(
    {},
    { questionId: 1, questionName: 1, topic: 1, company: 1, difficulty: 1 }
  )
    .then((questions) => {
      res.send(questions);
    })
    .catch((err) => {
      res.status(500).send([]);
    });
};

// Find a single question with a questionId
exports.findOne = (req, res) => {
  Question.find({ questionId: req.params.questionId })
    .then((question) => {
      if (!question) {
        return res.status(404).send({
          success: false,
          message: "Question not found with id " + req.params.questionId,
        });
      }
      res.send(question);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          success: false,
          message: "Question not found with id " + req.params.questionId,
        });
      }
      return res.status(500).send({
        success: false,
        message: "Error retrieving question with id " + req.params.questionId,
      });
    });
};

exports.getQuestionName = (req, res) => {
  Question.find(
    { questionId: req.params.questionId },
    { questionName: 1, _id: 0 }
  )
    .then((question) => {
      if (!question) {
        return res.status(404).send({
          success: false,
          message: "Question not found with id " + req.params.questionId,
        });
      }
      let response = {
        questionName: question[0].questionName,
      };
      res.send(response);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          success: false,
          message: "Question not found with id " + req.params.questionId,
        });
      }
      return res.status(500).send({
        success: false,
        message: "Error retrieving question with id " + req.params.questionId,
      });
    });
};
// Find testcases with questionId
exports.getTestCases = async (req) => {
  try {
    const question = await Question.findOne({
      questionId: req.body.questionId,
    });

    if (!question) {
      throw new Error("Couldn't find question");
    }

    const testcases = {
      contestId: question.contestId,
      HI1: question.questionHiddenInput1,
      HI2: question.questionHiddenInput2,
      HI3: question.questionHiddenInput3,
      HO1: question.questionHiddenOutput1,
      HO2: question.questionHiddenOutput2,
      HO3: question.questionHiddenOutput3,
      difficulty: question.difficulty,
      language: question.language,
      courseId: question.courseId,
    };

    return testcases;
  } catch (err) {
    if (err.kind === "ObjectId") {
      throw new Error("Couldn't find question, caught exception");
    }
    throw new Error("Error retrieving data");
  }
};

// Update a question identified by the questionId in the request
exports.update = (req, res) => {
  if (!req.body.questionId) {
    return res.status(400).send({
      success: false,
      message: "QuestionId can not be empty",
    });
  }
  // Find question and update it with the request body
  Question.findOneAndUpdate(
    { questionId: req.params.questionId },
    {
      $set: {
        questionId: req.body.questionId,
        questionName: req.body.questionName,
        contestId: req.body.contestId,
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
      },
    },
    { new: true }
  )
    .then((question) => {
      if (!question) {
        return res.status(404).send({
          success: false,
          message: "Question not found with id " + req.params.questionId,
        });
      }
      res.status(200).send({
        success: true,
        questionId: req.params.questionId,
        message: "Updated Successfully",
      });
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          success: false,
          message: "Question not found with id " + req.params.questionId,
        });
      }
      return res.status(500).send({
        success: false,
        message: "Error updating Question with id " + req.params.questionId,
      });
    });
};

// Delete a question with the specified questionId in the request
exports.delete = (req, res) => {
  Question.findOneAndRemove({ questionId: req.params.questionId })
    .then((question) => {
      if (!question) {
        return res.status(404).send({
          success: false,
          message: "question not found with id " + req.params.questionId,
        });
      }
      res.send({ message: "question deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          success: false,
          message: "question not found with id " + req.params.questionId,
        });
      }
      return res.status(500).send({
        success: false,
        message: "Could not delete question with id " + req.params.questionId,
      });
    });
};

// Delete questions with the specified questionIds in the request
exports.deleteMultiple = (req, res) => {
  questionIds = req.params.questionIds
    .split(",")
    .filter((item) => !item.includes("-"))
    .map((item) => item.trim());
  Question.deleteMany({ questionId: { $in: questionIds } })
    .then((question) => {
      if (!question) {
        return res.status(404).send({
          success: false,
          message: "question not found with id " + req.params.questionId,
        });
      }
      res.send({ message: "questions deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          success: false,
          message: "question not found with id " + req.params.questionId,
        });
      }
      return res.status(500).send({
        success: false,
        message: "Could not delete question with id " + req.params.questionId,
      });
    });
};

exports.findAllContest = async(req,res) => {
  try {
    const contest = await Contest.findOne({ contestId: req.params.contestId });
    var questionsList = contest.questionsList || [];
    if(contest.isManual) {
      try {
        const questions = await Question.find({questionId : {$in: questionsList} });
        return res.status(200).send({
          success : true,
          data : questions,
          message : "Questions fetched for Manual Contest with ContestId "+req.params.contestId,
        })
      } catch(err) {
        return res.status(500).send({
          success : false,
          message : "Questions could not fetched for Manual Contest with ContestId "+req.params.contestId+" due to error ",
        })
      }
    } else if(contest.isMultipleSet) {
      try {
        const participation = await Participation.findOne({participationId : req.body.username.toLowerCase()+req.params.contestId});
        if(participation.questions !== null && participation.questions.length !== 0) {
          try {
            const questions = await Question.find({questionId : {$in: participation.questions} });
            return res.status(200).send({
              success : true,
              data : questions,
              message : "Questions fetched for Manual Contest with ContestId "+req.params.contestId,
            })
          } catch(err) {
            return res.status(500).send({
              success : false,
              message : "Questions could not fetched for Manual Contest with ContestId "+req.params.contestId+" due to error ",
            })
          }
        } else {
          const sets = contest.sets;
          if(sets == null) {
            return res.status(500).send({
              success : false,
              message : "Sets are empty for MultipleSet Contest with ContestId "+req.params.contestId,
            })
          }
          for(var index in sets) {
            const randomIndex = Math.floor(Math.random() * (sets[index].length));
            questionsList.push(sets[index][randomIndex]);
          }
          try {
            participation.questions = questionsList;
            await participation.save();
            try {
              const questions = await Question.find({questionId : {$in: questionsList} });
              return res.status(200).send({
                success : true,
                data : questions,
                message : "Questions fetched for Manual Contest with ContestId "+req.params.contestId,
              })
            } catch(err) {
              return res.status(500).send({
                success : false,
                message : "Questions could not fetched for Manual Contest with ContestId "+req.params.contestId+" due to error ",
              })
            }
          } catch(err) {
            return res.status(500).send({
              success : false,
              message : "Error while updating Participation with ContestId "+req.params.contestId+" due to error "+err.message,
            })
          }
        }
      } catch(err) {
        return res.status(500).send({
          success : false,
          message : "Could not fetch participation with id "+req.body.username+req.params.contestId,
        })
      }
    }
  } catch(err) {
    return res.status(500).send({
      success : false,
      message : "Could not fetch Contest with id "+req.params.contestId+" due to error "+err.message,
    })
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
