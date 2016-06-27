/**
 * Functions related to creating and using remote objects
 */
import { RPCConfig } from './interfaces';
import { createTypeError, isFunction, safeInvoke } from './utils';

export function getFinalFunction(remote: Object, fnName: string) {
  const names = fnName.split('.').filter((el) => el);

  // invalid function name case
  if (names.length === 0) {
    return createTypeError(`getFinalFunction: ${fnName} not found on remote`);
  }

  // "first level" case
  if (names.length === 1) {
    if (isFunction(remote[names[0]])) {
      return remote[names[0]];
    }
    return createTypeError(`getFinalFunction: ${fnName} is not a function: ` +
      typeof remote[names[0]]);
  }

  // invalid sub object case
  if (!remote[names[0]]) {
    return createTypeError(`getFinalFunction: ${names[0]} is not a ` +
      'namespace (sub-object) on remote');
  }

  // sub object case
  if (names.length === 2) {
    return getFinalFunction(remote[names[0]], names[1]);
  }

  // deeper object case
  return getFinalFunction(remote[names.shift()], names.join('.'));
}

export function safeCall(c: RPCConfig, fnName: string, args?: any[]) {
  const fn = getFinalFunction(c.remote, fnName);
  
  if (!Array.isArray(args)) {
    args = []; 
  }

  if (fn instanceof Error) {
    return fn;
  }
  
  return safeInvoke(fn, args);
}
