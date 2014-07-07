'use strict';

exports.render = function(req, res) {
	res.render('index', {
		user: req.user ? JSON.stringify(req.user.name) : 'null',
		_id: req.user ? JSON.stringify(req.user._id) : 'null',
		roles: req.user ? JSON.stringify(req.user.roles) : JSON.stringify(['annonymous'])
	});
};