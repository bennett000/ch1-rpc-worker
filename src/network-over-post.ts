import { typeError } from './utils';
import { safeCall } from './remote';
import * as evt from './events';

import { 
  RPCConfig, 
  RPCEvent,
  RPCErrorPayload,
  RPCInvocationPayload,
  RPCPayload,
  RPCReturnPayload,
} from './interfaces';

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



function safeCallback(c: RPCConfig, callbacks: Object) {

}

function invoke(c: RPCConfig, payload: RPCInvocationPayload, uid: string) {
  const result = safeCall(c, payload.fn, payload.args);

  if (result instanceof Error) {
    c.cemit(evt.createError(c, 'invokeReturn', result));
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
    c.cemit(evt.createError(c, 'onReturn', result));
    return;
  }

  if (callbacks[uid]) {
    c.cemit(evt.createError(c, 'onReturn', new Error('invokeReturn: ' + '' +
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


