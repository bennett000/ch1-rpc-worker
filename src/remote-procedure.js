/*global SimpleFakePromise */
/**
 * Encapsulates the grunt functions that make the RPC work
 * @param postMethod {function(...)}
 * @param callbackDictionary {Object}
 * @returns {RemoteProcedure}
 * @constructor
 */
function RemoteProcedure(postMethod, callbackDictionary, remoteFn) {
    'use strict';

    // ensure object constructor
    if (!(this instanceof RemoteProcedure)) {
        return new RemoteProcedure(postMethod);
    }

    // avoid this confusion
    var that = this;

    that.postMethod = postMethod;
    that.callbacks = callbackDictionary;
    that.fn = remoteFn;
}

RemoteProcedure.prototype.Q = SimpleFakePromise();

RemoteProcedure.prototype.statics = Object.create(null, {
    uidCount: {
        value       : 0,
        configurable: false,
        writable    : true
    }
});

/**
 * Generates a relatively unique string
 * @returns {string}
 */
RemoteProcedure.prototype.uid = function uid() {
    'use strict';
    // increment the counter
    this.statics.uidCount += 1;
    // reset it if it's 'high'
    this.statics.uidCount = this.statics.uidCount > 1000 ? 0 : this.statics.uidCount;
    // return a uid
    return ['u', Date.now().toString(16).substring(4), this.statics.uidCount, Math.floor(Math.random() * 100000).toString(32)].join('');
};

/**
 * Registers a callback in the callback dictionary
 * @param defer {Object} defer/promise/future
 * @param uid {string} uid of the callback
 */
RemoteProcedure.registerCallback = function registerCallback(defer, uid) {
    'use strict';
    if (this.callbacks.uid) {
        throw new RangeError('Remote Procedure: callback uid already exists!');
    }
    this.callbacks[uid] = {
        t: defer.resolve,
        f: defer.reject
    };

    return defer.promise;
};

/**
 * Registers a listener in the callback dictionary
 * @param callback {function(...)}
 * @param uid {string}
 */
RemoteProcedure.registerListener = function registerListener(callback, uid) {
    'use strict';
    if (typeof callback !== 'function') {
        throw new TypeError('Remote Procedure: register listener: expecting callback function');
    }
    this.callbacks[uid] = callback;

    return uid;
};

/**
 * calls the remote post message
 * @param type {string} the 'type' of call (invoke, callback, listen...)
 * @param registerFunction {function(...)}
 * @param args {Array}
 * @returns {*}
 */
RemoteProcedure.prototype.callRemote = function callRemote (type, registerFunction, args) {
    'use strict';
    var uid = this.uid(), d = this.Q.defer(), that = this;

    this.postMethod(JSON.stringify(
    {
        type: [
            {
                fn: that.fn,
                uid: uid,
                args: args
            }
        ]
    }));

    return registerFunction(d, uid);
};

/**
 * posts an invoke message
 * @returns {Object}
 */
RemoteProcedure.prototype.invoke = function remoteInvoke() {
    'use strict';
    return this.callRemote('invoke', this.registerCallback, Array.prototype.slice.call(arguments, 0));
};

/**
 * posts an callback message
 * @returns {Object}
 */
RemoteProcedure.prototype.callback = function remoteCallback() {
    'use strict';
    return this.callRemote('callback', this.registerCallback, Array.prototype.slice.call(arguments, 0));
};

/**
 * posts a promise message
 * @returns {Object}
 */
RemoteProcedure.prototype.promise = function remotePromise() {
    'use strict';
    return this.callRemote('promise', this.registerCallback, Array.prototype.slice.call(arguments, 0));
};

/**
 * posts a listen message
 * @returns {Object}
 */
RemoteProcedure.prototype.listen = function remotePromise(callback) {
    'use strict';
    return this.callRemote('listen', this.registerListener, [callback]);
};

/**
 * posts an ignore message
 * @returns {Object}
 */
RemoteProcedure.prototype.ignore = function remotePromise(uid) {
    'use strict';
    return this.callRemote('listen', this.registerListener, [uid]);
};