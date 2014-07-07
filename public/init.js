'use strict';

angular.element(document).ready(function() {
    //Fixing facebook bug with redirect
    if (window.location.hash === '#_=_') window.location.hash = '#!';

    //Then init the app
    angular.bootstrap(document, ['mean']);

});

angular.module('mean', ['ngCookies', 'ngResource', 'ui.bootstrap', 'ui.router', 'ui.utils', 'mean.system','mean.auth', 'mean.workitems','mean.messagepool','mean.mhotkeys']);