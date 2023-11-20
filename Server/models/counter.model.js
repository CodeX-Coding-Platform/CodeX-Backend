const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var counterSchema = new Schema({
  questionCount: Number,
  contestCount: Number,
  mcqContestCount: Number,
  weekCount: Number,
  skillCount: String,
  mcqCount : Number,
  subjectCount : Object
});

module.exports = mongoose.model("Counter", counterSchema);
