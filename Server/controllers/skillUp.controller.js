const SkillUp = require("../models/skillUp.model.js");
const Participation = require("../models/participation.model.js");
const calcHelper = require("../services/calcCodingScore.js");

const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config({ path: "../util/config.env" });

let skillUpLambda = process.env.skillUpLambda;

exports.create = async (req, res) => {
  try {
    const promises = [
      axios.get(
        skillUpLambda + `leetcode?username=` + req.body.leetCodeId.toLowerCase()
      ),
      axios.get(
        skillUpLambda + `codechef?username=` + req.body.codeChefId.toLowerCase()
      ),
      axios.get(
        skillUpLambda +
          `codeforces?username=` +
          req.body.codeForcesId.toLowerCase()
      ),
      axios.get(
        skillUpLambda +
          `geeksforgeeks?username=` +
          req.body.geeksForGeeksId.toLowerCase()
      ),
      axios.get(
        skillUpLambda + `spoj?username=` + req.body.spojId.toLowerCase()
      ),
      axios.get(
        skillUpLambda +
          `interviewbit?username=` +
          req.body.interviewBitId.toLowerCase()
      ),
      await Participation.find({ username: req.body.rollNumber.toLowerCase() }),
    ];
    var totalScore = 0;
    const scoreMap = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
    };
    const scoreFunctions = {
      1: calcHelper.calcLeetCodeScore,
      2: calcHelper.calcCodeChefScore,
      3: calcHelper.calcCodeForcesScore,
      4: calcHelper.calcGeeksForGeeksScore,
      5: calcHelper.calcSpojScore,
      6: calcHelper.calcInterviewBitScore,
      7: calcHelper.calcKLHCodeScore,
    };
    const results = await Promise.allSettled(promises);
    var index = 1;
    for (const result of results) {
      if (result.status === "fulfilled") {
        const responseData =
          result.value.data !== undefined ? result.value.data : result.value;
        const helperFunction = scoreFunctions[index];
        scoreMap[index] = helperFunction(responseData);
      }
      index += 1;
    }
    totalScore += Object.values(scoreMap).reduce((accumulator, value) => {
      return !isNaN(value) ? accumulator + value : accumulator + 0;
    }, 0);

    const skillUp = await SkillUp.findOne({
      rollNumber: req.body.rollNumber.toLowerCase(),
    });
    if (skillUp) {
      skillUp.leetCodeScore = !isNaN(scoreMap[1]) ? scoreMap[1] : -1;
      skillUp.leetCodeId = req.body.leetCodeId.toLowerCase();
      skillUp.codeChefScore = !isNaN(scoreMap[2]) ? scoreMap[2] : -1;
      skillUp.codeChefId = req.body.codeChefId.toLowerCase();
      skillUp.codeForcesScore = !isNaN(scoreMap[3]) ? scoreMap[3] : -1;
      skillUp.codeForcesId = req.body.codeForcesId.toLowerCase();
      skillUp.geeksForGeeksScore = !isNaN(scoreMap[4]) ? scoreMap[4] : -1;
      skillUp.geeksForGeeksId = req.body.geeksForGeeksId.toLowerCase();
      skillUp.spojScore = !isNaN(scoreMap[5]) ? scoreMap[5] : -1;
      skillUp.spojId = req.body.spojId.toLowerCase();
      skillUp.interviewBitScore = !isNaN(scoreMap[6]) ? scoreMap[6] : -1;
      skillUp.interviewBitId = req.body.interviewBitId.toLowerCase();
      skillUp.klhCodeScore = !isNaN(scoreMap[7]) ? scoreMap[7] : -1;
      skillUp.totalScore = totalScore;
      try {
        await skillUp.save();
        return res.status(200).send({
          success: true,
          message: "SkillUp Updated Successfully",
          data: skillUp,
        });
      } catch (err) {
        res.status(500).send({
          success: false,
          message: "SkillUp Updating Failed due to " + err.message,
        });
      }
    } else {
      const skillUpNew = new SkillUp({
        rollNumber: req.body.rollNumber.toLowerCase(),
        leetCodeScore: !isNaN(scoreMap[1]) ? scoreMap[1] : -1,
        leetCodeId: req.body.leetCodeId.toLowerCase(),
        codeChefScore: !isNaN(scoreMap[2]) ? scoreMap[2] : -1,
        codeChefId: req.body.codeChefId.toLowerCase(),
        codeForcesScore: !isNaN(scoreMap[3]) ? scoreMap[3] : -1,
        codeForcesId: req.body.codeForcesId.toLowerCase(),
        interviewBitScore: !isNaN(scoreMap[6]) ? scoreMap[4] : -1,
        interviewBitId: req.body.interviewBitId.toLowerCase(),
        spojScore: !isNaN(scoreMap[5]) ? scoreMap[5] : -1,
        spojId: req.body.spojId.toLowerCase(),
        geeksForGeeksScore: !isNaN(scoreMap[4]) ? scoreMap[6] : -1,
        geeksForGeeksId: req.body.geeksForGeeksId.toLowerCase(),
        klhCodeScore: !isNaN(scoreMap[7]) ? scoreMap[7] : -1,
        totalScore: totalScore,
      });
      try {
        await skillUpNew.save();
        return res.status(200).send({
          success: true,
          message: "SkillUp Created Successfully",
          data: skillUpNew,
        });
      } catch (err) {
        res.status(500).send({
          success: false,
          message: "SkillUp Created Failed due to " + err.message,
        });
      }
    }
  } catch (err) {
    res.send({
      success: false,
      message:
        "This error occurred while creating/updating the skillUp Profile. " +
        err.message,
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const skillUp = await SkillUp.findOne({
      rollNumber: req.params.rollNumber.toLowerCase(),
    });
    if (!skillUp) {
      return res.status(200).send({
        success: false,
        message:
          "skillUp does not exist with rollNumber " + req.params.rollNumber,
      });
    }
    return res.status(200).send({
      success: true,
      message: "skillUp for rollNumber " + req.params.rollNumber,
      data: skillUp,
    });
  } catch (err) {
    return res.status(400).send({
      success: false,
      message:
        "Error fetching skillUp with rollNumber " +
        req.params.rollNumber +
        " with error " +
        err.message,
    });
  }
};
exports.findAll = async (req, res) => {
  try {
    const skillUps = await SkillUp.find().sort({ totalScore: -1 });
    if (skillUps) {
      return res.status(200).send({
        success: true,
        data: skillUps,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Fetching skillUps failed or no skillUps are present",
      });
    }
  } catch (err) {
    return res.status(400).send({
      success: false,
      message: "Fetching skillUps failed due to " + err.message,
    });
  }
};

exports.updateAll = async (req, res) => {
  try {
    const skillUps = await SkillUp.find();
    const scoreFunctions = {
      1: calcHelper.calcLeetCodeScore,
      2: calcHelper.calcCodeChefScore,
      3: calcHelper.calcCodeForcesScore,
      4: calcHelper.calcGeeksForGeeksScore,
      5: calcHelper.calcSpojScore,
      6: calcHelper.calcInterviewBitScore,
      7: calcHelper.calcKLHCodeScore,
    };
    skillUps.forEach(async (skillUp) => {
      const promises = [
        axios.get(skillUpLambda + `leetcode?username=` + skillUp.leetCodeId),
        axios.get(skillUpLambda + `codechef?username=` + skillUp.codeChefId),
        axios.get(
          skillUpLambda + `codeforces?username=` + skillUp.codeForcesId
        ),
        axios.get(
          skillUpLambda + `geeksforgeeks?username=` + skillUp.geeksForGeeksId
        ),
        axios.get(skillUpLambda + `spoj?username=` + skillUp.spojId),
        axios.get(
          skillUpLambda + `interviewbit?username=` + skillUp.interviewBitId
        ),
        await Participation.find({
          username: skillUp.rollNumber.toLowerCase(),
        }),
      ];
      //oka saari route trigger cheo
      //robo 3t lo change chei chaalu
      console.log("here");
      var totalScore = 0;
      const scoreMap = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
      };
      const results = await Promise.allSettled(promises);
      var index = 1;
      for (const result of results) {
        if (result.status === "fulfilled") {
          const responseData =
            result.value.data !== undefined ? result.value.data : result.value;
          const helperFunction = scoreFunctions[index];
          scoreMap[index] = helperFunction(responseData);
        }
        index += 1;
      }
      totalScore += Object.values(scoreMap).reduce((accumulator, value) => {
        return !isNaN(value) ? accumulator + value : accumulator + 0;
      }, 0);
      skillUp.leetCodeScore = !isNaN(scoreMap[1]) ? scoreMap[1] : -1;
      skillUp.leetCodeId = skillUp.leetCodeId;
      skillUp.codeChefScore = !isNaN(scoreMap[2]) ? scoreMap[2] : -1;
      skillUp.codeChefId = skillUp.codeChefId;
      skillUp.codeForcesScore = !isNaN(scoreMap[3]) ? scoreMap[3] : -1;
      skillUp.codeForcesId = skillUp.codeForcesId;
      skillUp.geeksForGeeksScore = !isNaN(scoreMap[4]) ? scoreMap[4] : -1;
      skillUp.geeksForGeeksId = skillUp.geeksForGeeksId;
      skillUp.spojScore = !isNaN(scoreMap[5]) ? scoreMap[5] : -1;
      skillUp.spojId = skillUp.spojId;
      skillUp.interviewBitScore = !isNaN(scoreMap[6]) ? scoreMap[6] : -1;
      skillUp.interviewBitId = skillUp.interviewBitId;
      skillUp.klhCodeScore = !isNaN(scoreMap[7]) ? scoreMap[7] : -1;
      skillUp.totalScore = totalScore;
      try {
        await skillUp.save();
      } catch (err) {
        res.status(500).send({
          success: false,
          message: "SkillUp Updating Failed due to " + err.message,
        });
      }
    });
    return res.status(200).send({
      success: true,
      message: "All SkillUps Updated Successfully",
    });
  } catch (err) {
    res.send({
      success: false,
      message:
        "This error occurred while updating the skillUp Profiles. " +
        err.message,
    });
  }
};

exports.delete = async (req, res) => {
  const skillUp = await SkillUpModel.findOne({
    rollNUmber: req.body.rollNumber.toLowerCase(),
  });

  if (!skillUp) {
    return res.status(400).send({
      success: false,
      message: "SkillUp not found",
    });
  } else {
    await skillUp.remove();
    res.status(200).send({
      success: true,
      message: "SkillUp deleted successfully",
    });
  }
};
