const WeekPerformance = require("../models/weekPerformance.model.js");
const Counter = require("../models/counter.model.js");
const SkillUp = require("../models/skillUp.model.js");
const Participation = require("../models/participation.model.js");
const CalcHelper = require("../services/calcCodingScore.js");

const xlsx = require("xlsx");

async function generateCodeChefMap() {
  try {
    var codeChefIdMap = new Map();
    const skillUps = await SkillUp.find({}, { codeChefId: 1, rollNumber: 1 });
    skillUps.forEach((skillUp) => {
      codeChefIdMap.set(skillUp.codeChefId, skillUp.rollNumber);
    });
    return codeChefIdMap;
  } catch (err) {
    return null;
  }
}

async function csvScores(req, fileType, rollNumbers) {
  try {
    if (req.files[fileType]) {
      var file = req.files[fileType];
      var name = file.name;
      var uploadPath = "../" + fileType + "xlsx" + name;
      try {
        const fileUploadStatus = await file.mv(uploadPath);
        const codeChefFlag =
          fileType === "codeChefScoreFile" ||
          fileType === "codeChefProblemScoreFile";
        let wb = xlsx.readFile(uploadPath);
        let ws = wb.Sheets["Sheet1"];
        let data = xlsx.utils.sheet_to_json(ws);
        var codeChefIdMap = new Map();
        if (codeChefFlag) {
          codeChefIdMap = await generateCodeChefMap();
        }
        var scoresMap = new Map();

        for (let i = 0; i < data.length; i++) {
          const rollNumber = codeChefFlag
            ? codeChefIdMap.get(data[i].codeChefId)
            : data[i].rollNumber.toLowerCase();
          if (rollNumber === undefined) {
            continue;
          }
          const score = data[i].score;
          rollNumbers.push(rollNumber);
          scoresMap.set(rollNumber, score);
        }
        return scoresMap;
      } catch (err) {
        return null;
      }
    }
  } catch (err) {
    return null;
  }
}

exports.create = async (req, res) => {
  try {
    const counter = await Counter.findOne();
    if (!counter) {
      return res.send({
        success: false,
        message: "Counters do not Exists, Please create counters",
      });
    }
    const weekNo = Number(counter.weekCount) + 1;
    const klhContestId = req.body.klhContestId;
    var rollNumbers = [];
    const vivaScoreMap = req.files.vivaScoreFile
      ? await csvScores(req, "vivaScoreFile", rollNumbers)
      : new Map();
    const codeChefScoreMap = req.files.codeChefScoreFile
      ? await csvScores(req, "codeChefScoreFile", rollNumbers)
      : new Map();
    const codeChefProblemScoreMap = req.files.codeChefProblemScoreFile
      ? await csvScores(req, "codeChefProblemScoreFile", rollNumbers)
      : new Map();
    var rollNumbersSet = new Set(rollNumbers);
    const klhCodeScoreMap = new Map();
    counter.weekCount = Number(counter.weekCount) + 1;
    const updatedCounter = await counter.save();
    for (const rollNumber of rollNumbersSet) {
      if (rollNumber !== undefined) {
        const participation = await Participation.find({
          participationId: rollNumber + klhContestId,
        });
        const klhCodeScore = CalcHelper.calcKLHCodeScore(participation, true);
        klhCodeScoreMap.set(rollNumber, klhCodeScore);
      }
    }
    try {
      const weekPerf = new WeekPerformance({
        weekNo: +Number(weekNo),
        vivaScoreMap: vivaScoreMap,
        codeChefScoreMap: codeChefScoreMap,
        codeChefProblemScoreMap: codeChefProblemScoreMap,
        klhCodeScoreMap: klhCodeScoreMap,
      });
      const weekPerformancePersist = await weekPerf.save();
      res.status(200).send({
        message: "Successfully updated all week performances",
        data: weekPerformancePersist,
      });
    } catch (err) {
      res.status(500).send({
        message:
          "Error Occurred while persisting week performance " +
          weekNo +
          " " +
          err.message,
      });
    }
  } catch (err) {
    return res.send({
      success: false,
      message:
        "Error while fetching counters in weekPerformance " + err.message,
    });
  }
};

exports.findAll = async (req, res) => {
  WeekPerformance.find()
    .then((weeks) => {
      res.send(weeks);
    })
    .catch((err) => {
      res.send([]);
    });
};
