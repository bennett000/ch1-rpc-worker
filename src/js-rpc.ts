/**
 * Main module "really ties the project together"
 */
import { DEFAULT_MESSAGE } from './constants';
import { RPC, RPCConfig } from './interfaces';
import { isObject, typeError, throwIfNotFunction} from './utils';
import { create } from './network-over-post';

/**
 * @param config
 * @param remote optional remote to expose on the other side
 */
export function create<Local extends Object, 
  Remote extends Object>(config: RPCConfig, remote?: Object): RPC {
  remote = validateRemote(remote);
  config = validateConfig(config, remote);
  
  const isReady = create(config, remote)
    .then(() => {
      
    })
    .catch();
  
  const destroyRemote = createRemote(remote, config);
  
  
  return {
    config,
    destroy: () => {
      destroyRemote();
    },
    ready: isReady,
    remote: {},
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
