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
        exposedProcedures = Object.create(null),
        /** @dict */
        remoteProcedures = Object.create(null),
        /** @type {boolean} */
        localReadyFlag = false,
        /** @type {boolean} */
        remoteReadyFlag = false,
        /** @type {boolean} */
        isReadyFlag = false,
        /** @type Array.<function()> */
        readyQueue = [],
        /** @type {number} */
        uidCount = 0,
        /** @const */
        noop = function () {},
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
        that.post = remote[spec.post];
        if (spec.message) {
            that.listen = function wrapAddEvent(fn) {
                if (isFunction(fn) === false) { return; }

                remote[spec.listen].call(that, spec.message, fn);
            }
        } else {
            that.listen = remote[spec.listen];
        }
    }

    function handleMessage(data) {
        if (data.error) {
            log.error.apply(log, data.error);
        }
        if (data.ready) {
            if (ready === true) {
                remoteReadyFlag = true;
            }
        }
        if (data.fn) {
        }
        if (data.listen) {
        }
        if (data.ignore) {
        }
        if (data.expose) {
        }
    }


    function uid() {
        // increment the counter
        uidCount += 1;
        // reset it if it's 'high'
        uidCount = uidCount > 1000 ? 0 : uidCount;
        // return a uid
        return ['uid-', parseInt(Date.now(), 16), uidCount, Math.random()].join('');
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
                log.warn('RPC: received invalid data ' + err.message, data);
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
            that.post(JSON.stringify({ error:args }));
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

    function sendExposeMessage() {

    }

    function exposeLevel(attr, toExpose, exposedLevel, overWrite) {
        Object.keys(toExpose).forEach(function (sub) {
            // if it's an object recurse
            if ((typeof toExpose[sub] === 'object') && (toExpose[sub])) {
                // if the entry exists only overwrite if instructed
                if (exposedLevel[sub]) {
                    if (overWrite) {
                        exposedLevel[sub] = exposeLevel(attr + '.' + sub, toExpose[sub], exposedLevel[sub], overWrite);
                    }
                }
            }
            // if it's a function send an expose message
            sendExposeMessage(attr, sub);
            exposedLevel[sub] = toExpose[sub];
        });

        return exposedLevel;
    }

    /**
     * Exposes an object to the other side of the remote, or returns the exposed
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
        that.isReady = isReady;
        that.onReady = onReady;
        that.setLogger = setLogger;
        that.error = error;
        that.uid = uid;

        // listen!
        initListener(spec);
    }

    // start the ball rolling!
    init(remote, spec);
}