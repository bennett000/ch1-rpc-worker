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


(function () {
    'use strict';
    var socket = io.connect(window.location.hostname + ':' + 8079),
    rpc = new RPC({
	on: function (msg, fn) {
	    socket.on(msg, fn);
	},
	emit: function (message) {
	    console.log('exposing message', message);
	    socket.emit('message', message);
	}
    }, {
	listen: 'on',
	post: 'emit',
	message: 'message'
    }),
    outputEl = window.document.getElementById('socket');

    socket.on('message', function () {
	console.log('dude', Array.prototype.join.call(arguments, ', '));
    });

    function output() {
        var args = Array.prototype.slice.call(arguments, 0);
        args.join(' ');
        outputEl.innerHTML += args + '<br/>';
    }

    output('initializing socket');

    rpc.onReady(function () {
        output('Executing on ready');

        rpc.remotes.loopBack.invoke('lalalal').then(function () {
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