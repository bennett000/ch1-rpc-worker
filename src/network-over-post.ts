import { RPCConfig, RPCEvent, RPCPayload } from './interfaces';

import {
  createTypeError,
  isFunction,
  typeError
} from './utils';

import {
  createEvent,
  createErrorEvent,
} from './events';

const responders = {
  invoke,
  invokeReturn,
  on: onRemote,
  onReturn: onRemoteReturn,
  off: offRemote,
  offReturn: offRemoteReturn,
  nodeCallback,
  nodeCallbackReturn,
  promise,
  promiseReturn,
};

export function create(config: RPCConfig) {
  const off = on(config);
}

function getFinalFunction(remote: Object, fnName: string) {
  const names = fnName.split('.').filter((el) => el);

  // invalid function name case
  if (names.length === 0) {
    return createTypeError(`getFinalFunction: ${fnName} not found on remote`);
  }

  // "first level" case
  if (names.length === 1) {
    if (isFunction(remote[names[0]])) {
      return remote[names[0]];
    }
    return createTypeError(`getFinalFunction: ${fnName} is not a function: ` +
      typeof remote[names[0]]);
  }

  // invalid sub object case
  if (!remote[names[0]]) {
    return createTypeError(`getFinalFunction: ${names[0]} is not a ` +
      'namespace (sub-object) on remote');
  }

  // sub object case
  if (names.length === 2) {
    return getFinalFunction(remote[names[0]], names[1]);
  }

  // deeper object case
  return getFinalFunction(remote[names.shift()], names.join('.'));
}

function safeCall(c: RPCConfig, fnName: string, args: any[]) {
  const fn = getFinalFunction(c.remote, fnName);

  if (fn instanceof Error) {
    return fn;
  }

  try {
    return fn.apply(null, args);
  } catch (err) {
    return err;
  }
}

function safeCallback(c: RPCConfig, callbacks: Object) {

}

function invoke(c: RPCConfig, payload: RPCPayload, uid: string) {
  const result = safeCall(c, payload.fn, payload.args);

  if (result instanceof Error) {
    c.cemit(createErrorEvent(c, 'invokeReturn', result));
    return;
  }

  c.cemit(createEvent('invokeReturn', { result }, uid));
}

function invokeReturn(c: RPCConfig, payload: RPCPayload, uid: string,
                      callbacks: Object) {

}

function onRemote(c: RPCConfig, payload: RPCPayload, uid: string,
                  callbacks: Object) {

  const result = safeCall(c, payload.fn, payload.args);

  if (result instanceof Error) {
    c.cemit(createErrorEvent(c, 'onReturn', result));
    return;
  }

  if (callbacks[uid]) {
    c.cemit(createErrorEvent(c, 'onReturn', new Error('invokeReturn: ' + '' +
      `callback with uid: ${uid} alrady registered`)));
    return;
  }

  const onReturn = () => {
    cemit(createEvent(c, 'onReturn', {}));
  };

  callbacks[uid] = onReturn;
}

function onRemoteReturn(c: RPCConfig, payload: RPCPayload, uid: string,
                        callbacks: Object) {

}

function offRemote(c: RPCConfig, payload: RPCPayload, uid: string,
                   callbacks: Object) {

}

function offRemoteReturn(c: RPCConfig, payload: RPCPayload, uid: string,
                         callbacks: Object) {

}

function nodeCallback(c: RPCConfig, payload: RPCPayload, uid: string,
                      callbacks: Object) {

}

function nodeCallbackReturn(c: RPCConfig, payload: RPCPayload, uid: string,
                            callbacks: Object) {

}

function promise(c: RPCConfig, payload: RPCPayload, uid: string,
                 callbacks: Object) {

}

function promiseReturn(c: RPCConfig, payload: RPCPayload, uid: string,
                       callbacks: Object) {

}

export function on(c: RPCConfig) {
  const callbacks = Object.create(null);

  function respondToEvent(event: RPCEvent) {
    responders[event.type](c, event.payload, event.uid,
      callbacks);
  }

  return c.on(c.message, (payload) => {
    if (!Array.isArray(payload)) {
      typeError('on: expected payload to be an array');
    }

    payload.forEach(respondToEvent);
  });
}


