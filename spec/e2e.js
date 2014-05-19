/**
 * file: e2e.js
 * Created by michael on 19/05/14.
 */

/*global Worker, RPC, console*/

(function () {
    'use strict';
    var myWorker = new Worker('/e2e-worker.js'),
    rpc = new RPC(myWorker), outputEl = document.getElementById('output');

    function output() {
        var args = Array.prototype.slice.call(arguments, 0);
        args.join(' ');
        outputEl.innerHTML += args + '<br/>';
    }

    rpc.onReady(function () {
        rpc.remotes.dummy.invoke().then(function () {
            output('victory', arguments);
        }, function (r) {
            output('failure', r.message);
        });
    });
    rpc.isReady(true);
}());
