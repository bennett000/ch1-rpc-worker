export const uid = createUidGenerator();

export function isFunction(fn): fn is Function {
  return typeof fn === 'function';
}

export function noop() {}

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
      Date.now().toString(16).substring(4),
      uidCount,
      Math.floor(Math.random() * 100000).toString(32)
    ].join('');
  };
}

export function createTypeError(message) {
  return new TypeError('js-rpc: ' + message);
}

export function typeError(message) {
  throw createTypeError(message);
}

