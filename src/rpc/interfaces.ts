/**
 * Project interfaces
 */
import { Promise } from 'es6-promise';

/**
 * Generic Dictionary
 */
export interface Dictionary<T> {
  [key: string]: T;
}

/**
 * Where `T` is the type of the complete interface you wish to expose
 */
export interface Remote<T> extends Dictionary<Function|Object> { }

/**
 * Specify async types on the remote
 */
export interface RemoteDesc extends 
  Dictionary<RPCDefaultAsync | Dictionary<RPCDefaultAsync>> {}

/**
 * Async style function union
 */
export type RPCAsync<T> = RPCDefer<T> | RPCNodeCallback<T> | RPCNotify<T>; 

export interface RPCNodeCallback<T> {
  (error: Error, param?: T);
  (error: Error, ...rest: any[]);
}

export type RPCDefaultAsync =
  'nodeCallback' |
  'observable' |
  'promise' |
  'asyncAwait';

export interface RPCDefer<T> {
  resolve: (any) => any;
  reject: (any) => any;
  promise: Promise<T>;
}

/**
 * The Different Types of RPC Events
 */
export type RPCEventType =
  'ack' |
  'addEventListener' |
  'create' |
  'createReturn' |
  'destroy' | 
  'destroyReturn' |
  'fnReturn' |
  'invoke' |
  'nodeCallback' |
  'on' |
  'removeListener' |
  'removeEventListener' |
  'promise' |
  'subscribe' |
  'subscribereturn'; 


export interface RPCEmit {
  (message: string, payload: RPCEvent): any;
}

export interface ConfiguredRPCEmit {
  (payload: RPCEvent): any;
}

export interface RPCNotify<T> {
  (param: T, ...args: any[]);
  (...args: any[]);
}

export interface RPCObservable<T> {
  subscribe: (next: (param: T) => any, 
              onError: (error: Error) => any,
              onComplete: () => any) => () => void;
}

export interface RPCOn {
  (message: string, callback: (payload: RPCEvent) => void): () => void;
}

export interface ConfiguredRPCOn {
  (callback: (payload: RPCEvent) => any): () => any;
}

export interface RPCOptions {
  defaultAsyncType?: RPCDefaultAsync;
  defaultCreateRetry?: number;
  defaultCreateRetryCurve?: number;
  defaultCreateWait?: number;
  enableStackTrace?: boolean;
  maxAckDelay?: number;
  useAcks?: Dictionary<number>;
}

export interface RPCAbstractConfig extends RPCOptions {
  message?: string;
  remote?: Object;
  emit?: ConfiguredRPCEmit;
  on?: ConfiguredRPCOn;
}

export interface RPCConfig extends RPCAbstractConfig {
  emit: ConfiguredRPCEmit;
  on: ConfiguredRPCOn;
}

/**
 * JavaScript error with a code number
 */
export interface CodedError extends Error {
  code?: number;
  stack?: string;
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
  useAcks?: boolean;
}

export interface RPC<T> {
  config: RPCConfig;
  destroy: () => Promise<void>;
  ready: Promise<void>;
  remote: T;
}

