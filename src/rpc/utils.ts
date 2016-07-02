/**
 * Utility functions
 */
import { Promise } from 'es6-promise';

import {
  Dictionary,
  RPCDefaultAsync,
  RPCDefer,
  RPCNodeCallback,
  RPCEvent,
  RPCError,
  RPCErrorPayload, 
  RPCInvocationPayload, 
  RPCReturnPayload 
} from './interfaces';

export const isRPCDefaultAsync = (arg): arg is RPCDefaultAsync => [
  'promise', 'nodeCallback'
].indexOf(arg) !== -1;

export const uid = createUidGenerator();

export function isDefer<T>(defer: any): defer is RPCDefer<T> {
  if (!defer) {
    return false;
  }
  if (!isFunction(defer.resolve)) {
    return false;
  }
  if (!isFunction(defer.reject)) {
    return false;
  }
  if (!isPromise(defer.promise)) {
    return false;
  }
  
  return true;
}

export function isError(err: any): err is Error {
  return err instanceof Error;
}

export function isFunction(fn: any): fn is Function {
  return typeof fn === 'function';
}

export function isObject(obj: any): obj is Object {
  if (!obj) {
    return false;
  }
  
  return typeof obj === 'object';
}

export function isString(arg: any): arg is string {
  return typeof arg === 'string'; 
}

export function isDictionary<T>(dict: any): dict is Dictionary<T> {
  return isObject(dict);
}

export function isPromise<T>(promise: any): promise is Promise<T>  {
  if (!promise) {
    return false;
  }
  
  if (!isFunction(promise.then)) {
    return false;
  } 
  
  if (!isFunction(promise.catch)) {
    return false;
  }
  
  return true;
}

export function isRPCCallback<T>(arg: any): arg is RPCNodeCallback<T> {
  return isFunction(arg); 
}

export function isRPCEvent(event: any): event is RPCEvent  {
  if (!event) {
    return false;
  }
  
  if (typeof event.uid !== 'string') {
    return false;
  }
  
  if (typeof event.type !== 'string') {
    return false;
  }
  
  if (isRPCErrorPayload(event.payload) || 
    isRPCInvocationPayload(event.payload) || 
    isRPCReturnPayload(event.payload)) {
    return true; 
  }
  
  return false;
}

export function isRPCError(error: any): error is RPCError {
  if (!error) {
    return false;
  }
  
  if (!error.message) {
    return false;
  }
  
  return true;
}

export function isRPCErrorPayload(payload: any): payload is RPCErrorPayload {
  if (!payload) {
    return false;
  }
  
  return isRPCError(payload.error);
}

export function isRPCInvocationPayload(
  payload: any): payload is RPCInvocationPayload {
  
  if (!payload) {
    return false; 
  } 

  if (!Array.isArray(payload.args)) {
    return false;
  }
  
  if (typeof payload.fn !== 'string') {
    return false;
  }
  
  return true;
}

export function isRPCReturnPayload(payload: any): payload is RPCReturnPayload {
  if (!payload) {
    return false;
  }
  
  return Array.isArray(payload.result);
}

export function noop(): void {}

export const pnoop: () => Promise<void> = 
  () => new Promise<void>((resolve) => resolve());

export function createUidGenerator(): () => string {
  let uidCount = 0;

  return () => {
    // increment the counter
    uidCount += 1;

    // reset it if it's 'high'
    uidCount = uidCount > 1000 ? 0 : uidCount;

    // return a uid
    return [
      'u',
      Date.now().toString(16),
      uidCount,
      Math.floor(Math.random() * 100000).toString(32)
    ].join('-');
  };
}

export function defer<T>(): RPCDefer<T> {
  let pass = noop;
  let fail = noop;
  
  const promise = new Promise<T>((resolve, reject) => {
    pass = resolve;
    fail = reject;
  }); 
  
  return {
    promise,
    reject: fail,
    resolve: pass,
  };
}

export function createRangeError(message) {
  return new RangeError('js-rpc: ' + message);
}

export function createTypeError(message) {
  return new TypeError('js-rpc: ' + message);
}

export function rangeError(message) {
  throw createRangeError(message);
}

export function safeInstantiate(fn: Function, args: any[]) {
  try {
    return new (Function.prototype.bind.apply(fn, arguments));
  } catch (err) {
    return err;
  }
}

export function safeInvoke(fn: Function, args: any[]) {
  try {
    return fn.apply(null, args);
  } catch (err) {
    return err;
  }
}

export function throwIfNotDefer(d: any, message?: string) {
  if (!isDefer(d)) {
    typeError(message || 'given value is not a defer');
  }
}

export function throwIfNotError(err: any, message?: string) {
  if (!isError(err)) {
    typeError(message || 'given value is not an Error'); 
  } 
}

export function throwIfNotFunction(fn: any, message?: string) {
  if (!isFunction(fn)) {
    typeError(message || 'given value is not a function');
  }
}

export function throwIfNotRPCEvent(event: any, message?: string) {
  if (!isRPCEvent(event)) {
    typeError(message || 'given value is not an RPCEvent');
  }
}

export function throwIfNotObject(obj: any, message?: string) {
  if (!isObject(obj)) {
    typeError(message || 'given value is not an object');
  }
}

export function typeError(message) {
  throw createTypeError(message);
}

