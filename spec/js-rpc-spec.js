/**
 * file: js-rpc-spec.js
 * Created by michael on 13/05/14
 */

/*global window, jasmine, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular */


describe('the js-rpc object is initialized with a \'remote\' object, like a worker, or a socket.io connection', function () {
    'use strict';
    var invalidRemote = {
        postMessage: function () {}
    }, validDefaultRemote = {
        addEventListener: function () {},
        postMessage: function () {}
    }, validCustomRemote = {
        listen: function () {

        }, post: function () {

        }
    }, customDesc = {
        listen: 'listen',
        post: 'post'
    };

    it('Should be a constructor that accepts one or more *valid* arguments', function () {
        expect(typeof RPC).toBe('function');
        expect(function () { new RPC(); }).toThrow();
        expect(function () { new RPC({}); }).toThrow();
        expect(function () { new RPC(invalidRemote); }).toThrow();
        expect(function () { new RPC(validDefaultRemote); }).not.toThrow();
        expect(function () { new RPC(validCustomRemote, customDesc); }).not.toThrow();
        expect(new RPC(validDefaultRemote) instanceof RPC);
        expect(RPC(validDefaultRemote) instanceof RPC);
    });

    it('Should have post/listen methods after construction', function () {
        var p1 = false, msg = 'messagio',
            rpc = new RPC(
            {
                addEventListener: function (msg) { console.log(arguments); p1 = msg; },
                postMessage: function () {}
            }, {
                message: msg
            });

        expect(typeof rpc.listen).toBe('function');
        expect(typeof rpc.post).toBe('function');

        // this should do nothing as 'ooga' is not a function
        rpc.listen('oooga');
        expect(p1).toBe(false);
        rpc.listen(function () {
            // noop
        });

        expect(p1).toBe(msg);
    });
});