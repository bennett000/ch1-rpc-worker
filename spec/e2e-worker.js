/**
 * file: e2e-worker.js
 * Created by michael on 19/05/14.
 */

/*global self, RPC, Q*/

self.importScripts('lib/q/q.js', 'js/simple-fake-promise.js', 'js/remote-procedure.js', 'js/js-rpc.js');

var rpc = new RPC(self, { message: 'message', listenAttr: 'data'});

rpc.expose({
    dummy: function () {
        'use strict';
        return 'dum dum';
    }
           });
rpc.isReady(true);