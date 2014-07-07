'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    WorkItem = mongoose.model('WorkItem'),
    _ = require('lodash');


/**
 * Find workitem by id
 */
exports.workitem = function(req, res, next, id) {
    WorkItem.load(id, function(err, workitem) {
        if (err) return next(err);
        if (!workitem) return next(new Error('Failed to load workitem ' + id));
        req.workitem = workitem;
        next();
    });
};

/**
*  Get all the parent workitems's id and subject of the current workitem
*  used for breadcrumb navigator of the page
*/
exports.setWIancestors=function(currentWI, workitem, callback){
  if(currentWI.parent){
	   WorkItem.findById(currentWI.parent, function(err, parentWI){
	   if(!workitem.ancestors || currentWI._id == workitem._id)workitem.ancestors =[];
		      var bread={};
			  bread._id=parentWI._id;
			  bread.subject=parentWI.subject;
			  workitem.ancestors.unshift(bread);
			  exports.setWIancestors(parentWI,workitem, callback);
		});
  }else{
     callback(workitem);
  }
}

/**
 * Create an workitem
 */
exports.create = function(req, res) {
    var workitem = new WorkItem(req.body);
    workitem.user = req.user;
    workitem.creater = req.user;

    workitem.save(function(err) {
        if (err) {
            console.log(err.errors);
            return res.send('users/signup', {
                errors: err.errors,
                workitem: workitem
            });
        } else {
            //console.log(workitem._id);
            exports._updateParentNodeType(workitem, res, function(parentWI, res){
                // if workitem's index is 0, means this workitem is added as a child node, and is the first one.
                // the index order should DEC
                console.log(workitem.index);
                exports._updateChildrenIndex(parentWI, workitem.index); 
                res.jsonp(workitem);
            });
            //res.jsonp(workitem);
        }
    });


};

/**
 * Update an workitem
 */
exports.update = function(req, res) {
    var workitem = req.workitem;
    workitem = _.extend(workitem, req.body);

    // find workitem in db
    WorkItem.findById(workitem._id, function(err, dbWI) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                workitem: workitem
            });
        } else {
            // if parent don't changed, update the workitem
            if (String(dbWI.parent) == String(workitem.parent)) {
                // save the update
                //workitem = _.extend(workitem, req.body);
                workitem.save(function(err) {
                    if (err) {
                        return res.send('users/signup', {
                            errors: err.errors,
                            workitem: workitem
                        });
                    } else {
                        //if index changed, update index
                        if (dbWI.index != workitem.index) {
                            WorkItem.findById(workitem.parent, function(err, parentWI) {
                                if (err) {
                                    return res.send('users/signup', {
                                        errors: err.errors,
                                        workitem: workitem
                                    });
                                } else {
                                    exports._updateChildrenIndex(parentWI, workitem.index - dbWI.index);
                                }
                            });
                        } 
                        res.jsonp(workitem);
                    }
                });
            } else {
                // if parent changed, update new and old parent
                //find old parent
                WorkItem.findById(dbWI.parent, function(err, parentWI) {
                    if (err) {
                        return res.send('users/signup', {
                            errors: err.errors,
                            workitem: workitem
                        });
                    } else {
                        // save the update
                        //workitem = _.extend(workitem, req.body);
                        workitem.save(function(err) {
                            if (err) {
                                return res.send('users/signup', {
                                    errors: err.errors,
                                    workitem: workitem
                                });
                            } else {
                                //update new parent node type
                                exports._updateParentNodeType(workitem, res, function(newParentWI, res) {
                                    //update old parent node type
                                    exports._updateNodeType(parentWI, res, function(oldParentWI, res) {
                                        //update children index
                                        //old parent
                                        exports._updateChildrenIndex(oldParentWI);
                                        //new parent
                                        exports._updateChildrenIndex(newParentWI);
                                        res.jsonp(workitem);
                                    })


                                });
                            }
                        });
                    }
                });
            }

        }
    })

};

/**
 * Delete an workitem
 */
exports.destroy = function(req, res) {
    var workitem = req.workitem;

    workitem.remove(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                workitem: workitem
            });
        } else {
            exports._updateParentNodeType(workitem, res);
            //res.jsonp(workitem);
        }
    });
};

/**
 * Show an workitem
 */
exports.show = function(req, res) {
     WorkItem.findOne({
        _id: req.workitem.id
    }).exec(function(err,workitem){
	
	  if (err) {
            res.render('error', {
                status: 500
            });
        } else {
		    exports.setWIancestors(workitem, workitem, function(workitem){
		    res.jsonp(workitem);
		   });
		}
	});
};

/**
 * List of WorkItems
 */
exports.all = function(req, res) {
    //get user id from req, may have security issue by Frank.
    WorkItem.find({
        user: req.user.id,
        parent: {
            $exists: false
        }
    }).sort('index').populate('user', 'name username').exec(function(err, workitems) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            if (workitems.length == 0) {
                exports._createRoot(req, res);
            } else {
                res.jsonp(workitems);
            }

        }
    });
};

/**
 * root of WorkItems
 */
exports.root = function(req, res) {
    //get user id from req, may have security issue by Frank.
    WorkItem.findOne({
        user: req.user.id,
        parent: {
            $exists: false
        }
    }).exec(function(err, workitem) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            if (!workitem) {
                exports._createRoot(req, res);
            } else {
                res.jsonp(workitem);
            }

        }
    });
};

/**
 * List child of WorkItems
 */
exports.listChild = function(req, res) {
    //get user id from req, may have security issue by Frank.
    console.log(req.workitem._id);
    WorkItem.find({
        user: req.user.id,
        parent: req.workitem._id
    }).sort('index').populate('user', 'name username').exec(function(err, workitems) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            var wi = {
                mainItem: req.workitem
            };
            wi.childItems = workitems;
            res.jsonp(workitems)
        }
    });
};

/**
 * creat root node for the user
 */
exports._createRoot = function(req, res) {
    var workitem = new WorkItem({
        subject: 'Home',
        status: 'new',
        shareModel: 'pravite',
        user: req.user,
        creater: req.user
    });
    workitem.save(function(err) {
        if (err) {
            console.log(err.errors);
            return res.send('users/signup', {
                errors: err.errors,
                workitem: workitem
            });
        } else {
            res.jsonp(workitem);
        }
    });
}

/**
 * update node type
 
 */
exports._updateNodeType = function(workitem, res, callback) {
    WorkItem.findOne({
        parent: workitem._id
    }, function(err, childItem) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                workitem: workitem
            });
        } else {
            if (childItem) {
                workitem.nodeType = 'node';
                workitem.expand = true;
                workitem.save(function(err) {
                    if (err) {
                        return res.send('users/signup', {
                            errors: err.errors,
                            workitem: workitem
                        });
                    } else {
                        if (callback) {
                            callback(workitem, res);
                        } else {
                            res.jsonp(workitem);
                        }
                    }
                });
            } else {
                workitem.nodeType = 'leaf';
                workitem.expand = false;
                workitem.save(function(err) {
                    if (err) {
                        return res.send('users/signup', {
                            errors: err.errors,
                            workitem: workitem
                        });
                    } else {
                        if (callback) {
                            callback(workitem, res);
                        } else {
                            res.jsonp(workitem);
                        }
                    }
                });
            }
        }
    });
}


/**
 * update parent node type
 
 */
exports._updateParentNodeType = function(workitem, res, callback) {
    if (workitem.parent) {
        WorkItem.findById(workitem.parent, function(err, parentWI) {
            if (err) {
                return res.send('users/signup', {
                    errors: err.errors,
                    workitem: workitem
                });
            } else {
                exports._updateNodeType(parentWI, res, function(parentWI, res) {
                    if (callback) {
                        callback(parentWI, res);
                    } else {
                        res.jsonp(workitem);
                    }
                });
            }
        });
    }
}


/**
 * update children index, this function will run in backend internal, and don't response
 * direct is the movment forward of a node. if move the node in same level, when node move from
 * top to down, the direct should be 1, and when sorting the children, the update should Ace.
 * for example, if move a node from 2 to 4, after saved, there are to node in index 4, the org node should be sorted
 * before the new node, so need to sort by update in ACE. 
 * In other case, the direct should always be -1, as other case we need to insert the node to a list, old nodes alwasy
 * after the new one.
 */
exports._updateChildrenIndex = function(workitem, direct) {
    var updateOrder = -1;
    if(direct > 0){
        updateOrder = 1;
    }
    WorkItem.find({
        parent: workitem._id
    }).sort({index:1, updated:updateOrder}).exec(function(err, workitems) {
        for (var i = 0; i < workitems.length; i++) {
            var workitem = workitems[i];
            //if (workitem.index && workitem.index != i) { // this line has one bug when add fisrt child, comment is temperoy.
                workitem.index = i;
                workitem.save(function(err) {});
            //}
        };

    });
}