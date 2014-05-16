/**
 * Encapsulates the grunt functions that make the RPC work
 * @param postMethod {function(...)}
 * @param callbackDictionary {Object}
 * @returns {RemoteProcedure}
 * @constructor
 */
function RemoteProcedure(postMethod, callbackDictionary) {
    'use strict';

    // ensure object constructor
    if (!(this instanceof RemoteProcedure)) {
        return new RemoteProcedure(postMethod);
    }

    // avoid this confusion
    var that = this;

    that.postMethod = postMethod;
    that.callbacks = callbackDictionary;
    that.callbacks = callbackDictionary;
}

RemoteProcedure.prototype.invoke = function remoteInvoke() {

};

RemoteProcedure.prototype.callback = function remoteCallback() {

};

RemoteProcedure.prototype.promise = function remotePromise() {

};

RemoteProcedure.prototype.Q = SimpleFakePromise();

RemoteProcedure.prototype.statics = Object.create(null, {
    uidCount: {
        value: 0,
        configurable: false,
        writable: true
    }
});

RemoteProcedure.prototype.uid = function uid() {
    'use strict';
    // increment the counter
    this.statics.uidCount += 1;
    // reset it if it's 'high'
    this.statics.uidCount = this.statics.uidCount > 1000 ? 0 : this.statics.uidCount;
    // return a uid
    return ['u', Date.now().toString(16).substring(4), this.statics.uidCount, Math.floor(Math.random() * 100000).toString(32)].join('');
}