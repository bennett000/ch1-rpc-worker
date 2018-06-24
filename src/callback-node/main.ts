import * as rpc from '../rpc/js-rpc';

// export function createNodeListener(emit, makeEvent, id) {
//   return (...args: any[]) => {
//     emit(makeEvent(RPCEventType.fnReturn, { result: args }, id));
//   };
// }

// export function nodeOn(
//   c: RPCConfig,
//   payload: RPCPayload,
//   id: string,
//   callbacks: Object,
// ) {
//   if (isRPCInvocationPayload(payload)) {
//     let listeners;
//     if (!callbacks[payload.fn]) {
//       listeners = Object.create(null);
//       callbacks[payload.fn] = {
//         async: listeners,
//         type: 'nodeEventInternal',
//       };
//     } else {
//       listeners = callbacks[payload.fn].async;
//     }

//     if (listeners[id]) {
//       rangeError('listener data already registered');
//     }

//     // create a new factory so we can get a new instance of a listener
//     const factory = createNewFunctionFrom(createNodeListener);
//     // hydrate the new listener since it is a pure function on global scope
//     const listener = factory(c.emit, createEvent, id);

//     // register it for future deletion
//     listeners[id] = {
//       listener: <RPCNotify<any>>listener,
//       id,
//     };
//   } else {
//     c.emit(
//       createErrorEvent(
//         c,
//         RPCEventType.fnReturn,
//         new TypeError('nodeOn: invalidPayload'),
//         id,
//       ),
//     );
//   }
// }

// function nodeRemoveListener(
//   c: RPCConfig,
//   payload: RPCPayload,
//   uuid: string,
//   callbacks: Object,
//   id: string,
// ) {
//   if (isRPCInvocationPayload(payload)) {
//     let listeners;
//     if (!callbacks[payload.fn]) {
//       return;
//     } else {
//       listeners = callbacks[payload.fn].async;
//     }

//     if (listeners[uuid]) {
//       rangeError('listener data already registered');
//     }

//     // create a new factory so we can get a new instance of a listener
//     const factory = createNewFunctionFrom(createNodeListener);
//     // hydrate the new listener since it is a pure function on global scope
//     const listener = factory(c.emit, createEvent, uuid);

//     // register it for future deletion
//     listeners[uuid] = {
//       listener: <RPCNotify<any>>listener,
//       uuid,
//     };
//   } else {
//     c.emit(
//       createErrorEvent(
//         c,
//         RPCEventType.fnReturn,
//         new TypeError('nodeOn: invalidPayload'),
//         uuid,
//       ),
//     );
//   }
// }

// export function nodeCallback(c: RPCConfig, payload: RPCPayload, id: string) {
//   if (isRPCInvocationPayload(payload)) {
//     payload.args.push((err, ...args) => {
//       if (err) {
//         c.emit(createErrorEvent(c, RPCEventType.fnReturn, err, id));
//       } else {
//         c.emit(createEvent(RPCEventType.fnReturn, { result: args }, id));
//       }
//     });

//     const result = safeCall(c, payload.fn, payload.args);

//     if (result instanceof Error) {
//       c.emit(createErrorEvent(c, RPCEventType.fnReturn, result, id));
//       return;
//     }
//   } else {
//     c.emit(
//       createErrorEvent(
//         c,
//         RPCEventType.fnReturn,
//         new TypeError('nodeCallback: invalidPayload'),
//         id,
//       ),
//     );
//   }
// }
