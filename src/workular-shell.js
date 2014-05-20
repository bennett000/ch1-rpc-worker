/**
 * file: workular-shell
 * Created by michael on 20/05/14.
 */

/*global workular*/

workular.module('js-rpc', []).factory('jsRPC', ['global', function (global) {
    'use strict';
    var rpc;

    if (!workular.isFunction(global.postMessage)) {
        throw new TypeError('invalid global object for RPC, bad post');
    }

    if (!workular.isFunction(global.addEventListener)) {
        throw new TypeError('invalid global object for RPC, bad listener');
    }

    //###RPCCODE

    /*global RPC*/
    rpc = new RPC(global, { message: 'message', listenAttr: 'data'});

    return rpc;
}]);
