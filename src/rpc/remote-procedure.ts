/**
 * Functions for executing remote procedures and returning their results
 */
import { createEvent } from './events';

import {
  ConfiguredRPCEmit,
  RPCAsync,
  RPCAsyncContainerDictionary,
  RPCConfig,
  RPCAsyncType,
  RPCEventType,
} from './interfaces';

import { defer, rangeError, throwIfNotDefer } from './utils';

export function validateRegistration<T>(
  callbacks: RPCAsyncContainerDictionary,
  asyncFn: RPCAsync<T>,
  type: RPCAsyncType,
  uid: string,
) {
  if (callbacks[uid]) {
    rangeError('Remote Procedure: async uid already exists!');
  }

  switch (type) {
    case RPCAsyncType.promise:
      throwIfNotDefer(asyncFn);
      break;

    // case 'nodeCallback':
    //   throwIfNotFunction(asyncFn);
    //   break;

    // case 'nodeEvent':
    //   throwIfNotFunction(asyncFn);
    //   break;
  }
}

export function registerAsync<T>(
  callbacks: RPCAsyncContainerDictionary,
  callback: RPCAsync<T>,
  type: RPCAsyncType,
  uid: string,
) {
  validateRegistration(callbacks, callback, type, uid);

  callbacks[uid] = {
    async: callback,
    type,
  };
}

export function doPost(
  postMethod,
  type: RPCEventType,
  remoteFunction: string,
  args: any[],
) {
  const event = createEvent(type, {
    args,
    fn: remoteFunction,
  });

  postMethod(event);

  return event;
}

// export function callbackRemote(
//   callbacks: RPCAsyncContainerDictionary,
//   postMethod: ConfiguredRPCEmit,
//   type: RPCAsyncType,
//   remoteFunction: string,
//   args,
// ) {
//   if (args.length === 0) {
//     typeError('RPC: Invalid Invocation: Callback required!');
//   }

//   const cb = args.pop();
//   const event = doPost(postMethod, type, remoteFunction, args);

//   registerAsync(callbacks, cb, type, event.uid);
// }

export function promiseRemote(
  callbacks: RPCAsyncContainerDictionary,
  postMethod: ConfiguredRPCEmit,
  eventType: RPCEventType,
  asyncType: RPCAsyncType,
  remoteFunction: string,
  args,
) {
  const d = defer();
  const event = doPost(postMethod, eventType, remoteFunction, args);

  registerAsync(callbacks, d, asyncType, event.uid);

  return d.promise;
}

export function create(
  c: RPCConfig,
  callbacks: RPCAsyncContainerDictionary,
  fullFnName: string,
  fnType?: RPCAsyncType,
) {
  switch (fnType) {
    case RPCAsyncType.promise:
      return (...args) =>
        promiseRemote(
          callbacks,
          c.emit,
          RPCEventType.promise,
          RPCAsyncType.promise,
          fullFnName,
          args,
        );

    // case 'nodeCallback':
    //   return (...args) =>
    //     callbackRemote(callbacks, c.emit, 'nodeCallback', fullFnName, args);

    // case 'nodeEvent':
    //   return (...args) =>
    //     callbackRemote(callbacks, c.emit, 'nodeEvent', fullFnName, args);

    default:
      if (fnType) {
        throw new Error(
          'remote-procedure: Unsupported function type ' + fnType,
        );
      }
      return create(c, callbacks, fullFnName, c.defaultAsyncType);
  }
}
