const Counter = require("../models/counter.model.js");

const responseUtil = require("../services/responseUtil");

exports.createCounter = async (req, res) => {
  const counter = await Counter.findOne();
  if(!counter) {
    const counter = new Counter({
      questionCount: 0,
      contestCount: 0,
      weekCount: 0,
      skillCount: new Date(),
    });
    try {
      const newCounter = await counter.save();
      return responseUtil.sendResponse(res,true,newCounter,"Counters Created Successfully",200);
    } catch(error) {
      return responseUtil.sendResponse(res,false,null,"Counters could not be saved due to "+error.message,500);
    }
  }
  return responseUtil.sendResponse(res,true,counter,"Counters Already Exist!",200);
};

exports.updateCounter = async (req, res) => {
  const counter = await Counter.findOne();
  if (!counter) {
    return responseUtil.sendResponse(res,false,null,"Counters do not exist",400);
  } else {
    const { questionCount, contestCount, weekCount, skillCount } = req.body;
    counter.questionCount = questionCount;
    counter.contestCount = contestCount;
    counter.weekCount = weekCount;
    counter.skillCount = skillCount;
    try {
      const newCounter = await counter.save();
      return responseUtil.sendResponse(res,true,newCounter,"Counters Updated Successfully",200);
    } catch(error) {
      return responseUtil.sendResponse(res,false,null,"Counters could not be updated due to "+error.message,500);
    }
  }
};

exports.skillCounter = async (req, res) => {
  const counter = await Counter.findOne();
  let date = new Date().toDateString();
  if (!counter || counter.skillCount == date) {
    res.send(false);
  } else {
    counter.skillCount = date;
    await counter.save();
    res.send(true);
  }
};
