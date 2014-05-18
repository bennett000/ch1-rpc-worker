/*global RemoteProcedure, SimpleFakePromise */
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
        Q = SimpleFakePromise(),
        /** @const */
        DOT = '.',
        /** @dict */
        exposedProcedures = Object.create(null),
        /** @dict */
        resultCallbacks = Object.create(null),
        /** @type {boolean} */
        localReadyFlag = false,
        /** @type {boolean} */
        remoteReadyFlag = false,
        /** @type {boolean} */
        isReadyFlag = false,
        /** @type Array.<function()> */
        readyQueue = [],
        /** @const */
        noop = function () {},
        /*global console*/
        log = console || {
            log: noop,
            info: noop,
            assert: noop,
            warn: noop,
            error: noop
        };

    /**
     * @param fn
     * @returns {boolean}
     */
    function isFunction(fn) {
        return typeof fn === 'function';
    }

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

        if (isFunction(remote[spec.post]) === false) {
            throw new TypeError('RPC: remote has invalid post method');
        }

        if (isFunction(remote[spec.listen]) === false) {
            throw new TypeError('RPC: remote has invalid listen method');
        }

        return spec;
    }

    /**
     * Exposes the post/listen methods
     */
    function exposePostListen(spec) {
        that['post'] = remote[spec.post];
        if (spec.message) {
            that['listen'] = function wrapAddEvent(fn) {
                if (isFunction(fn) === false) { return; }

                remote[spec.listen].call(that, spec.message, fn);
            };
        } else {
            that['listen'] = remote[spec.listen];
        }
    }

    /**
     * validates a set of results (invoke,callback, listen...)
     * @param data {Array.<Object>}
     * @returns {boolean}
     */
    function validateMessageData(data) {
        if (!Array.isArray(data)) {
            log.error('RPC: resultHandler: invalid data');
            return false;
        }
        if (data.length === 0) {
            log.error('RPC: resultHandler: empty result');
            return false;
        }
        return true;
    }

    /**
     * validates a result callback
     * @param datum {Object}
     * @returns {boolean}
     */
    function validateResultCallbackDatum(datum) {
        if (!resultCallbacks[datum.uid]) {
            log.error('RPC: resultHandler: no callbacks for uid: ' + datum.uid);
            return false;
        }
        if (!isFunction(resultCallbacks[datum.uid].t)) {
            log.error('RPC: resultHandler: no callback for uid: ' + datum.uid);
            return false;
        }
        return true;
    }

    /**
     * validates a call to invoke/promise/callback
     * @param datum {Object}
     * @returns {boolean}
     */
    function validateCallDatum(datum) {
        if (!datum.uid) {
            return false;
        }
        if (!Array.isArray(datum.args)) {
            return false;
        }
        if (!datum.fn) {
            return false;
        }
        return true;
    }

    /**
     * Given a dictionary of objects, and string describing objects in dot notation
     * this function attempt to retrieve a nested object.  Returns the object, or
     * null
     * @param dictionary {Object} collection of objects
     * @param tree {string} reference to an object in standard oop dot notation
     * @param doCreate {boolean=} should we make the object if it's not there?
     * @returns {Object} returns the object, or null
     * @throws {TypeError} on invalid input
     */
    function getNestedObject(dictionary, tree, doCreate) {
        if ((typeof tree !== 'string') || (tree === '')) {
            throw new TypeError('RPC: getNested Object: tree is not a string');
        }
        if ((!dictionary) || (typeof dictionary !== 'object')) {
            throw new TypeError('RPC: getNested Object: dictionary is not an object');
        }
        var result = null,
            nextDict;

        tree = tree.split(DOT);
        doCreate = doCreate || false;


        if (tree.length === 1) {
            if (!dictionary[tree[0]]) {
                if (doCreate) {
                    dictionary[tree[0]] = Object.create(null);
                    result = dictionary[tree[0]];
                }
            } else {
                result = dictionary[tree[0]];
            }
        } else if (tree.length > 1) {
            nextDict = tree.shift();
            if (!dictionary[nextDict]) {
                if (doCreate) {
                    dictionary[nextDict] = Object.create(null);
                    result = getNestedObject(dictionary[nextDict], tree.join(DOT), doCreate);
                }
            } else {
                result = getNestedObject(dictionary[nextDict], tree.join(DOT), doCreate);
            }
        }

        return result;
    }

    /**
     * Handles results arriving from 'the other side'
     * @param data {Array.<Object>} collection of results
     */
    function onResults(data) {
        if (!validateMessageData(data)) {
            return;
        }
        data.forEach(function (result) {
            if (!validateResultCallbackDatum(result)) {
                return;
            }
            if (result.error) {
                if (isFunction(resultCallbacks[result.uid].f)) {
                    // promise case
                    resultCallbacks[result.uid].f(new Error(result.error));
                } else {
                    // callback case
                    resultCallbacks[result.uid].t(new Error(result.error));
                }
                return;
            }
            // success!
            if (isFunction(resultCallbacks[result.uid].f)) {
                // promise callback
                resultCallbacks[result.uid].t(result.result);
            } else {
                // callback callback
                resultCallbacks[result.uid].t(null, result.result);
            }
        });
    }

    /**
     * posts an error to a specific callback
     * @param msg {string} error message
     * @param uid {string} uid of the callback
     */
    function postResultError(msg, uid) {
        var errorObj = {}, message = {};
        errorObj['results'] = [];

        message['error'] = msg;
        message['uid'] = uid;
        errorObj['results'].push(message);

        that.post(JSON.stringify(errorObj));
    }

    /**
     * posts a result to a specific callback
     * @param result {*}
     * @param uid {string} uid of the callback
     */
    function postResult(result, uid) {
        var resultObj = {}, data = {};
        resultObj['results'] = [];

        data['result'] = result;
        data['uid'] = uid;
        resultObj['results'].push(data);

        that.post(JSON.stringify(resultObj));
    }

    /**
     * runs the function after it's been 'vetted'
     * @param fn {function (...)}
     * @param details {Object}
     */
    function invokeFunction(fn, details) {
        try {
            postResult(fn.apply(null, details.args), details.uid);
        } catch (err) {
            postResultError(err.message, details.uid);
        }
    }

    /**
     * handle invocation requests
     * @param data {Object}
     */
    function onInvoke(data) {
        if (!validateMessageData(data)) {
            return;
        }
        data.forEach(function (invoke) {
            if (!validateCallDatum(invoke)) {
                return;
            }
            var obj = getNestedObject(exposedProcedures, invoke.fn), err;
            if (typeof obj !== 'function') {
                err = ['RPC: onInvoke: error invalid function ', invoke.fn].join();
                log.error(err);
                postResultError(err, invoke.uid);
                return;
            }
            // invoke, and callback
            invokeFunction(obj, invoke);
        });

    }

    function onListen(data) {
        if (!validateMessageData(data)) {
            return;
        }
        data.forEach(function (exposeFn) {
            if (typeof exposeFn !== 'string') {
                return;
            }
        });
    }

    function onIgnore(data) {

    }

    function onPromise(data) {

    }

    function onCallback(data) {
        if (!validateMessageData(data)) {
            return;
        }
        data.forEach(function (exposeFn) {
            if (typeof exposeFn !== 'string') {
                return;
            }
        });
    }


    /**
     * Handles exposure requests by building up the 'remotes' object
     * @param data {string}
     * @throws {TypeError} on invalid data
     */
    function onExpose(data) {
        if (!validateMessageData(data)) {
            throw new TypeError('RPC: expose: unexpected data');
        }
        data.forEach(function (exposeFn) {
            if (typeof exposeFn !== 'string') {
                return;
            }
            var splitFns = exposeFn.split(DOT), obj, fn;
            // scrub fenceposts
            if (splitFns[0] === '') {
                splitFns.shift();
                exposeFn = splitFns.join(DOT);
            }

            if (splitFns.length === 1) {
                that.remotes[exposeFn] = RemoteProcedure(that.post, resultCallbacks, exposeFn);
            } else if (splitFns.length > 1) {
                fn = splitFns.pop();
                obj = getNestedObject(that.remotes, splitFns.join(DOT), true);

                if (obj) {
                    obj[fn] = RemoteProcedure(that.post, resultCallbacks, exposeFn);
                } else {
                    log.error('RPC: expose error, invalid object');
                }
            }
        });
    }

    /**
     * Handles messages sent from 'the other side'
     * @param data {Object}
     */
    function handleMessage(data) {
        if (data['error']) {
            log.error.apply(log, data.error);
        }
        if (data['ready']) {
            if (data.ready === true) {
                remoteReadyFlag = true;
            }
        }
        if (data['results']) {
            onResults(data.results);
        }
        if (data['invoke']) {
            onInvoke(data.invoke);
        }
        if (data['listen']) {
            onListen(data.listen);
        }
        if (data['ignore']) {
            onIgnore(data.ignore);
        }
        if (data['promise']) {
            onPromise(data.promise);
        }
        if (data['callback']) {
            onCallback(data.callback);
        }
        if (data['expose']) {
            onExpose(data.expose);
        }
    }

    /**
     * Attaches an internal listener
     */
    function initListener() {
        that.listen(function onMessage(data) {
            try {
                data = JSON.parse(data);
                handleMessage(data);
            } catch (err) {
                log.error('RPC: received invalid data ' + err.message, data);
            }
        });
    }

    /**
     * @param setReady {boolean=} will set 'this side' to ready
     * @returns {boolean}
     */
    function isReady(setReady) {
        if (setReady === true) {
            localReadyFlag = true;
        }
        isReadyFlag = remoteReadyFlag && localReadyFlag;
        return isReadyFlag;
    }

    /**
     * callbacks to run when ready
     * @param fn {function(Error|null,...)}
     */
    function onReady(fn) {
        if (!isFunction(fn)) {
            readyQueue.push(fn);
        }
    }

    /**
     * Takes any number of parameters and sends them to the remote as an error
     * This function is meant for 'emergency' error reporting.  Normal errors
     * should occur through node.js style callbacks, or promises
     */
    function error() {
        var args = Array.prototype.slice.call(arguments, 0);
        try {
            that.post(JSON.stringify({ error: args }));
        } catch (err) {
            // notify the error, but fail over
            log.error(err.message);
        }
    }

    /** overrides the local logging mechanism */
    function setLogger(l) {
        // installs a new logger!
        if (!l) { return false; }
        if (!isFunction(l.log)) { return false; }
        if (!isFunction(l.info)) { return false; }
        if (!isFunction(l.assert)) { return false; }
        if (!isFunction(l.warn)) { return false; }
        if (!isFunction(l.error)) { return false; }

        log = l;

        return true;
    }

    /**
     * Sends an expose message to the other side of the wire
     * @param fnName {string} the fully qualified name of the function to expose
     */
    function sendExposeMessage(fnName) {
        that.post(JSON.stringify(
        {
            expose: [
                fnName
            ]
        }));
    }

    /**
     * Recursively iterates over a given object, and sends expose messages
     * @param toExpose {Object} object to iterate over
     * @param attr {string=} the identifying attributes (root.object.subobject)
     */
    function exposeByLevel(toExpose, attr) {
        attr = attr || '';

        Object.keys(toExpose).forEach(function (eAttr) {
            // if it's an object recurse
            if ((typeof toExpose[eAttr] === 'object') && (toExpose[eAttr])) {
                // recurse
                exposeByLevel(toExpose[eAttr], attr + DOT + eAttr);
            }
            // if it's a function send an expose message
            if (typeof toExpose[eAttr] === 'function') {
                sendExposeMessage(attr + DOT + eAttr);
            }
        });
    }

    /**
     * Exposes an object to the other side of the remote, or returns the exposed
     * This function _can_ be destructive if the overwrite flag is set.  This
     * function will _always_ overwrite references on the remote.  This behaviour
     * may change in the future.  Stay tuned.
     *
     * @param toExpose {Object}
     * @param overWrite {Boolean=}
     * @returns {Object|undefined}
     */
    function expose(toExpose, overWrite) {
        if ((!toExpose) || (typeof toExpose !== 'object')) {
            return exposedProcedures;
        }

        Object.keys(toExpose).forEach(function (sub) {
            if (overWrite === true) {
                exposedProcedures[sub] = toExpose[sub];
                return;
            }
            if (exposedProcedures[sub] !== undefined) {
                return;
            }
            exposedProcedures[sub] = toExpose[sub];
        });

        exposeByLevel(toExpose);
    }

    /**
     * Sets JS RPC to use promises instead of callbacks, using the given promise
     * library
     * @param lib {Object} a promise library like Q
     * @returns {boolean}
     *
     * Promise library must support:
     * lib.defer()
     * lib.defer().resolve()
     * lib.defer().reject()
     * lib.defer().promise
     * lib.defer().promise.then()
     */
    function setPromiseLib(lib) {
        if (!isFunction(lib.defer)) {
            throw new TypeError('RPC: setPromiseLib: expecting a library with a root level defer function');
        }
        var test = lib.defer();

        if (!isFunction(test.resolve)) {
            throw new TypeError('RPC: setPromiseLib: expecting defers to have a resolve method');
        }

        if (!isFunction(test.reject)) {
            throw new TypeError('RPC: setPromiseLib: expecting defers to have a reject method');
        }

        if (!test.promise) {
            throw new TypeError('RPC: setPromiseLib: expecting defer objects to have a promise');
        }

        if (!isFunction(test.promise.then)) {
            throw new TypeError('RPC: setPromiseLib: expecting promises to have a then method');
        }

        Q = lib;
        RemoteProcedure.prototype.Q = lib;
        return true;
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
        that['remotes'] = Object.create(null);
        that['setPromiseLib'] = setPromiseLib;
        that['expose'] = expose;
        that['isReady'] = isReady;
        that['onReady'] = onReady;
        that['setLogger'] = setLogger;
        that['error'] = error;

        // listen!
        initListener(spec);
    }

    // start the ball rolling!
    init(remote, spec);
}