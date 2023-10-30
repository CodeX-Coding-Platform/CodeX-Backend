let middleware = require("../util/middleware.js");

module.exports = (app) => {
  const users = require("../controllers/user.controller.js");

  // Create a new user
  app.post("/signup", users.create);

  // Retrieve all users
  app.get("/admin/users", middleware.checkTokenAdmin, users.findAll);

  // Retrieve a single user with userId
  app.get("/admin/users/:username", middleware.checkTokenAdmin, users.findOne);

  // Retrieve a single user with userId public
  app.get("/user/:username", users.findOnePublic);

  // Retrieve a single user with userId public
  app.get("/users/branch/:username", users.findBranch);

  app.get("/generateSecret", middleware.checkToken, users.generateSecret);
  // Login Route
  app.post("/login", users.checkPass);

  // Verify Route
  app.post("/verify", users.checkToken);

  // // Update a user with userId
  // app.put('/users', middleware.checkTokenAdmin, users.update);

  // Update user info
  app.put("/users/:username", middleware.checkToken, users.updateOne);

  // Delete a user with userId
  app.delete("/users/:username", middleware.checkTokenAdmin, users.delete);

  // Delete Multiple users
  app.post(
    "/users/delete/multiple",
    middleware.checkTokenAdmin,
    users.deleteMultiple
  );

  app.post("/admin/makeVerify/", middleware.checkTokenAdmin, users.makeVerify);
  // Forgot Password
  app.post("/forgotPass", users.forgotPass);

  // Update Password
  app.post("/updatePassword", users.updatePassword);

  //Find All Usernames (Leaderboards)
  app.get("/users/all", middleware.checkToken, users.findAllUsernames);
};
