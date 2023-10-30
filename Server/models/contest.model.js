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
  visibility: { type: Boolean, default: false },
});

module.exports = mongoose.model("Contest", contestSchema);
