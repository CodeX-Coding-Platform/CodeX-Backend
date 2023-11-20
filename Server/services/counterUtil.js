const Counter = require("../models/counter.model.js");

const pushTopic = async(updates) => {
    const updatedCounter = await Counter.updateMany(
        {},
        { 
            $set:
            {
                subjectCount: updates
            } 
        },
        { new: true }
    );
    return updatedCounter;
}

module.exports = {
    pushTopic
}