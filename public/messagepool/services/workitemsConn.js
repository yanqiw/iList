
//workitem connection factory
angular.module('mean.messagepool').factory('WIPool', ['$resource',function($resource, messagePool) {
    var exports = {};

    exports.workitems = $resource('workitems/:workitemId', {
        workitemId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    //Get child workitems service used for workitems REST endpoint, remove this as add child function in the detail

    exports.workitems.childItems =  $resource('workitems/:workitemId/childitems', {
        workitemId: '@_id'
    }, {
        update: {
            url:'workitems/:workitemId',
            method: 'PUT'
        },
        remove: {
            url:'workitems/:workitemId',
            method: 'DELETE'
        },
        get: {
            method: 'GET',
            isArray: true
        }
    });

    //get root node
    exports.workitems.root =  $resource('workitems/root', {}, {
        get: {
            method: 'GET',
            isArray: false
        }
    });

    return exports;
}]);
