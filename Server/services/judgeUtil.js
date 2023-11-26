const questionUtil = require("./questionUtil");
const participationUtil = require("./participationUtil");
const submissionUtil = require("./submissionUtil");

const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config({ path: "../Server/util/config.env" });

const apiAddress = process.env.localAPI;
const postUrl = apiAddress + "/submissions";
var retryCount = process.env.retryCount || 30;
const waitTime = process.env.waitTime || 1000;

const getSubmissionStatus = async (options) => {
    try {
        const response = await axios(options);
        return response;
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

const runSubmission = async (data) => {
    const options = {
        method: "post",
        data: {
            source_code: (data.sourceCode),
            language_id: data.languageId,
            stdin: data.input,
        },
        url: postUrl+"?base64_encoded=true",
    }

    const token = await getSubmissionToken(options);
    const timedOutResponse = {
        "stdout": null,
        "time": null,
        "memory": null,
        "stderr": "Response Timed Out",
        "token": null,
        "compile_output": null,
        "message": null,
        "status": {
            "description": "Timed Out, Please run your submission after some time"
        }
    }
    try {
        const statusOption = {
            url: apiAddress + "/submissions/" + token + "?base64_encoded=true",
            method: "get",
        }
        var statusResponse = await getSubmissionStatus(statusOption);
        while ((statusResponse.data.status.description === "In Queue" || statusResponse.data.status.description === "Processing") && retryCount > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            statusResponse = await getSubmissionStatus(statusOption);
            retryCount--;
        }
        if (retryCount === 0) {
            return timedOutResponse;
        }
        statusResponse.data.retryCount = retryCount;
        return statusResponse.data;
    }
    catch (error) {
        throw error;
    }
}

const sendRequestsToJudge = async (testcases, data) => {

    if (data.isRun) {
        const submission = await runSubmission(data);
        return submission;
    }

    // Create the request options for each testcase
    const options = [
        {
            method: "post",
            data: {
                source_code: data.sourceCode,
                language_id: data.languageId,
                stdin: testcases.HI1,
                expected_output: testcases.HO1,
            },
            url: postUrl,
        },
        {
            method: "post",
            data: {
                source_code: data.sourceCode,
                language_id: data.languageId,
                stdin: testcases.HI2,
                expected_output: testcases.HO2,
            },
            url: postUrl,
        },
        {
            method: "post",
            data: {
                source_code: data.sourceCode,
                language_id: data.languageId,
                stdin: testcases.HI3,
                expected_output: testcases.HO3,
            },
            url: postUrl,
        },
    ];

    const tokens = await Promise.all(options.map(async (option) => await getSubmissionToken(option)));

    if (!tokens.every(Boolean)) {
        throw new Error("Result token missing!");
    }

    const statusOptions = tokens.map((token) => ({
        url: apiAddress + "/submissions/" + token,
        method: "get",
    }));

    let results = [];
    while (retryCount > 0) {
        results = await Promise.all(statusOptions.map(async (option) => await getSubmissionStatus(option)));

        if (results.every((result) => result.data.status.description !== "In Queue" && result.data.status.description !== "Processing")) {
            break;
        }

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        retryCount--;
    }

    if (retryCount === 0) {
        throw new Error("API retry limit exceeded!");
    }

    // Calculate the score
    var score = 0;
    const correctSubmission = Number(results.filter((result) => result.data.status.description === "Accepted").length);
    switch (correctSubmission) {
        case 1:
            score = 25;
            break;
        case 2:
            score = 50;
            break;
        case 3:
            score = 100;
            break;
        default:
            score = 0;
    }
    data.score = score;
    data.submissionTokens = tokens
    data.participationId = data.username + data.contestId;
    data.retryCount = retryCount;
    // Update the participation score
    const participation = await participationUtil.modifyScore(data);
    return data;
};

module.exports = {
    sendRequestsToJudge
}