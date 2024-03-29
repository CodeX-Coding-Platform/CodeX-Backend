const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var questionSchema = new Schema({
    questionId: String,
    questionName: String,
    questionDescriptionText: String,
    questionInputText: String,
    questionOutputText: String,
    questionExampleInput1: String,
    questionExampleOutput1: String,
    questionExampleInput2: String,
    questionExampleOutput2: String,
    questionExampleInput3: String,
    questionExampleOutput3: String,
    questionHiddenInput1: String,
    questionHiddenInput2: String,
    questionHiddenInput3: String,
    questionHiddenOutput1: String,
    questionHiddenOutput2: String,
    questionHiddenOutput3: String,
    questionExplanation: String,
    author: String,
    editorial: String,
    difficulty: {
        type: String,
        default: "Medium",
    },
    company: Array,
    topic: Array,
    //mcq attributes
    isMcq : {
        type: Boolean,
        default: false,
    },
    options : Array,
    correctOption: String,
    mcqImage : String,
    mcqTopic : String,
    mcqSubject : String
});

module.exports = mongoose.model("Question", questionSchema);