let middleware = require("../util/middleware.js");

module.exports = (app) => {
    const questions = require("../controllers/question.controller.js");

    // Create a new question
    app.post("/questions", middleware.checkTokenAdmin, questions.create);

    // Create a new question
    app.post(
        "/questionsExcel",
        middleware.checkTokenAdmin,
        questions.createExcel
    );

    // Retrieve all questions
    app.get("/questions", middleware.checkTokenAdmin, questions.getAllQuestions);

    // Retrieve a single question with questionId
    app.get("/questions/:questionId", middleware.checkToken, questions.findOneQuestion);

    // Retrieve all questions with contestId and create/update Participation
    app.post(
        "/questions/contest/:contestId",
        middleware.checkToken,
        questions.getAllQuestionsRelatedToContest
    );

    //Delete multiple questions
    app.post(
        "/deletequestions/multiple/:questionIds",
        middleware.checkTokenAdmin,
        questions.deleteMultiple
    );

    // Update a question with questionId
    app.post("/questions/:questionId", middleware.checkTokenAdmin, questions.updateQuestion);

    // Delete a question with questionId
    app.delete(
        "/questions/:questionId",
        middleware.checkTokenAdmin,
        questions.deleteQuestion
    );
};
