/**
 * Project interfaces
 */
export interface Dictionary<T> {
  [key: string]: T;
}

export type RPCAsync<T> = RPCDefer<T> | RPCNotify<T> | RPCCallback<T>; 

export interface RPCCallback<T> {
  (error: Error | null, param: T, ...rest: any[]);
}

export type RPCDefaultAsync =
  'nodeCallback' |
  'observable' |
  'promise' |
  'asyncAwait';

export interface RPCDefer<T> {
  resolve: (...args: any[]) => any;
  reject: (error: Error) => any;
  promise: Promise<T>;
}

export type RPCEventType =
  'ack' |
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
  'removeListener' |
  'removeListenerReturn' |
  'promise' |
  'promiseReturn' |
  'subscribe' | 
  'subscribeReturn';


export interface RPCEmit {
  (message: string, payload: RPCEvent): any;
}

export interface ConfiguredRPCEmit {
  (payload: RPCEvent): any;
}

export interface RPCNotify<T> {
  (param: T, ...args: any[]);
}

export interface RPCObservable<T> {
  subscribe: (next: (param: T) => any, 
              onError: (error: Error) => any,
              onComplete: () => any) => () => void;
}

export interface RPCOn {
  (message: string, callback: (payload: RPCPayload) => void): () => void;
}

export interface RPCConfig {
  asyncType?: RPCDefaultAsync;
  emit: RPCEmit;
  enableStackTrace: boolean;
  maxAckDelay?: number;
  message: string;
  on: RPCOn;
  remote: Object;
  cemit?: ConfiguredRPCEmit;
  useAcks?: Dictionary<{ uid: string, timeout: any }>;
}

/**
 * JavaScript error with a code number
 */
export interface CodedError extends Error {
  code?: number;
}

/**
 * Serializable Error
 */
export interface RPCError {
  code?: number;
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
  result: any[];
}

export type RPCPayload = 
  RPCInvocationPayload | RPCReturnPayload | RPCErrorPayload;

export interface RPCEvent {
  type: RPCEventType;
  payload: RPCPayload;
  uid: string;
  useAck?: boolean;
}

export interface RPC {
  config: RPCConfig;
  destroy();
  remote: Object;
}

