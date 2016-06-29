/**
 * Main module "really ties the project together"
 */
import { Remote, RemoteDesc, RPC, RPCConfig } from './interfaces';
import { isObject, pnoop, typeError, throwIfNotFunction} from './utils';
import { create as createRemote, createRemoteDescFrom } from './remote';
import * as nOp from './network-over-post';

import { 
  DEFAULT_ASYNC_TYPE,
  DEFAULT_MESSAGE,
  DEFAULT_CREATE_RETRY,
  DEFAULT_CREATE_RETRY_CURVE,
  DEFAULT_CREATE_WAIT,
} from './constants';

/**
 * Where `RemoteType` is the description of the interface you _expect_ to be 
 * exposed *by the "other side"*
 * @param config
 * @param remote optional remote to expose *on the "other side"*
 */
export function create<RemoteType>(config: RPCConfig, remote?: Remote, 
                                   remoteDesc?: RemoteDesc): RPC {
  remote = validateRemote(remote);
  config = validateConfig(config, remote);
  
  const local: RemoteType = Object.create(null);
  const callbacks = Object.create(null);
  const combinedDesc = createRemoteDescFrom(config, remote, remoteDesc);
  let destroy = pnoop;
  console.log('comb', combinedDesc)

  const isReady = nOp
    .create(config, callbacks, combinedDesc,)
    .then((network) => {
      createRemote<RemoteType>(config, callbacks, network.remoteDesc, local); 
      destroy = network.off;
    });
  
  return {
    config,
    destroy: () => {
      Object.keys(local).forEach((key) => delete local[key]);
      Object.keys(callbacks).forEach((key) => delete callbacks[key]);
      return destroy()
        .then(() => { destroy = pnoop; });
    },
    ready: isReady,
    remote: local,
  };
}

export function validateRemote(r: Object) {
  r = r || Object.create(null);
  
  if (!isObject(r)) {
    typeError('validateRemote: remote must be an object');
  }
  
  return r;
}

export function validateConfig(c: RPCConfig, remote: Object): RPCConfig {
  throwIfNotFunction(c.on, 'validateConfig: config requires an on method');
  throwIfNotFunction(c.emit, 'validateConfig: config requires an emit method');


  c.defaultAsyncType = c.defaultAsyncType || DEFAULT_ASYNC_TYPE;
  c.defaultCreateRetry = c.defaultCreateRetry || DEFAULT_CREATE_RETRY;
  c.defaultCreateRetryCurve = c.defaultCreateRetryCurve || 
    DEFAULT_CREATE_RETRY_CURVE;
  c.defaultCreateWait = c.defaultCreateWait || DEFAULT_CREATE_WAIT;
  c.enableStackTrace = c.enableStackTrace || false;
  c.maxAckDelay = c.maxAckDelay || 5000;
  c.message = c.message || DEFAULT_MESSAGE;

  c.cemit = (event) => c.emit(c.message, event);
  c.useAcks = c.useAcks ? Object.create(null) : null;
  c.remote = remote;
  
  return Object.freeze(c);
}
