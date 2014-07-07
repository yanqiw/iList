'use strict';

angular.module('mean.system').controller('HeaderController', ['$scope', '$rootScope', 'Global', 'Menus',
    function($scope, $rootScope, Global, Menus) {
        $scope.global = Global;
        $scope.menus = {};

        // Default hard coded menu items for main menu
       /* var defaultMainMenu = [{
            'roles': ['authenticated'],
            'title': 'Articles',
            'link': 'all articles'
        }, {
            'roles': ['authenticated'],
            'title': 'Create New Article',
            'link': 'create article'
        },{
            'roles': ['authenticated'],
            'title': 'Work Items',
            'link': 'all workitems'
        }, {
            'roles': ['authenticated'],
            'title': 'Create New WorkItem',
            'link': 'create workitem'
        },{
            'roles': ['authenticated'],
            'title': 'Work Items',
            'link': 'all workitems'
        }
        ];*/

        var defaultMainMenu = [{
            'roles': ['authenticated'],
            'title': 'Undo',
            'link': 'create workitem'
        },{
            'roles': ['authenticated'],
            'title': 'Show All',
            'link': 'all workitems'
        }];

        // Query menus added by modules. Only returns menus that user is allowed to see.
        function queryMenu(name, defaultMenu) {

            Menus.query({
                name: name,
                defaultMenu: defaultMenu
            }, function(menu) {
                console.log(menu)
                $scope.menus[name] = menu;
            });
        };

        // Query server for menus and check permissions
        queryMenu('main', defaultMainMenu);

        $scope.isCollapsed = false;

        $rootScope.$on('loggedin', function() {

            queryMenu('main', defaultMainMenu);
            //console.log("system/controller/header.js@line47: "+$rootScope.user);
            $scope.global = {
                authenticated: !! $rootScope.user,
                user: $rootScope.user.name
            };
        });

    }
]);