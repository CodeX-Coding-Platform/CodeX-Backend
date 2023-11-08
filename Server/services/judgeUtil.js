const questionUtil = require("./questionUtil");
const participationUtil = require("./participationUtil");
const submissionUtil = require("./submissionUtil");

const dotenv = require("dotenv");

dotenv.config({ path: "../Server/util/config.env" });

const apiAddress = process.env.apiAddress;

const getSubmissionStatus = async (options) => {
    try {
        const response = await axios(options);
        return response.data.status.description;
    } catch (error) {
        throw error;
    }
};
const getSubmissionToken = async (options) => {
    try {
        const response = await axios(options);
        return response.data.token;
    } catch (error) {
        throw error;
    }
};

const singleRequestToJudge = async(testcases, data, isAdmin) => {
    
}

const sendRequestsToJudge = async (testcases, data, isAdmin) => {
    // Get the submission URL
    const postUrl = apiAddress + "/submissions";

    // Create the request options for each testcase
    const options = [
        {
            method: "post",
            data: {
                source_code: data.source_code,
                language_id: data.language_id,
                stdin: testcases.HI1,
                expected_output: testcases.HO1,
            },
            url: postUrl,
        },
        {
            method: "post",
            data: {
                source_code: data.source_code,
                language_id: data.language_id,
                stdin: testcases.HI2,
                expected_output: testcases.HO2,
            },
            url: postUrl,
        },
        {
            method: "post",
            data: {
                source_code: data.source_code,
                language_id: data.language_id,
                stdin: testcases.HI3,
                expected_output: testcases.HO3,
            },
            url: postUrl,
        },
    ];

    // Get the submission tokens
    const tokens = await Promise.all(options.map(async (option) => await getSubmissionToken(option)));

    // Check if all the submission tokens were successfully obtained
    if (!tokens.every(Boolean)) {
        throw new Error("Result token missing!");
    }

    // Create the request options for getting the submission status
    const statusOptions = tokens.map((token) => ({
        url: apiAddress + "/submissions/" + token,
        method: "get",
    }));

    // Get the submission results
    const results = await Promise.all(statusOptions.map(async (option) => await getSubmissionStatus(option)));

    // Calculate the score
    const score = results.filter((result) => result === "Accepted").length;

    // Update the participation score
    const participation = await participationUtil.modifyScore({
        participationId: data.username + data.contestId,
        score,
    });

    return participation;
    
};

module.exports = {
    sendRequestsToJudge
}