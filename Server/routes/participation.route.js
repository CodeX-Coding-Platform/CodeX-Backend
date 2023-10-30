let middleware = require("../util/middleware.js");

module.exports = (app) => {
  const participation = require("../controllers/participation.controller.js");

  // Create a new participation
  app.post("/participations", middleware.checkToken, participation.create);

  // Retrieve all participations
  app.get("/participations", middleware.checkTokenAdmin, participation.findAll);

  // Retrieve all participations for users in a contest
  app.get(
    "/participations/:contestId/:username",
    middleware.checkToken,
    participation.findUser
  );

  // Participations length of the user
  app.get("/findAllContestsUser", participation.findAllContestsUser);

  // Retrieve all participations per contestId in body
  app.post(
    "/participations/all",
    middleware.checkToken,
    participation.findContestPart
  );

  //To end a contest
  app.post("/endContest", middleware.checkToken, participation.endContest);

  //Extend Time
  app.post(
    "/changeValidTime",
    middleware.checkTokenAdmin,
    participation.changeValidTime
  );

  app.get(
    "/getPartTime/:participationId",
    middleware.checkToken,
    participation.findUserPartTime
  );
};
