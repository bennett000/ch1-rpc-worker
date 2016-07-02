/**
 * Functions for executing remote procedures and returning their results
 */
import { Promise } from 'es6-promise';
import { createEvent } from './events';

import { 
  ConfiguredRPCEmit,
  RPCAsync, 
  RPCAsyncContainerDictionary,
  RPCNodeCallback,
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
  callbacks: RPCAsyncContainerDictionary, defer: RPCDefer<T>, uid) {
  
  if (callbacks[uid]) {
    rangeError('Remote Procedure: callback uid already exists!');
  }
  
  throwIfNotDefer(defer, 'Remote Procedure: expecting defer object');

  callbacks[uid] = {
    async: defer,
    type: 'promise',
  };

  return defer.promise;
}

export function registerCallback<T>(
  callbacks: RPCAsyncContainerDictionary, 
  callback: RPCNotify<T> | RPCNodeCallback<T>, 
  uid) {
  
  if (callbacks[uid]) {
    rangeError('Remote Procedure: callback uid already exists!');
  }
  
  throwIfNotFunction(callback, 'Remote Procedure: register callback: ' +
    'expecting callback function');

  callbacks[uid] = {
    async: callback,
    type: 'nodeCallback',
  };

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

export function callbackRemote(callbacks: RPCAsyncContainerDictionary,
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

export function promiseRemote(callbacks: RPCAsyncContainerDictionary,
                              postMethod: ConfiguredRPCEmit,
                              type: RPCEventType,
                              remoteFunction: string,
                              args) {
  const d = defer();
  const event = doPost(postMethod, type, remoteFunction, args);
  
  return registerDefer(callbacks, d, event.uid);
}

export function create(c: RPCConfig, 
                callbacks: RPCAsyncContainerDictionary,
                fullFnName: string,
                fnType?: RPCDefaultAsync) {
  switch (fnType) {
    case 'promise':
      return (...args) => promiseRemote(
        callbacks, c.emit, 'promise', fullFnName, args);
    
    case 'nodeCallback':
      return (...args) => callbackRemote(callbacks, c.emit, 'nodeCallback', 
        fullFnName, args); 
    //
    // case 'nodeOn':
    //   return (...args) => 
    
    default:
      return create(c, callbacks, fullFnName, c.defaultAsyncType);
  }
}
