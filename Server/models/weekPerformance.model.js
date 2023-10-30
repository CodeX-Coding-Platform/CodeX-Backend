const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var weekPerformanceSchema = new Schema({
  weekNo: Number,
  vivaScoreMap: Map,
  codeChefScoreMap: Map,
  codeChefProblemScoreMap: Map,
  klhCodeScoreMap: Map,
  visibility: { type: Boolean, default: false },
});

module.exports = mongoose.model("WeekPerformance", weekPerformanceSchema);
