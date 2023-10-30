const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const request = require("request");
const moment = require("moment-timezone");
const upload = require("express-fileupload");
var path = require("path");
const requestIp = require("request-ip");
const dotenv = require("dotenv");
const axios = require("axios");
const schedule = require("node-schedule");

dotenv.config({ path: "../Server/util/config.env" });

let middleware = require("./util/middleware.js");

const User = require("./models/user.model");
const Participation = require("./models/participation.model").Participation;
const localServer = process.env.localServer;
const port = process.env.PORT || 5000;
let apiAddress = process.env.apiAddress;
let timeOut = 3000;

if (localServer) {
  apiAddress = process.env.localAPI;
  timeOut = 0;
}

console.log("Using API from URL: ", apiAddress);

// INIT
const app = express();
app.options("*", cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());
app.use(upload());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../web/build")));

  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "../web/build", "index.html"));
  });
}

// CODE STARTS HERE

mongoose.Promise = global.Promise;
moment.suppressDeprecationWarnings = true;

dbConfig = {
  url: process.env.dbURL,
};
// Connecting to the database
mongoose
  .connect(dbConfig.url, {
    useNewUrlParser: true,
    //to remove deprication message
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log("Could not connect to the database. Exiting now...", err);
    process.exit();
  });

// Imports
const users = require("./controllers/user.controller.js");
const submissions = require("./controllers/submission.controller.js");
const questions = require("./controllers/question.controller.js");
const participations = require("./controllers/participation.controller.js");
const contests = require("./controllers/contest.controller.js");
const counters = require("./controllers/counter.controller.js");
const skillUp = require("./controllers/skillUp.controller.js");

// Require contest routes
require("./routes/contest.route.js")(app);
// Require user routes
require("./routes/user.route.js")(app);
// Require question routes
require("./routes/question.route.js")(app);
// Require submission routes
require("./routes/submission.route.js")(app);
// Require participation routes
require("./routes/participation.route.js")(app);
// Require counter routes
require("./routes/counter.route.js")(app);
// Require tag routes
require("./routes/tag.route.js")(app);
// Require skillUp routes
require("./routes/skillUp.route.js")(app);
// Require weekPerformance routes
require("./routes/weekPerformance.route.js")(app);

// Examples
app.get("/testGet", async (req, res) => {
  res.json({ status: "working" });
});

app.post("/testPost", async (req, res) => {
  res.json(req.body);
});

app.get("/isAdmin", middleware.checkTokenAdmin, async (req, res) => {
  res.send({
    success: true,
  });
});

const getSubmissionStatus = async (options) => {
  try {
    const response = await axios(options);
    return response.data.status.description;
  } catch (error) {
    throw error;
  }
};
const getSubmissionToken = async (options) => {
  try {
    const response = await axios(options);
    return response.data.token;
  } catch (error) {
    throw error;
  }
};

app.post("/validateSubmission", middleware.checkToken, async (req, res) => {
  try {
    const options11 = {
      method: "get",
      json: true,
      url: process.env.clientAddress + "/userSession/" + req.body.user,
    };

    const response11 = await axios(options11);
    if (!response11.data.status) {
      return res.status(404).send({ message: "user logged out!" });
    }

    if (req.body.contestId. h !== 0) {
      const duration = await contests.getDuration(req);

      const date = new Date();
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      let today = localServer
        ? `${year}-${month}-${day}`
        : `${year}-${day}-${month}`;

      const minutes = date.getMinutes().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const currentTime = moment().tz("Asia/Kolkata").format("HHmm");

      let accepted = false;
      if (
        duration.date.toString() === today &&
        duration.startTime.toString() < currentTime &&
        duration.endTime.toString() > currentTime
      ) {
        accepted = true;
      }

      if (req.decoded.admin) {
        accepted = true;
      }

      if (accepted) {
        const testcases = await questions.getTestCases(req);

        const postUrl = localServer
          ? apiAddress + "/submissions/?wait=true"
          : apiAddress + "/submissions";

        var options1 = {
          method: "post",
          data: {
            source_code: req.body.source_code,
            language_id: req.body.language_id,
            stdin: testcases.HI1,
            expected_output: testcases.HO1,
          },
          url: postUrl,
        };

        var options2 = {
          method: "post",
          data: {
            source_code: req.body.source_code,
            language_id: req.body.language_id,
            stdin: testcases.HI2,
            expected_output: testcases.HO2,
          },
          url: postUrl,
        };

        var options3 = {
          method: "post",
          data: {
            source_code: req.body.source_code,
            language_id: req.body.language_id,
            stdin: testcases.HI3,
            expected_output: testcases.HO3,
          },
          url: postUrl,
        };

        const result = {
          contestId: testcases.contestId,
          participationId: req.decoded.username + testcases.contestId,
          check: duration.mcq,
        };

        const participation = await participations.findUserTime(result);
        const momentDate = moment();
        const validTime = participation.validTill;

        if (momentDate.isBefore(validTime) || req.decoded.admin) {
          try {
            var [token1, token2, token3] = await Promise.all([
              getSubmissionToken(options1),
              getSubmissionToken(options2),
              getSubmissionToken(options3),
            ]);

            result.token1 = token1;
            result.token2 = token2;
            result.token3 = token3;
            if (result.token1 && result.token2 && result.token3) {
              const option1 = {
                url: apiAddress + "/submissions/" + result.token1,
                method: "get",
              };
              const option2 = {
                url: apiAddress + "/submissions/" + result.token2,
                method: "get",
              };
              const option3 = {
                url: apiAddress + "/submissions/" + result.token3,
                method: "get",
              };
              var [response1, response2, response3] = await Promise.all([
                getSubmissionStatus(option1),
                getSubmissionStatus(option2),
                getSubmissionStatus(option3),
              ]);

              result.response1 = response1;
              result.response2 = response2;
              result.response3 = response3;
              result.languageId = req.body.language_id;
              result.questionId = req.body.questionId;
              result.username = req.decoded.username;
              result.sourceCode = req.body.source_code;
              result.submissionToken = [
                result.token1,
                result.token2,
                result.token3,
              ];
              result.result = [
                result.response1,
                result.response2,
                result.response3,
              ];
              result.participationId = result.username + result.contestId;
              result.clientIp = requestIp.getClientIp(req);
              var testcasesPassed = 0;
              if (result.response1 === "Accepted") {
                testcasesPassed += 1;
              }
              if (result.response2 === "Accepted") {
                testcasesPassed += 1;
              }
              if (result.response3 === "Accepted") {
                testcasesPassed += 1;
              }
              if (testcasesPassed === 3) {
                result.score = 100;
              } else if (testcasesPassed === 2) {
                result.score = 50;
              } else if (testcasesPassed === 1) {
                result.score = 25;
              } else {
                result.score = 0;
              }

              try {
                const participation = await participations.acceptSubmission(
                  result
                );
                const sub = await submissions.create(req, result);
                res.send(sub);
              } catch (error) {
                res.status(404).send({ message: error.message });
              }
            }
          } catch (error) {
            console.error("Error:", error);
          }
        } else {
          res.status(403).send({ message: "Your test duration has expired" });
        }
      } else {
        res.status(403).send({ message: "The contest window is not open" });
      }
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

app.get("/getScores", middleware.checkToken, async (req, res) => {
  let username = req.decoded.username;
  // let contestId = req.cookies.contestId || req.body.contestId;
  let contestId = req.body.contestId;
  let result = {};
  let finalScores = {};
  let allQuestions = [];
  let scores = [];
  req.cookies.contestId = contestId;
  result.participationId = username + contestId;
  try {
    const question = await questions.getAllQuestionsAsync(req);
    for (let i = 0; i < question.length; i++) {
      allQuestions[i] = question[i].questionId;
    }
    try {
      const participation = await participations.findUserTime(result);
      if (participation.length !== 0) {
        participation = participation[0];
        for (let i = 0; i < allQuestions.length; i++) {
          let maxScore = 0;
          for (let j = 0; j < participation.submissionResults.length; j++) {
            if (
              participation.submissionResults[j].questionId === allQuestions[i]
            ) {
              if (maxScore < participation.submissionResults[j].score) {
                maxScore = participation.submissionResults[j].score;
              }
            }
          }
          scores[i] = maxScore;
        }
        for (let i = 0; i < allQuestions.length; i++) {
          finalScores[allQuestions[i]] = {
            questionId: allQuestions[i],
            score: scores[i],
          };
          if (scores[i] === 100) {
            finalScores[allQuestions[i]].color = "green";
          } else if (score[i] === 50) {
            finalScores[allQuestions[i]].color = "orange";
          } else if (scores[i] === 25) {
            finalScores[allQuestions[i]].color = "red";
          } else {
            finalScores[allQuestions[i]].color = "black";
          }
        }
      } else {
        for (let i = 0; i < allQuestions.length; i++) {
          finalScores[allQuestions[i]] = {
            questionId: allQuestions[i],
            score: 0,
            color: "black",
          };
        }
      }
      res.send(finalScores);
    } catch (error) {
      res.status(404).send({ message: error.message });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

app.get("/getSolvedCount", middleware.checkTokenAdmin, async (req, res) => {
  let users = await User.find();
  let userCollection = {};
  for (const user of users) {
    userCollection[user.username] = 0;
  }

  let userParticipations = await Participation.find();
  let tutorialParticipations = await ParticipationTut.find();
  userParticipations = userParticipations.concat(tutorialParticipations);

  for (const uPart of userParticipations) {
    let incVal = 0;
    for (const submission of uPart.submissionResults) {
      if (submission.score === 100) {
        incVal = incVal + 1;
      }
    }
    if (uPart.username in userCollection) {
      userCollection[uPart.username] += incVal;
    }
  }
  res.send(userCollection);
});

// schedule.scheduleJob("* * * * *", async function () {
//   let skillUpStatus = await skillUp.updateAll();
//   console.log(skillUpStatus);
// });

app.listen(port, () => console.log("Server @ port", port));
