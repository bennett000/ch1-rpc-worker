import { DEFAULT_MESSAGE } from './constants';
import { RPC, RPCConfig } from './interfaces';
import { isObject, typeError, throwIfNotFunction} from './utils';


export function create<Local extends Object, 
  Remote extends Object>(remote: Local, config: RPCConfig): RPC {
  validateRemote(remote);
  config = validateConfig(config, remote);
  
  const destroy = createRemote(remote, config);
  
  return {
    config,
    destroy,
    remote: {},
  };
}

export function validateRemote(r: Object) {
  if (!isObject(r)) {
    typeError('validateRemote: remote must be an object');
  }
}

export function validateConfig(c: RPCConfig, remote: Object): RPCConfig {
  throwIfNotFunction(c.on, 'validateConfig: config requires an on method');
  throwIfNotFunction(c.emit, 'validateConfig: config requires an emit method');
  
  c.enableStackTrace = c.enableStackTrace || false;
  c.message = c.message || DEFAULT_MESSAGE;
  c.remote = remote;
  
  c.cemit = (event) => c.emit(c.message, event);
  
  return Object.freeze(c);
}

function createRemote(remote: Object, config: RPCConfig): () => void {
    
}
