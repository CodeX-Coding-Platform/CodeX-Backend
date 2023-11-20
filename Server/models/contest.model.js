// MONGOOSE SCHEMA
const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var contestSchema = new Schema({
  contestId: String,
  contestName: String,
  contestDate: String,
  contestDuration: String,
  contestStartTime: String,
  contestEndTime: String,
  isManual : Boolean,
  isMultipleSet : Boolean,
  sets: Array,
  questionsList : Array,
  sections : Array,
  contestPassword: String,
  visibility: { type: Boolean, default: true },
  //mcq
  isMcqContest : Boolean,
  mcqSubjects : Array,
  mcqTopics : Array,
  difficultyDistribution : Object
});

module.exports = mongoose.model("Contest", contestSchema);
