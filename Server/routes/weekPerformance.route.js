let middleware = require("../util/middleware.js");

module.exports = (app) => {
  const weekPerformance = require("../controllers/weekPerformance.controller.js");

  //Create a weekPerformance
  app.post(
    "/weekPerformance",
    middleware.checkTokenAdmin,
    weekPerformance.create
  );

  //Find All Weeks
  app.get("/weekPerformance", middleware.checkToken, weekPerformance.findAll);
};
