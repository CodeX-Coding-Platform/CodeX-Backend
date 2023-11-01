const Tag = require("../models/tag.model.js");

exports.initiateTags = async (req, res) => {
    const tag = await Tag.findOne();
    if (!tag) {
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
            .then((tags) => {
                return res.status(201).send({
                    success: true,
                    message: "Tags Created Successfully",
                    tagsData: tags
                })
            })
    } else {
        return res.status(500).send({
            success: true,
            message: "Tags are are already initiated",
        })
    }
};

exports.updateTags = async(req, res) => {
    const tag = await Tag.findOne();
    if (!tag) {
        return res.status(500).send({
            success: false,
            message: "Tags are not initiated",
        })
    }
    const topicTags = req.body.topicTags;
    const companyTags = req.body.companyTags;

    const currentTopicTags = tag.topicTags;
    const currentCompanyTags = tag.companyTags;

    const newTopicTags = currentTopicTags;
    const newCompanyTags = currentCompanyTags;

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

    tag.topicTags = newTopicTags;
    tag.companyTags = newCompanyTags;

    const updatedTags = await tag.save();

    return res.status(200).send({
        success: true,
        message: "Tags updated successfully",
        tagsData: updatedTags,
    });

};