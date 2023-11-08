let middleware = require("../util/middleware.js");

module.exports = (app) => {
    const questions = require("../controllers/question.controller.js");

    // Create a new question
    app.post("/question", middleware.checkTokenAdmin, questions.create);

    // Create a new question Excel
    app.post(
        "/questionsExcel",
        middleware.checkTokenAdmin,
        questions.createExcel
    );

    // Retrieve all questions
    app.get("/questions", middleware.checkTokenAdmin, questions.getAllQuestions);

    // Retrieve a single question with questionId
    app.get("/question/:questionId", middleware.checkToken, questions.findOneQuestion);

    // Update a question with questionId
    app.put("/question/:questionId", middleware.checkTokenAdmin, questions.updateQuestion);

    // Delete a question with questionId
    app.delete(
        "/question/:questionId",
        middleware.checkTokenAdmin,
        questions.deleteQuestion
    );

    // Retrieve all questions with contestId and create/update Participation
    app.post(
        "/questions/contest/:contestId",
        middleware.checkToken,
        questions.getAllQuestionsRelatedToContest
    );

    //Delete multiple questions
    app.post(
        "/questions/delete",
        middleware.checkTokenAdmin,
        questions.deleteMultiple
    );
};
