export const DOT = '.';

export interface FunctionDictionary {
  [key: string]: Function;
}

export function isFunction(fn) {
  return typeof fn === 'function';
}

export interface Message {
  args: any[];
  fn: Function;
  uid: string;
}


export function newMessage(): Message {
  return {
    args: [],
    fn: noop,
    uid: '',
  };
}

export const noop = () => {};

export function newPostObject: PostObject {
  return {
    type: [],
  };
}

export interface PostObject {
  type: string[]; 
}
