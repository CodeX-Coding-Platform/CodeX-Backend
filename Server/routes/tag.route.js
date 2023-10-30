let middleware = require("../util/middleware.js");

module.exports = (app) => {
    let tagController = require("../controllers/tag.controller.js");
    app.get('/tags',middleware.checkTokenAdmin,tagController.initiateTags);

    app.post("/tags",middleware.checkTokenAdmin,tagController.updateTags);

};