import { RPCConfig, RPCEvent, RPCEventType, RPCPayload } from './interfaces';
import { uid } from './utils';

export function createEvent(type: RPCEventType, payload: RPCPayload,
                            givenUid?: string): RPCEvent {
  return {
    payload,
    type,
    uid: givenUid || uid(),
  };
}

export function createErrorEvent(c: RPCConfig, type: RPCEventType,
                                 error: Error): RPCEvent {
  let errorType = 'Error';
  let stack = '';

  if (error instanceof TypeError) {
    errorType = 'TypeError';
  }

  if (c.enableStackTrace) {
    stack = error.stack;
  }

  return {
    payload: {
      error: {
        message: error.message,
        stack,
        type: errorType,
      },
    },
    type,
    uid: uid(),
  };

}

