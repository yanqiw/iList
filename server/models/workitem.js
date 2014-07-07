'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * WorkItem Schema
 */
var WorkItemSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    subject: {
        type: String,
        default: '',
        trim: true
    },
    content: {
        type: String,
        default: '',
        trim: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    creater:{
        type: Schema.ObjectId,
        ref: 'User'
    },
    index:{
        type: 'Number',
        default: 0
    },
    parent: {
        type: Schema.ObjectId,
        ref: 'WorkItem'
    },
    ancestors:{
        type: [{}],
        ref: 'WorkItem',
        default: []
    },
    nodeType:{
        type: String,
        default: 'leaf'
    },
    at: {
        type: [Schema.ObjectId],
        ref:'User',
        default: []
    },
    status: {
        type: String,
        default: 'new'
    },
    expand: {
        type: Boolean,
        default: false
    },
    shareModel: {
        type: String,
        default: 'pravite'
    },
    tag: {
        type: [Schema.ObjectId],
        ref:"tag",
        default: []
    }

});

/**
 * Validations
 */


// WorkItemSchema.path('subject').validate(function(subject) {
//     return subject.length;
// }, 'Work item cannot be blank');

//status [new, completed, deleted]
WorkItemSchema.path('status').validate(function(status) {
    var allowedStatus = ['new', 'completed', 'deleted'];
    var validated = false;
    for(var i in allowedStatus){
        if(status === allowedStatus[i]){
            validated = true;
            break;
        }
    }
    return validated;
}, 'Status is only allowed [new, completed, deleted]');

//shareModel [pravite, view, edit]
WorkItemSchema.path('shareModel').validate(function(shareModel) {
    var allowedshareModel = ['pravite', 'view', 'edit'];
    var validated = false;
    for(var i in allowedshareModel){
        if(shareModel === allowedshareModel[i]){
            validated = true;
            break;
        }
    }
    return validated;
}, 'Share is only allowed [pravite, view, edit]');

//nodeType [node, leaf, root]
WorkItemSchema.path('nodeType').validate(function(shareModel) {
    var allowedshareModel = ['node', 'leaf', 'root'];
    var validated = false;
    for(var i in allowedshareModel){
        if(shareModel === allowedshareModel[i]){
            validated = true;
            break;
        }
    }
    return validated;
}, 'nodeType is only allowed [node, leaf, root]');

/**
 * Middleware
 */
//WorkItemSchema.pre('save', function(err){});


/**
 * Statics
 */
WorkItemSchema.statics.load = function(id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name username').exec(cb);
};

mongoose.model('WorkItem', WorkItemSchema);