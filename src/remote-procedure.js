function RemoteProcedure(postMethod, callbackDictionary, promiseLib) {
    'use strict';

    // ensure object constructor
    if (!(this instanceof RemoteProcedure)) {
        return new RemoteProcedure(postMethod);
    }

    // avoid this confusion
    var that = this;

    that.callbacks = callbackDictionary;
    that.Q = promiseLib || false;
}

RemoteProcedure.prototype.invoke = function remoteInvoke() {

};

RemoteProcedure.prototype.callback = function remoteCallback() {

};

RemoteProcedure.prototype.promise = function remotePromise() {

};