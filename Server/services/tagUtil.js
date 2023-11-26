const Tag = require("../models/tag.model.js");

const pushSubjectAndTopic = async (updates) => {
    const updatedTag = await Tag.updateMany(
        {},
        { 
            $set:
            {
                mcqSubjects: updates
            } 
        },
        { new: true }
    );
    return updatedTag;
}

module.exports = {
    pushSubjectAndTopic
}