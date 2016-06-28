/**
 * Main module "really ties the project together"
 */
import { Remote, RemoteDesc, RPC, RPCConfig } from './interfaces';
import { isObject, typeError, throwIfNotFunction} from './utils';
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
  
  const local = {
    
  };
  
  const isReady = nOp.create(config, remoteDesc)
    .then((otherRemoteDesc: RemoteDesc) => {
      
    })
    .catch();
  
  const destroyRemote = createRemote(remote, config);
  
  
  return {
    config,
    destroy: () => {
      destroyRemote();
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

function createRemote(remote: Object, config: RPCConfig): () => void {
    
}
