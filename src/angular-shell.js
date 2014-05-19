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
        rpc.setPromiseLib($q);
        rpc.init = function initRPC() {
            var d = $q.defer();
            rpc.onReady(d.resolve);
            rpc.isReady(true);
            return d.promise();
        };
        return rpc;
    }];
});