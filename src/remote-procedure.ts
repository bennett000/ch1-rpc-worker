/**
 * Functions for executing remote procedures and returning their results
 */
import { Promise } from 'es6-promise';
import { createEvent } from './events';

import { 
  ConfiguredRPCEmit,
  Dictionary,
  RPCAsync, 
  RPCCallback,
  RPCConfig,
  RPCDefaultAsync,
  RPCDefer, 
  RPCEvent,
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

export function callbackRemote(callbacks: Dictionary<RPCAsync<any>>,
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

export function promiseRemote(callbacks: Dictionary<RPCAsync<any>>,
                              postMethod: ConfiguredRPCEmit,
                              type: RPCEventType,
                              remoteFunction: string,
                              args) {
  const d = defer();
  const event = doPost(postMethod, type, remoteFunction, args);
  
  return registerDefer(callbacks, d, event.uid);
}

export function create(c: RPCConfig, 
                callbacks: Dictionary<RPCAsync<any>>,
                fullFnName: string,
                fnType?: RPCDefaultAsync) {
  switch (fnType) {
    case 'promise':
      return (...args) => promiseRemote(
        callbacks, c.cemit, 'promise', fullFnName, args);
    
    case 'nodeCallback':
      return (...args) => callbackRemote(callbacks, c.cemit, 'nodeCallback', 
        fullFnName, args); 
    
    default:
      return create(c, callbacks, fullFnName, c.defaultAsyncType);
  }
}
