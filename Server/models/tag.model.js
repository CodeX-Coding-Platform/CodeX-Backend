// MONGOOSE SCHEMA
const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var tagSchema = new Schema({
    companyTags : Array,
    topicTags : Array,
    mcqSubjects : Object
});

module.exports = mongoose.model("Tag", tagSchema);