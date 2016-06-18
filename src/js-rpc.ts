import { RemoteProcedure } from './remote-procedure';
import { DOT, isFunction, noop } from './shared';

/**
 * Returns an RPC Object which will allow the user to invoke functions on the
 * given remote procedure.  This module assumes the given remote procedures
 * operate asynchronously.
 *
 * One of the implications of this is that two RPCs cannot operate in the same
 * process unless their listen/post calls operate with some form of asynchronous
 * mechanism, like a setTimeout/setImmediate, a nextTick, animations frames,
 * message loopbacks, etc...
 *
 * Please have an understanding of JavaScript asynchronicity before using this
 * module
 *
 * @param remote {Object} interface to a remote procedure
 * @param spec {Object=} optionally specifies alternate post/listen functions
 * on the remote
 * @returns {RPC}
 * @constructor
 *
 * specifying the remote functions for a web worker:
 * {
 *      "listen":"addEventListener",
 *      "post":"postMessage",
 *      "message":"message"
 *      "listenAttr":"data"
 *      "error":"error"
 * }
 */
function RPC(remote, spec) {

  // ensure object constructor
  if (!(this instanceof RPC)) {
    return new RPC(remote, spec);
  }

  // scope that this!
  const that = this;
  // references to functions that are called onmessage
  const exposedProcedures = Object.create(null);
  // waiting for return message to be called
  const resultCallbacks = Object.create(null);
  // waiting for return message to be called
  const listenerIds = Object.create(null);
  /** @type {{local: { ready: boolean, config: boolean }}} */
  const flags = {
      local: {
        ready: false,
        config: false
      },
      remote: {
        ready: false,
        config: false
      },
      global: {
        ready: false,
        config: false
      }
    };
    /** @type {{ local: { ready: Array.<function>, config: Array.<function}}} */
  const queues = {
      local: {
        ready: [],
        config: []
      },
      remote: {
        ready: [],
        config: []
      }
    };
  const callingFunctions = Object.create(null);

  let log;

  /**
   * @param obj {*}
   * @returns {boolean}
   */
  function isObject(obj) {
    return obj && typeof obj === 'object';
  }

  /**
   * @param obj {*}
   */
  function forEach(obj, fn) {
    if (!isObject(obj)) { return; }
    if (!isFunction(fn)) { return; }
    Object.keys(obj).forEach(function (attr) {
      fn(obj[attr], attr);
    });
  }

  /**
   * @param cb {function(...)}
   */
  function eachQueue(cb) {
    if (!isFunction(cb)) { return; }
    forEach(queues, function (category) {
      forEach(category, function (queue, name) {
        cb(queue, name, category);
      });
    });
  }

  function eachFlags(cb) {
    if (!isFunction(cb)) { return; }
    forEach(flags, function (category) {
      forEach(category, function (flag, name) {
        cb(flag, name, category);
      });
    });
  }

  /**
   * Reports on the status of the object, initially for tracking 'memory'
   * @returns {Object}
   */
  function status() {
    return {
      resultCallbacks: Object.keys(resultCallbacks).length,
      listenerIds: Object.keys(listenerIds).length,
      readyQueue: queues.local.ready.length,
      remoteReadyQueue: queues.remote.ready.length
    };
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

    if ((!spec.error) || (spec.error === '') || (typeof spec.error !== 'string')) {
      spec.error = false;
    }

    if ((!spec.listenAttr) || (spec.listenAttr === '') || (typeof spec.listenAttr !== 'string')) {
      spec.listenAttr = false;
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
    that['post'] = function () {
      remote[spec.post].apply(remote, Array.prototype.slice.call(arguments, 0));
    };

    if (spec.message) {
      that['listen'] = function wrapAddEvent(fn) {
        if (isFunction(fn) === false) { return; }

        remote[spec.listen].call(remote, spec.message, fn);
      };
    } else {
      that['listen'] = function () {
        remote[spec.listen].apply(remote, Array.prototype.slice.call(arguments, 0));
      };
    }
    if (spec.error) {
      remote[spec.listen].call(remote, spec.error, function (msg) {
        if (spec.listenAttr) {
          log.error('RPC: remote error: ', msg.message);
        } else {
          log.error(msg);
        }
      });
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
   * safely removes a callback
   * @param uid {string}
   */
  function removeCallback(uid) {
    if (resultCallbacks[uid]) {
      delete resultCallbacks[uid];
    }
  }

  function onNotices(data) {
    if (!validateMessageData(data)) {
      return;
    }
    data.forEach(function (notice) {
      if (isFunction(resultCallbacks[notice.uid])) {
        resultCallbacks[notice.uid].apply(null, notice.notice);
      } else {
        log.warn('RPC: notice has no callback for ', notice.uid);
      }
    });
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
      // invalid
      if (!validateResultCallbackDatum(result)) {
        return;
      }
      // error case
      if (result.error) {
        if (isFunction(resultCallbacks[result.uid].f)) {
          // promise case
          resultCallbacks[result.uid].f(new Error(result.error));
        } else {
          // callback case
          resultCallbacks[result.uid].t(new Error(result.error));
        }
        // cleanup
        removeCallback(result.uid);
        return;
      }
      // success case!
      if (isFunction(resultCallbacks[result.uid].f)) {
        // promise callback
        resultCallbacks[result.uid].t(result.result);
      } else {
        // callback callback
        resultCallbacks[result.uid].t(null, result.result);
      }
      // cleanup
      removeCallback(result.uid);
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

    message['error'] = msg || 'undefined error message';
    message['uid'] = uid;
    errorObj['results'].push(message);

    that.post(JSON.stringify(errorObj));
  }

  /**
   * posts a notice to a specific callback
   * @param noticeData {*}
   * @param uid {string} uid of the callback
   */
  function postNotice(noticeData, uid) {
    var noticeObj = {}, data = {};
    noticeObj['notices'] = [];

    data['notice'] = noticeData;
    data['uid'] = uid;
    noticeObj['notices'].push(data);

    that.post(JSON.stringify(noticeObj));
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
  callingFunctions['invoke'] = function onInvoke(fn, details) {
    try {
      postResult(fn.apply(null, details.args), details.uid);
    } catch (err) {
      postResultError(err.message, details.uid);
    }
  };

  callingFunctions['listen'] = function onListen(fn, details) {
    try {
      listenerIds[details.uid] = fn.apply(null, details.args.concat(
        [
          function () {
            postNotice(Array.prototype.slice.call(arguments, 0), details.uid);
          }]));
    } catch (err) {
      log.error('RPC: Error registering listen function ', err.message, details.uid);
    }
  };

  callingFunctions['ignore'] = function onIgnore(fn, details) {
    try {
      if (!details.args[0]) {
        log.error('RPC: ignore: expects at least one argument');
        return;
      }
      if (!listenerIds[details.args[0]]) {
        log.error('RPC: ignore: no registered listener');
        return;
      }

      fn.call(null, listenerIds[details.args[0]]);
      delete listenerIds[details.args[0]];
      postResult(true, details.uid);
    } catch (err) {
      postResultError(err.message, details.uid);
    }
  };

  callingFunctions['promise'] = function onPromise(fn, details) {
    var promise;
    try {
      promise = fn.apply(null, details.args).then(function onPromiseVictory(result) {
        postResult(result, details.uid);
      }, function onPromiseFailure(reason) {
        postResultError(reason.message, details.uid);
      });
      // if the promise has a done mechanism, use it
      if (isFunction(promise.done)) {
        promise.done();
      }
    } catch (err) {
      postResultError(err.message, details.uid);
    }
  };

  callingFunctions['callback'] = function onCallback(fn, details) {
    try {
      fn.apply(null, details.args.concat([function (err) {
        if (err) {
          postResultError(err.message, details.uid);
          return;
        }
        postResult(Array.prototype.slice.call(arguments, 1), details.uid);
      }]));
    } catch (err) {
      postResultError(err.message, details.uid);
    }
  };

  /**
   * Handles the invoke/callback/promise switch
   * @param type {string} invoke/callback/pro...
   * @param data {Array<Object>}
   */
  function onCalling(type, data) {
    if (!validateMessageData(data)) {
      return;
    }
    data.forEach(function (calling) {
      if (!validateCallDatum(calling)) {
        return;
      }
      var obj = getNestedObject(exposedProcedures, calling.fn), err;

      if (typeof obj !== 'function') {
        err = ['RPC: onCalling: error invalid function ', calling.fn].join();
        log.error(err);
        postResultError(err, calling.uid);
        return;
      }
      // call, and callback
      if (isFunction(callingFunctions[type])) {
        callingFunctions[type](obj, calling);
      } else {
        log.error('RPC: onCalling no handler for ', type);
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
        that.remotes[exposeFn] = new RemoteProcedure(that.post, resultCallbacks, exposeFn);
      } else if (splitFns.length > 1) {
        fn = splitFns.pop();
        obj = getNestedObject(that.remotes, splitFns.join(DOT), true);

        if (obj) {
          obj[fn] = new RemoteProcedure(that.post, resultCallbacks, exposeFn);
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
        flags.remote.ready = true;
        isReady();
      }
    }
    if (data['config']) {
      if (data.config === true) {
        flags.remote.config = true;
        isConfig();
      }
    }
    if (data['results']) {
      onResults(data.results);
    }
    if (data['notices']) {
      onNotices(data.notices);
    }
    if (data['invoke']) {
      onCalling('invoke', data.invoke);
    }
    if (data['listen']) {
      onCalling('listen', data.listen);
    }
    if (data['ignore']) {
      onCalling('ignore', data.ignore);
    }
    if (data['promise']) {
      onCalling('promise', data.promise);
    }
    if (data['callback']) {
      onCalling('callback', data.callback);
    }
    if (data['expose']) {
      onExpose(data.expose);
    }
  }

  /**
   * @param data {*}
   * @returns {Object}
   */
  function safeJSONParse(data) {
    try {
      return JSON.parse(data);
    } catch (err) {
      log.error('RPC: error parsing JSON: ', err.message, data);
      return null;
    }
  }

  /**
   * Attaches an internal listener
   */
  function initListener(spec) {
    that.listen(function onMessage(data) {
      if ((spec) && (spec.listenAttr)) {
        data = safeJSONParse(data[spec.listenAttr]);
      } else {
        data = safeJSONParse(data);
      }
      if (data === null) {
        return;
      }
      handleMessage(data);
    });
  }

  function safeApply(fn, args) {
    if (!Array.isArray(args)) {
      args = [];
    }
    try {
      fn.apply(null, args);
    } catch (err) {
      // fail over
    }
  }

  function enlightenQueue(queue) {
    queue.forEach(function (fn) {
      safeApply(fn);
    });
  }

  function _isStage(setStage, name) {
    if (setStage === true) {
      flags.local[name] = true;
      var msg = {};
      msg[name] = true;
      that.post(JSON.stringify(msg));
    }
    flags.global[name] = flags.remote[name] && flags.local[name];
    if (flags.remote[name]) {
      enlightenQueue(queues.remote[name]);
    }
    if (flags.global[name]) {
      enlightenQueue(queues.local[name]);
    }
    return flags.global[name];
  }

  /**
   * @param setReady {boolean=} will set 'this side' to ready
   * @returns {boolean}
   */
  function isReady(setReady) {
    return _isStage(setReady, 'ready');
    //if (setReady === true) {
    //    flags.local.ready = true;
    //    that.post(JSON.stringify({
    //                                 ready: true
    //                             }));
    //}
    //flags.global.ready = flags.remote.ready && flags.local.ready;
    //if (flags.remote.ready) {
    //    queues.remote.ready.forEach(function (readyFn) {
    //        safeApply(readyFn);
    //    });
    //    queues.remote.ready = [];
    //}
    //if (flags.global.ready) {
    //    queues.local.ready.forEach(function (readyFn) {
    //        safeApply(readyFn);
    //    });
    //    queues.local.ready = [];
    //}
    //return flags.global.ready;
  }

  /**
   * @param setConfig {boolean=} will set 'this side' to config
   * @returns {boolean}
   */
  function isConfig(setConfig) {
    return _isStage(setConfig, 'config');
  }

  function onConfig(fn) {
    if (isFunction(fn)) {
      queues.local.config.push(fn);
    }
    isConfig();
  }

  function onRemoteConfig(fn) {
    if (isFunction (fn)) {
      queues.remote.config.push(fn);
    }
    isConfig();
  }

  /**
   * callbacks to run when ready
   * @param fn {function(Error|null,...)}
   */
  function onReady(fn) {
    if (isFunction(fn)) {
      queues.local.ready.push(fn);
    }
    isReady();
  }

  /**
   * callbacks to run when remote is ready, local's status is ignored
   * @param fn {function(Error|null,...)}
   */
  function onRemoteReady(fn) {
    if (isFunction(fn)) {
      queues.remote.ready.push(fn);
    }
    isReady();
  }

  /**
   * Takes any number of parameters and sends them to the remote as an error
   * This function is meant for 'emergency' error reporting.  Normal errors
   * should occur through node.js style callbacks, or promises
   */
  function error() {
    var args = Array.prototype.slice.call(arguments, 0);
    try {
      that.post(JSON.stringify({error: args}));
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
   * initialize the RPC object
   * @param r {Object} remote object, like socket.io, or a web worker
   * @param spec {Object=} defines remote functions to use
   */
  function init(r, spec) {
    if ((typeof r !== 'object') || (r === null)) {
      throw new TypeError('RPC: Parameter one must be an object with valid listen/post methods');
    }

    if (typeof console !== 'undefined') {
      log = console;
    } else {
      log = {
        log: noop,
        info: noop,
        warn: noop,
        error: noop,
      };
    }

    spec = validateSpec(spec);

    // expose
    exposePostListen(spec);
    that['remotes'] = Object.create(null);
    that['expose'] = expose;
    that['isReady'] = isReady;
    that['onReady'] = onReady;
    that['onRemoteReady'] = onRemoteReady;
    that['isConfig'] = isConfig;
    that['onConfig'] = onConfig;
    that['onRemoteConfig'] = onRemoteConfig;
    that['setLogger'] = setLogger;
    that['error'] = error;
    that['status'] = status;

    // listen!
    initListener(spec);
  }

  // start the ball rolling!
  init(remote, spec);
}
