let middleware = require("../util/middleware.js");

module.exports = (app) => {
  const skillUp = require("../controllers/skillUp.controller.js");
  // Create a new skillUp
  app.post("/skillUp", middleware.checkToken, skillUp.create);

  //Update All SkillUps
  app.get("/skillUp/update", skillUp.updateAll);

  //Get a single skillUp
  app.get("/skillUp/:rollNumber", middleware.checkToken, skillUp.findOne);

  // Get All SkillUps
  app.get("/skillUps", middleware.checkToken, skillUp.findAll);

  // Delete a SkillUp
  app.delete("/skillUp", middleware.checkToken, skillUp.delete);
};
