/**
 * file: e2e.js
 * Created by michael on 19/05/14.
 */

/*global Worker, RPC, console, window*/

(function () {
    'use strict';
    var myWorker = new Worker('/e2e-worker.js'),
    rpc = new RPC(myWorker, { message: 'message', listenAttr: 'data', error: 'error'}),
    outputEl = window.document.getElementById('output');

    function output() {
        var args = Array.prototype.slice.call(arguments, 0);
        args.join(' ');
        outputEl.innerHTML += args + '<br/>';
    }

    output('initializing worker');

    rpc.onReady(function () {
        output('Executing on ready');

        rpc.remotes.dummy.invoke().then(function () {
            output('victory', arguments[0]);
        }, function (r) {
            output('failure', r.message);
        });
    });


    setTimeout(function ( ){
        rpc.isReady(true);
        rpc.expose({output: output});
        output('this side ready');
    }, 50);
}());
