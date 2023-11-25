const Tag = require("../models/tag.model.js");

const responseUtil = require("../services/responseUtil.js");

exports.initiateTags = async (req, res) => {
    try {
        const tags = await Tag.findOne();
        if (!tags) {
            const topicTags = [
                "Sorting",
                "Bit Manipulation",
                "Searching",
                "Greedy Algorithms",
                "Dynamic Programming",
                "Graph Theory",
                "Data Structures",
                "Algorithms",
                "Arrays",
                "Linked Lists",
                "Stacks",
                "Queues",
                "Hash Tables",
                "Trees",
                "Graphs",
                "Tries",
                "Heaps",
                "Disjoint Sets",
                "Bubble Sort",
                "Selection Sort",
                "Insertion Sort",
                "Merge Sort",
                "Quicksort",
                "Heap Sort",
                "Binary Search",
                "Floyd-Warshall Algorithm",
                "Dijkstra's Algorithm",
                "Bellman-Ford Algorithm",
                "Kruskal's Algorithm",
                "Prim's Algorithm",
            ];
    
            const companyTags = [
                "Apple",
                "Microsoft",
                "Amazon",
                "Google",
                "Facebook",
                "Tesla",
                "Netflix",
                "Oracle",
                "IBM",
                "Samsung",
                "Adobe",
                "Siemens",
                "Huawei",
                "Nvidia",
                "VMware",
                "SAP",
                "Intel",
                "PayPal",
                "Airbnb",
            ];
    
            const tag = new Tag({
                companyTags: companyTags,
                topicTags: topicTags
            });
            tag.save()
                .then((newTags) => {
                    return responseUtil.sendResponse(res,true,newTags,"Tags Created Successfully",201);
                })
        } else {
            return responseUtil.sendResponse(res,true,tags,"Tags are already created!",200);
        }
    } catch(error) {
        return responseUtil.sendResponse(res,false,null,"Error while fetching tags",400);
    }
};

exports.updateTags = async(req, res) => {
    const tag = await Tag.findOne();
    if (!tag) {
        return responseUtil.sendResponse(res,false,null,"Tags are not initiated",500);
    }
    const topicTags = req.body.topicTags;
    const companyTags = req.body.companyTags;
    const mcqSubjects = req.body.mcqSubjects;

    const currentTopicTags = tag.topicTags;
    const currentCompanyTags = tag.companyTags;
    const currentMCQSubjects = tag.mcqSubjects;

    const newTopicTags = currentTopicTags;
    const newCompanyTags = currentCompanyTags;
    const newMCQSubjects = currentMCQSubjects;

    for (const tag of topicTags) {
        if (!currentTopicTags.includes(tag)) {
            newTopicTags.push(tag);
        }
    }

    for (const tag of companyTags) {
        if (!currentCompanyTags.includes(tag)) {
            newCompanyTags.push(tag);
        }
    }

    for (const [key, value] of Object.entries(mcqSubjects)) {
        if(currentMCQSubjects[key] === undefined) {
            newMCQSubjects[key] = value;
        } else {
            for(const topic of value) {
                if (!currentMCQSubjects[key].includes(topic)) {
                    newMCQSubjects[key].push(topic);
                }
            }
        }
    }

    tag.topicTags = newTopicTags;
    tag.companyTags = newCompanyTags;
    tag.mcqSubjects = newMCQSubjects

    const updatedTags = await tag.save();
    return responseUtil.sendResponse(res,true,updatedTags,"Tags updated successfully",200);

};