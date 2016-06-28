/**
 * Functions for executing remote procedures and returning their results
 */
import { createEvent } from './events';

import { 
  ConfiguredRPCEmit,
  Dictionary,
  RPCAsync, 
  RPCCallback,
  RPCDefer, 
  RPCEventType,
  RPCNotify,
} from './interfaces';

import { 
  defer, 
  rangeError, 
  throwIfNotDefer, 
  throwIfNotFunction, 
  typeError,
} from './utils';

export function registerDefer<T>(
  callbacks: Dictionary<RPCAsync<T>>, defer: RPCDefer<T>, uid) {
  
  if (callbacks[uid]) {
    rangeError('Remote Procedure: callback uid already exists!');
  }
  
  throwIfNotDefer(defer, 'Remote Procedure: expecting defer object');

  callbacks[uid] = defer;

  return defer.promise;
}

export function registerCallback<T>(
  callbacks: Dictionary<RPCAsync<T>>, 
  callback: RPCNotify<T> | RPCCallback<T>, 
  uid) {
  
  if (callbacks[uid]) {
    rangeError('Remote Procedure: callback uid already exists!');
  }
  
  throwIfNotFunction(callback, 'Remote Procedure: register callback: ' +
    'expecting callback function');

  callbacks[uid] = callback;

  return uid;
}

export function doPost(postMethod, type, remoteFunction: string, args: any[]) {
  const event = createEvent(type, {
    args,
    fn: remoteFunction,
  });

  postMethod(event);
  
  return event;
}

export function callbackRemote(callbacks: Dictionary<RPCAsync>,
                               postMethod: ConfiguredRPCEmit,
                               type: RPCEventType,
                               remoteFunction: string,
                               args) {

  if (args.length === 0) {
    typeError('RPC: Invalid Invocation: Callback required!');
  }
  
  
  const cb = args.pop();
  const event = doPost(postMethod, type, remoteFunction, args);
  
  return registerCallback(callbacks, cb, event.uid);
}

export function promiseRemote(callbacks: Dictionary<RPCAsync>,
                              postMethod: ConfiguredRPCEmit,
                              type: RPCEventType,
                              remoteFunction: string,
                              args) {
  const d = defer();
  const event = doPost(postMethod, type, remoteFunction, args);
  
  return registerDefer(callbacks, d, event.uid);
}

function create(callbacks: Dictionary<RPCAsync<any>>, postMethod) {

  const boundPRemote = (type, rFun, args) => promiseRemote(
    callbacks, postMethod, type, rFun, args);
  const boundCBRemote = (type, rFun, args) => callbackRemote(
    callbacks, postMethod, type, rFun, args);

  return {
    invoke: (...args) => boundPRemote('invoke', registerDefer, args),
    nodeCallback: (...args) => boundCBRemote(
      'nodeCallback', registerDefer, args),
    promise: (...args) => boundPRemote('promise', registerDefer, args),
  };
}

