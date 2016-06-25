export const uid = createUidGenerator();

export function isFunction(fn: any): fn is Function {
  return typeof fn === 'function';
}

export function isObject(obj: any): obj is Object {
  if (!obj) {
    return false;
  }
  
  return typeof obj === 'object';
}

export function noop(): void {}

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

export function createTypeError(message) {
  return new TypeError('js-rpc: ' + message);
}

export function throwIfNotFunction(fn: any, message?: string) {
  if (!isFunction(fn)) {
    typeError(message || 'given value is not a function');
  }
}

export function typeError(message) {
  throw createTypeError(message);
}

