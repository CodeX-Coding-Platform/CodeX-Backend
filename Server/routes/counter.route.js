let middleware = require("../util/middleware.js");

module.exports = (app) => {
  let counterController = require("../controllers/counter.controller.js");

  app.get(
    "/counter",
    middleware.checkTokenAdmin,
    counterController.createCounter
  );

  app.post(
    "/counter",
    middleware.checkTokenAdmin,
    counterController.updateCounter
  );

  //Counter Update for Leaderboard

  app.get("/skillCounter", counterController.skillCounter);
};
