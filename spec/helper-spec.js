/*global console, setTimeout, RPC */

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

function getRPCPair() {
    'use strict';
    var rObj = {}, listenersA = [], listenersB = [];
    rObj.listenersA = listenersA;
    rObj.listenersB = listenersB;

    rObj.rpcA = new RPC(
    {
        addEventListener: function (fn) {
            if (typeof fn !== 'function') {
                console.warn('wrong type of listener');
                return;
            }
            listenersA.push(fn);
        },
        postMessage: function (data) {
            listenersB.forEach(function (fn) {
                fn(data);
            });
        }
    });

    rObj.rpcB = new RPC(
    {
        addEventListener: function (fn) {
            if (typeof fn !== 'function') {
                console.warn('wrong type of listener');
                return;
            }
            listenersB.push(fn);
        },
        postMessage: function (data) {
            listenersA.forEach(function (fn) {
                fn(data);
            });
        }
    });

    return rObj;
}

function getRPCPairAsync() {
    'use strict';
    var rObj = {}, listenersA = [], listenersB = [];
    rObj.listenersA = listenersA;
    rObj.listenersB = listenersB;

    rObj.rpcA = new RPC(
    {
        addEventListener: function (fn) {
            if (typeof fn !== 'function') {
                console.warn('wrong type of listener');
                return;
            }
            listenersA.push(fn);
        },
        postMessage: function (data) {
            setTimeout(function () {
                listenersB.forEach(function (fn) {
                    fn(data);
                });
            }, 0);
        }
    });

    rObj.rpcB = new RPC(
    {
        addEventListener: function (fn) {
            if (typeof fn !== 'function') {
                console.warn('wrong type of listener');
                return;
            }
            listenersB.push(fn);
        },
        postMessage: function (data) {
            setTimeout(function () {
                listenersA.forEach(function (fn) {
                    fn(data);
                });
            }, 0 );
        }
    });

    return rObj;
}