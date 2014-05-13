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
    var that = this;

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

    init(remote, spec);
}