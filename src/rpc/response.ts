/**
 * Network over post establishes a network between two processes
 */
import { safeCall } from './remote';
import { createErrorFromRPCError } from './rpc-error';
import { createEvent, createErrorEvent } from './events';

import {
  createNewFunctionFrom,
  defer,
  isDefer,
  isRPCNodeCallback,
  isRPCErrorPayload,
  isRPCInvocationPayload,
  isRPCNotify,
  isRPCReturnPayload,
  rangeError,
  throwIfNotRPCEvent,
  typeError,
  uid,
} from './utils';

import {
  RemoteDesc,
  RPCAsyncContainer,
  RPCAsyncContainerDictionary,
  RPCConfig,
  RPCEvent,
  RPCErrorPayload,
  RPCNotify,
  RPCPayload,
  RPCReturnPayload,
} from './interfaces';

const fnReturn = (
  c: RPCConfig,
  payload: RPCPayload,
  uid: string,
  callbacks: RPCAsyncContainerDictionary,
) => returnPayload(c, payload, callbacks, uid);

const responders = Object.freeze({
  ack,
  invoke,
  fnReturn,
  nodeOn,
  nodeRemoveListener,
  nodeCallback,
  promise,
});

export function create(
  config: RPCConfig,
  callbacks,
  remoteDesc: RemoteDesc,
): Promise<{ off: () => Promise<void>; remoteDesc: RemoteDesc }> {
  const id = uid();

  const initState = createInitializationState(config, remoteDesc, id);

  return initialize(config, initState).then(localRemoteDesc => {
    const off = on(sendAck, config, callbacks, id);
    /** @todo implement RPC destroy here */

    return {
      off: () => new Promise<void>(resolve => resolve(off())),
      remoteDesc: localRemoteDesc,
    };
  });
}

export function createInitializationState(
  config: RPCConfig,
  remoteDesc: RemoteDesc,
  id: string,
) {
  const d = defer();
  const readTimeout = setTimeout(
    () =>
      d.reject(
        new Error(
          'RPC initialization failed, maximum delay of ' +
            `${config.defaultCreateWait}ms exceeded`,
        ),
      ),
    config.defaultCreateWait,
  );

  let delay = config.defaultCreateRetry;

  let createTimeout = setTimeout(fireCreate, delay);

  function fireCreate() {
    config.emit(createEvent('create', { result: [remoteDesc] }));
    delay *= config.defaultCreateRetryCurve;
    createTimeout = setTimeout(fireCreate, delay);
  }

  function clean() {
    clearTimeout(readTimeout);
    stopCreateSpam();
  }

  function stopCreateSpam() {
    clearTimeout(createTimeout);
  }

  return {
    clean,
    defer: d,
    id,
    isCreated: false,
    hasCreated: false,
    localRemoteDesc: null,
    stopCreateSpam,
  };
}

export function initialize(config: RPCConfig, initState): Promise<RemoteDesc> {
  const off = config.on((event: RPCEvent) => {
    const { payload } = event;

    if (isRPCErrorPayload(payload)) {
      throw createErrorFromRPCError(config, payload.error);
    }

    if (!isRPCReturnPayload(payload)) {
      rangeError(
        'unexpected payload received during initialization ' +
          JSON.stringify(event),
      );
    }

    if (isRPCReturnPayload(payload)) {
      if (event.type === 'create') {
        if (initState.hasCreated) {
          return;
        }
        // create local remote
        initState.localRemoteDesc = payload.result[0];
        initState.hasCreated = true;
        config.emit(createEvent('createReturn', { result: [initState.id] }));
      } else if (event.type === 'createReturn') {
        if (initState.isCreated) {
          return;
        }
        initState.stopCreateSpam();
        initState.isCreated = true;
      } else {
        rangeError(
          'unexpected event received during initialization: ' + event.type,
        );
      }
    }

    if (initState.isCreated && initState.hasCreated) {
      initState.clean();
      off();
      initState.defer.resolve(initState.localRemoteDesc);
    }
  });

  return initState.defer.promise;
}

export function ack(c: RPCConfig, event: RPCEvent) {
  if (!c.useAcks) {
    typeError('ack even received but useAcks is disabled');
  }

  const payload = event.payload;

  if (isRPCReturnPayload(payload)) {
    const uid = payload.result[0];

    if (!c.useAcks[uid]) {
      typeError(`ack expecting to find ack timeout for: ${uid}`);
    }

    clearTimeout(c.useAcks[uid]);
    delete c.useAcks[uid];
  } else {
    typeError('ack received invalid payload');
  }
}

export function sendAck(c: RPCConfig, uid: string) {
  c.emit(createEvent('ack', { result: [uid] }));
}

export function invoke(c: RPCConfig, payload: RPCPayload, uid: string) {
  if (isRPCInvocationPayload(payload)) {
    const result = safeCall(c, payload.fn, payload.args);

    if (result instanceof Error) {
      c.emit(createErrorEvent(c, 'fnReturn', result, uid));
      return;
    }

    c.emit(createEvent('fnReturn', { result: [result] }, uid));
  } else {
    c.emit(
      createErrorEvent(
        c,
        'fnReturn',
        new TypeError('invoke: invalidPayload'),
        uid,
      ),
    );
  }
}

export function fireError(
  c,
  payload: RPCErrorPayload,
  asyncReturn: RPCAsyncContainer<any>,
) {
  const error = createErrorFromRPCError(c, payload.error);
  const asyncFn: any = asyncReturn.async;

  switch (asyncReturn.type) {
    case 'promise':
      if (isDefer<any>(asyncFn)) {
        asyncFn.reject(error);
        return;
      }
      break;

    case 'nodeCallback':
      if (isRPCNodeCallback<any>(asyncFn)) {
        asyncFn(error);
        return;
      }
      break;
  }

  throw error;
}

export function fireSuccess(
  c,
  payload: RPCReturnPayload,
  asyncReturn: RPCAsyncContainer<any>,
) {
  const asyncFn = asyncReturn.async;

  switch (asyncReturn.type) {
    case 'promise':
      if (isDefer(asyncFn)) {
        asyncFn.resolve.apply(asyncFn.resolve, payload.result);
        return;
      }
      break;

    case 'nodeCallback':
      if (isRPCNodeCallback(asyncFn)) {
        asyncFn.apply(null, [null].concat(payload.result));
        return;
      }
      break;

    case 'nodeEvent':
      if (isRPCNotify(asyncFn)) {
        asyncFn.apply(null, [null].concat(payload.result));
        return;
      }
      break;
  }

  rangeError('fireSuccess: no async handler');
}

export function returnPayload(
  c: RPCConfig,
  payload: RPCPayload,
  callbacks: RPCAsyncContainerDictionary,
  uid: string,
) {
  if (!callbacks[uid]) {
    rangeError(`invokeReturn: no matching callback for ${uid}`);
  }

  if (isRPCErrorPayload(payload)) {
    fireError(c, payload, callbacks[uid]);
    delete callbacks[uid];
    return;
  } else if (isRPCReturnPayload(payload)) {
    fireSuccess(c, payload, callbacks[uid]);
    delete callbacks[uid];
    return;
  }

  typeError('returnPayload: unexpected payload for event: ' + event.type);
}

export function createNodeListener(emit, createEvent, uid) {
  return (...args: any[]) => {
    emit(createEvent('fnReturn', { result: args }, uid));
  };
}

export function nodeOn(
  c: RPCConfig,
  payload: RPCPayload,
  uid: string,
  callbacks: Object,
) {
  if (isRPCInvocationPayload(payload)) {
    let listeners;
    if (!callbacks[payload.fn]) {
      listeners = Object.create(null);
      callbacks[payload.fn] = {
        async: listeners,
        type: 'nodeEventInternal',
      };
    } else {
      listeners = callbacks[payload.fn].async;
    }

    if (listeners[uid]) {
      rangeError('listener data already registered');
    }

    // create a new factory so we can get a new instance of a listener
    const factory = createNewFunctionFrom(createNodeListener);
    // hydrate the new listener since it is a pure function on global scope
    const listener = factory(c.emit, createEvent, uid);

    // register it for future deletion
    listeners[uid] = {
      listener: <RPCNotify<any>>listener,
      uid,
    };
  } else {
    c.emit(
      createErrorEvent(
        c,
        'fnReturn',
        new TypeError('nodeOn: invalidPayload'),
        uid,
      ),
    );
  }
}

function nodeRemoveListener(
  c: RPCConfig,
  payload: RPCPayload,
  uid: string,
  callbacks: Object,
  id: string,
) {
  if (isRPCInvocationPayload(payload)) {
    let listeners;
    if (!callbacks[payload.fn]) {
      return;
    } else {
      listeners = callbacks[payload.fn].async;
    }

    if (listeners[uid]) {
      rangeError('listener data already registered');
    }

    // create a new factory so we can get a new instance of a listener
    const factory = createNewFunctionFrom(createNodeListener);
    // hydrate the new listener since it is a pure function on global scope
    const listener = factory(c.emit, createEvent, uid);

    // register it for future deletion
    listeners[uid] = {
      listener: <RPCNotify<any>>listener,
      uid,
    };
  } else {
    c.emit(
      createErrorEvent(
        c,
        'fnReturn',
        new TypeError('nodeOn: invalidPayload'),
        uid,
      ),
    );
  }
}

export function nodeCallback(c: RPCConfig, payload: RPCPayload, uid: string) {
  if (isRPCInvocationPayload(payload)) {
    payload.args.push((err, ...args) => {
      if (err) {
        c.emit(createErrorEvent(c, 'fnReturn', err, uid));
      } else {
        c.emit(createEvent('fnReturn', { result: args }, uid));
      }
    });

    const result = safeCall(c, payload.fn, payload.args);

    if (result instanceof Error) {
      c.emit(createErrorEvent(c, 'fnReturn', result, uid));
      return;
    }
  } else {
    c.emit(
      createErrorEvent(
        c,
        'fnReturn',
        new TypeError('nodeCallback: invalidPayload'),
        uid,
      ),
    );
  }
}

export function promise(c: RPCConfig, payload: RPCPayload, uid: string) {
  if (isRPCInvocationPayload(payload)) {
    const result = safeCall(c, payload.fn, payload.args);

    if (result instanceof Error) {
      c.emit(createErrorEvent(c, 'fnReturn', result, uid));
      return;
    }

    result
      .then((...args) => c.emit(createEvent('fnReturn', { result: args }, uid)))
      .catch(err => c.emit(createErrorEvent(c, 'fnReturn', err, uid)));
  } else {
    c.emit(
      createErrorEvent(
        c,
        'fnReturn',
        new TypeError('promise: invalidPayload'),
        uid,
      ),
    );
  }
}

function tryHandler(fn, args, event) {
  try {
    return fn.apply(null, args);
  } catch (err) {
    throw new Error(
      `RPC: No registered handler for event: ${event.type}: ` + err.message,
    );
  }
}

export function on(
  sendAck: (c: RPCConfig, uid: string) => void,
  c: RPCConfig,
  callbacks: RPCAsyncContainerDictionary,
  id: string,
) {
  return c.on(event => {
    throwIfNotRPCEvent(
      event,
      `expecting an RPCEvent: Received: ${typeof event}`,
    );

    tryHandler(
      responders[event.type],
      [c, event.payload, event.uid, callbacks, id],
      event,
    );

    if (event.useAcks && event.type !== 'ack') {
      sendAck(c, event.uid);
    }
  });
}
