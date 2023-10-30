const Counter = require("../models/counter.model.js");

exports.createCounter = async (req, res) => {
  Counter.findOne()
    .then((counter) => {
      if (!counter) {
        const counter = new Counter({
          questionCount: 0,
          contestCount: 0,
          weekCount: 0,
          skillCount: new Date(),
        });
        counter
          .save()
          .then((data) => {
            return res.status(200).send({
              success: true,
              message: "Counters Created Successfully",
              countersData: data,
            });
          })
          .catch((error) => {
            return res.status(500).send({
              success: false,
              message: "Counters Creation failed with error " + error.message,
            });
          });
      } else {
        return res.status(200).send({
          success: true,
          message: "Counters already exist",
          countersData: counter,
        });
      }
    })
    .catch((error) => {
      return res.status(500).send({
        success: false,
        message: "Counters Creation failed with error " + error.message,
      });
    });
};

exports.updateCounter = async (req, res) => {
  const counter = await Counter.findOne();
  if (!counter) {
    return res.status(404).send({
      success: false,
      message: "Counters do not exist",
    });
  } else {
    const { questionCount, contestCount, weekCount, skillCount } = req.body;
    counter.questionCount = questionCount;
    counter.contestCount = contestCount;
    counter.weekCount = weekCount;
    counter.skillCount = skillCount;
    const updatedCounter = await counter.save();
    return res.status(200).send({
      success: true,
      message: "Counters updated successfully",
      countersData: updatedCounter,
    });
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
