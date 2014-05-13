/**
 * Returns an RPC Object which will allow the user to invoke functions on the given remote procedure
 * @param remote {Object} interface to a remote procedure has a post, and listen function
 * @param spec {Object=} optionally specifies alternate post/listen functions on the remote
 * @returns {RPC}
 * @constructor
 *
 * specifying the remote functions for a web worker:
 * {
 *      "listen":"addEventListener",
 *      "post":"postMessage",
 *      "message":"message"
 * }
 */
function RPC(remote, spec) {
    'use strict';

    // ensure object constructor
    if (!(this instanceof RPC)) {
        return new RPC(remote, spec);
    }

    // scope that this!
    var that = this,
        /** @dict */
        exposed = Object.create(null);

    /**
     * Ensures that a spec object is valid, and true to its remote
     * @param spec {Object}
     * @returns {Object}
     */
    function validateSpec(spec) {
        if ((!spec) || (typeof spec !== 'object')) {
            spec = {};
        }

        if (!spec.listen) {
            spec.listen = 'addEventListener';
        }

        if (!spec.post) {
            spec.post = 'postMessage';
        }

        if ((!spec.message) || (spec.message === '') || (typeof spec.message !== 'string')) {
            spec.message = false;
        }

        if (typeof remote[spec.post] !== 'function') {
            throw new TypeError('RPC: remote has invalid post method');
        }

        if (typeof remote[spec.listen] !== 'function') {
            throw new TypeError('RPC: remote has invalid listen method');
        }

        return spec;
    }

    /**
     * Exposes the post/listen methods
     */
    function exposePostListen(spec) {
        that.post = remote[spec.post];
        if (spec.message) {
            that.listen = function wrapAddEvent(fn) {
                if (typeof fn !== 'function') { return; }

                remote[spec.listen].call(that, spec.message, fn);
            }
        } else {
            that.listen = remote[spec.listen];
        }
    }

    /**
     * initialize the RPC object
     * @param r {Object} remote object, like socket.io, or a web worker
     * @param spec {Object=} defines remote functions to use
     */
    function init(r, spec) {
        if ((typeof r !== 'object') || (r === null)) {
            throw new TypeError('RPC: Parameter one must be an object with valid listen/post methods');
        }

        spec = validateSpec(spec);

        // expose
        exposePostListen(spec);
        that.expose = expose;
    }

    /**
     * Exposes an object to the other side of the remote, or returns the exposed
     * @param toExpose {Object}
     * @param overWrite {Boolean=}
     * @returns {Object|undefined}
     */
    function expose(toExpose, overWrite) {
        if ((!toExpose) || (typeof toExpose !== 'object')) {
            return exposed;
        }

        Object.keys(toExpose).forEach(function (sub) {
            if (overWrite === true) {
                exposed[sub] = toExpose[sub];
                return;
            }
            if (exposed[sub] !== undefined) {
                return;
            }
            exposed[sub] = toExpose[sub];
        });
    }

    // start the ball rolling!
    init(remote, spec);
}