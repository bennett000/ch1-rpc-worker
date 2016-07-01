/**
 * Event functions
 */
import { uid } from './utils';
import { createRPCError } from './rpc-error';

import {
  RPCConfig, RPCEvent, RPCEventType, RPCPayload,
} from './interfaces';


/**
 * create an event object
 */
export function createEvent(type: RPCEventType, payload: RPCPayload,
                            givenUid?: string): RPCEvent {
  return {
    payload,
    type,
    uid: givenUid || uid(),
  };
}

/**
 * create an error event object
 */
export function createErrorEvent(c: RPCConfig, type: RPCEventType,
                                 error: Error, uid?: string): RPCEvent {

  return createEvent(type, { error: createRPCError(c, error) }, uid);
}

