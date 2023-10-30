let middleware = require("../util/middleware.js");

module.exports = (app) => {
    const contests = require("../controllers/contest.controller.js");

    // Create a new contest
    app.post("/contest", middleware.checkTokenAdmin, contests.createContest);
    
    // Retrieve all contests
    app.get("/contests", middleware.checkToken, contests.getAllContests);

    // check if contest is active
    app.get("/contest/active/:contestId",middleware.checkToken, contests.activeContest);

    // Retrieve a single contest with contestId
    app.get("/contest/:contestId", middleware.checkToken, contests.findOneContest);

    // Update a contest with contestId
    app.put("/contest/:contestId", middleware.checkTokenAdmin, contests.updateContest);

    // Delete a contest with contestId
    app.delete("/contest/:contestId",middleware.checkTokenAdmin,contests.deleteContest);

    //check pass
    app.post("/checkContestPassword", middleware.checkToken, contests.checkContestPassword);
};
