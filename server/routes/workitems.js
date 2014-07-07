'use strict';

// Workitems routes use workitems controller
var workitems = require('../controllers/workitems');
var authorization = require('./middlewares/authorization');

// Workitem authorization helpers
var hasAuthorization = function(req, res, next) {
	if (req.workitem.user.id !== req.user.id) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

module.exports = function(app) {

    app.get('/workitems/:workitemId/childitems', authorization.requiresLogin, hasAuthorization, workitems.listChild);
    app.get('/workitems/root', authorization.requiresLogin, workitems.root);
    
    app.get('/workitems', authorization.requiresLogin, workitems.all);
    app.post('/workitems', authorization.requiresLogin, workitems.create);
    app.get('/workitems/:workitemId', authorization.requiresLogin, hasAuthorization, workitems.show);
    app.put('/workitems/:workitemId', authorization.requiresLogin, hasAuthorization, workitems.update);
    app.del('/workitems/:workitemId', authorization.requiresLogin, hasAuthorization, workitems.destroy);

    

    // Finish with setting up the workitemId param
    app.param('workitemId', workitems.workitem);

};