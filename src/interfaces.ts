export interface Dictionary<T> {
  [key: string]: T;
}

export type RPCEventType = 'invoke' | 
  'invokeReturn' | 
  'nodeCallback' | 
  'nodeCallbackReturn' |
  'on' |
  'onReturn' |
  'off' |
  'offReturn' |
  'promise' |
  'promiseReturn';


export interface RPCEmit {
  (message: string, payload: RPCPayload): any;
}

export interface ConfiguredRPCEmit {
  (payload: RPCPayload): any;
}

export interface RPCOn {
  (message: string, callback: (payload: RPCPayload) => void): () => void;
}

export interface RPCConfig {
  emit: RPCEmit;
  enableStackTrace: boolean;
  message: string;
  on: RPCOn;
  remote: Object;
  cemit?: ConfiguredRPCEmit;
}

export interface RPCError {
  message: string;
  stack?: string;
  code?: number;
}

export interface RPCPayload {
  fn?: string;
  args?: any[];
  result?: any;
  error?: RPCError;
}

export interface RPCEvent {
  type: RPCEventType;
  payload: RPCPayload;
  uid: string;
}

export interface RPC {
  config: RPCConfig;
  destroy();
  remote: Object;
}

