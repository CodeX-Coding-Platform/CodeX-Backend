let middleware = require("../util/middleware.js");

module.exports = (app) => {
  let counterController = require("../controllers/counter.controller.js");

  app.get(
    "/counters",
    middleware.checkTokenAdmin,
    counterController.createCounter
  );

  app.post(
    "/counters",
    middleware.checkTokenAdmin,
    counterController.updateCounter
  );

  //Counter Update for Leaderboard

  app.get("/skillCounter", counterController.skillCounter);
};
