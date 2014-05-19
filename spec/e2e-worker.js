/**
 * file: e2e-worker.js
 * Created by michael on 19/05/14.
 */

/*global self, RPC*/

self.importScripts('js/simple-fake-promises.js', 'js/remote-procedure.js', 'js/js-rpc.js');

var rpc = RPC(self);

rpc.expose({
    dummy: function () {
        'use strict';
        return 'dum dum';
    }
           });
rpc.isReady(true);