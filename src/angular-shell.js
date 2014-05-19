/*global angular*/
angular.module('js-rpc', []).provider('jsRPC', function () {
    'use strict';
    var rpc;

    //###RPCCODE

    /*global RPC*/
    this.construct = function constructRPC(remote, spec) {
        rpc = new RPC(remote, spec);
    };

    this.$get = ['$q', function ($q) {
        if (!rpc) {
            throw new Error('RPC not constructed!!!');
        }
        // upgrade the promise library, ensuring callbacks fall in the
        // angular event loop
        rpc.setPromiseLib($q);

        // this init function is meant to be used in a route provider
        // http://stackoverflow.com/questions/16286605/initialize-angularjs-service-with-asynchronous-data
        rpc.init = function initRPC() {
            var d = $q.defer();
            rpc.onReady(d.resolve);
            rpc.isReady(true);
            return d.promise();
        };
        return rpc;
    }];
});