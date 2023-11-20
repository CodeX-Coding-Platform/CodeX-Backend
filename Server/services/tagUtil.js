const Tag = require("../models/tag.model.js");

const pushTopic = async (updates) => {
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
    pushTopic
}