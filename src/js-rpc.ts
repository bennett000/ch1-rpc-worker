import { DEFAULT_MESSAGE } from './constants';
import { isFunction, typeError } from './utils';
import { RPC, RPCConfig } from './interfaces';


export function create(remote: Object, config: RPCConfig): RPC {
  validateRemote(remote);
  config = validateConfig(config, remote);
  
  const destroy = createRemote(remote, config);
  
  return {
    config,
    destroy,
    remote,
  };
}

export function validateRemote(r: Object) {
  if (typeof r !== 'object') {
    typeError('validateRemote: remote must be an object');
  }
  if (!r) {
    typeError('validateRemote: remote must not be null');
  }
}

export function validateConfig(c: RPCConfig, remote: Object): RPCConfig {
  if (!isFunction(c.on)) {
    typeError('validateConfig: config requires an on method');
  }   
  if (!isFunction(c.emit)) {
    typeError(('validateConfig: config requires an emit method'));
  }
  
  c.enableStackTrace = c.enableStackTrace || false;
  c.message = c.message || DEFAULT_MESSAGE;
  c.remote = remote;
  
  c.cemit = (event) => c.emit(c.message, event);
  
  return Object.freeze(c);
}

function createRemote(remote: Object, config: RPCConfig): () => void {
    
}
