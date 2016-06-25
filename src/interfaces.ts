export interface Dictionary<T> {
  [key: string]: T;
}

export type RPCEventType =
  'create' |
  'createReturn' |
  'destroy' | 
  'destroyReturn' |
  'invoke' |
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
  (message: string, payload: RPCEvent): any;
}

export interface ConfiguredRPCEmit {
  (payload: RPCEvent): any;
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
  type?: string;
}

export interface RPCInvocationPayload {
  fn: string;
  args: any[];
}

export interface RPCErrorPayload {
  error: RPCError;
}

export interface RPCReturnPayload {
  result: any;
}

export type RPCPayload = 
  RPCInvocationPayload | RPCReturnPayload | RPCErrorPayload;

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

