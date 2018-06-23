/**
 * This module uses a socket.io Socket and a message parameter to perform RPC
 * [socket.io docs](http://socket.io/docs/ "socket.io docs")
 */

import { DEFAULT_MESSAGE } from '../rpc/constants';
import { create as createRemote } from '../rpc/js-rpc';
import { isString, isFunction, typeError } from '../rpc/utils';
import { RPC, RPCAbstractConfig, RPCConfig } from '../rpc/interfaces';

export const DEFAULT_MESSAGE_INIT = `${DEFAULT_MESSAGE}_INIT`;

export interface SocketClient {
  on(message: string, handler: (any) => any);
  emit(message: string, ...args: any[]): any;
  removeListener: (channel: string, listener: Function) => any;
}

export interface SocketServer {}

/**
 * Worker RPC Config
 */
export interface RPCSocketIoConfig extends RPCAbstractConfig {
  socket?: SocketClient;
}

export function isSocketIo(socket: any): socket is SocketClient {
  if (!socket) {
    return false;
  }

  if (!isFunction(socket.emit)) {
    return false;
  }

  if (!isFunction(socket.on)) {
    return false;
  }

  if (!isFunction(socket.removeListener)) {
    return false;
  }

  return true;
}

export function socketOn(socket, message) {
  return listener => {
    socket.on(message, listener);
    // must return a destroy function
    return () => socket.removeListener(message, listener);
  };
}

export function socketEmit(postMessage) {
  return data => postMessage(data);
}

export function create<T>(config: RPCSocketIoConfig) {
  if (!isSocketIo(config.socket)) {
    typeError('create: expecting socket');
  }
  const socket = config.socket;
  const message = config.message || DEFAULT_MESSAGE;

  config.on = socketOn(socket, message);

  config.emit = socketEmit(socket.emit.bind(socket, message));

  /** @todo handle termination ! who likes memory leaks? */
  return createRemote<T>(<RPCConfig>config);
}
