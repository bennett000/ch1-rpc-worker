import { Promise } from 'es6-promise';
import {
  Dictionary,
} from './interfaces';

let uidCount = 0;

/**
 * Encapsulates the grunt functions that make the RPC work
 */
export function RemoteProcedure(postMethod: Function,
                                callbackDictionary: Dictionary<Function>,
                                remoteFn: string) {
  // ensure object constructor
  if (!(this instanceof RemoteProcedure)) {
    return new RemoteProcedure(postMethod, callbackDictionary, remoteFn);
  }

  this.postMethod = postMethod;
  this.callbacks = callbackDictionary;
  this.fn = remoteFn;
}

/**
 * Generates a relatively unique string
 */
RemoteProcedure.prototype.uid = (): string => {
  // increment the counter
  uidCount += 1;
  // reset it if it's 'high'
  uidCount = uidCount > 1000 ? 0 : uidCount;
  // return a uid
  return [
    'u',
    Date.now().toString(16).substring(4),
    uidCount,
    Math.floor(Math.random() * 100000).toString(32)
  ].join('');
};

/**
 * Registers a callback in the callback dictionary
 * @param defer {Object} defer/promise/future
 * @param uid {string} uid of the callback
 */
RemoteProcedure.prototype.registerCallback = (defer, uid) => {
  if (this.callbacks[uid]) {
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
RemoteProcedure.prototype.registerListener = (callback, uid) => {
  if (typeof callback !== 'function') {
    throw new TypeError('Remote Procedure: register listener: expecting ' +
      'callback function');
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
RemoteProcedure.prototype.callRemote = (type, registerFunction, args) => {
  const msg = newMessage();
  const postObj = newPostObject();
  let d = Promise.defer();

  // listener case
  if (type === 'listen') {
    if (args.length === 0) {
      throw new TypeError('RPC: Invalid Listener');
    }
    d = args.pop();
  }

  msg.fn = this.fn;
  msg.uid = this.uid();
  msg.args = args;

  postObj[type].push(msg);

  this.postMethod(JSON.stringify(postObj));
  return registerFunction.call(this, d, msg.uid);
};

/**
 * posts an invoke message
 * @returns {Object}
 */
RemoteProcedure.prototype.invoke = (...args) => {
  return this.callRemote('invoke', this.registerCallback, args);
};

/**
 * posts an callback message
 * @returns {Object}
 */
RemoteProcedure.prototype.callback = (...args) => {
  return this.callRemote('callback', this.registerCallback, args);
};

/**
 * posts a promise message
 * @returns {Object}
 */
RemoteProcedure.prototype.promise = (...args) => {
  return this.callRemote('promise', this.registerCallback, args);
};

/**
 * posts a listen message
 * @returns {Object}
 */
RemoteProcedure.prototype.listen = (...args) => {
  return this.callRemote('listen', this.registerListener, args);
};

/**
 * posts an ignore message
 * @returns {Object}
 */
RemoteProcedure.prototype.ignore = (uid: string) => {
  const rVal = this.callRemote('ignore', this.registerCallback, [uid]);
  if (this.callbacks[uid]) {
    delete this.callbacks[uid];
  }
  return rVal;
};
