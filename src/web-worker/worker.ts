/**
 * This module uses `JSON.stringify` and `JSON.parse` for a number of reasons:
 * 
 *  - I'm too lazy to figure out an efficient `ArrayBuffer` approach, that said
 *  I can imagine it easy to make a hybrid...
 *  - Historically the library used them out of paranoia and sloth (detecting 
 *  browser object clone support)
 *  - Because apparently `JSON` is actually reasonable: 
 *  https://nolanlawson.com/2016/02/29/high-performance-web-worker-messages/
 */

import { create as createRemote } from '../rpc/js-rpc';
import { isString, noop } from '../rpc/utils';
import { RPC, RPCAbstractConfig, RPCConfig, } from '../rpc/interfaces';

export interface PostMessageListener {
  (payload: { data: string }): any; 
}

export interface PostMessage {
  onmessage(listener: PostMessageListener);
  postMessage(data: any);
}

/**
 * `Worker`s will be used as is
 * strings will attempt to `new Worker(string)`
 */
export type WorkerType = Worker | string;

/**
 * Worker RPC Config
 */
export interface RPCWorkerConfig extends RPCAbstractConfig {
  worker?: WorkerType;
}

export function validateWorker(worker): PostMessage {
  if (isString(worker)) {
    worker = new Worker(worker);
  } else if (!(worker instanceof Worker)) {
    worker = self;
  }

  return worker;
}

export function workerOn(worker) {
  return (listener) => {
    worker.onmessage = (event) => listener(JSON.parse(event.data));
    return () => worker.onmessage = noop;
  };
}

export function workerEmit(postMessage) {
  return (data) => postMessage(JSON.stringify(data));
}


export function create<T>(config: RPCWorkerConfig) {
  const worker = validateWorker(config.worker);
  
  config.on = workerOn(worker);
  
  config.emit = workerEmit(worker.postMessage.bind(worker));
  
  /** @todo handle termination ! who likes memory leaks? */
  return createRemote<T>(<RPCConfig>config);
}

