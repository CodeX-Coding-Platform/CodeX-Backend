const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var counterSchema = new Schema({
  questionCount: Number,
  contestCount: Number,
  weekCount: Number,
  skillCount: String,
});

module.exports = mongoose.model("Counter", counterSchema);
