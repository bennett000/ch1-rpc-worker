/**
 * file: vanilla-shell.js
 * Created by michael on 15/11/14.
 */

/*global window, self */

(function RPCClosure() {
    'use strict';

    var global;

    if (typeof window === 'undefined') {
        global = self;
    } else {
        global = window;
    }

    //###RPCCODE

    global['RPC'] = RPC;
}());
