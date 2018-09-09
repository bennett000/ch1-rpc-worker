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

import {
  create as createRemote,
  Remote,
  RemoteDesc,
  RPCAbstractConfig,
  RPCConfig,
} from '@ch1/rpc';
import { isString, noop } from '@ch1/utility';

export interface PostMessageListener {
  (payload: { data: string }): any;
}

export interface PostMessage {
  onmessage(listener: PostMessageListener): any;
  postMessage(data: { data: string }): any;
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

export function validateWorker(worker: any): PostMessage {
  if (isString(worker)) {
    worker = new Worker(worker);
  } else if (!(worker instanceof Worker)) {
    worker = self as any;
  }

  return (worker as any) as PostMessage;
}

export function workerOn(worker: any) {
  return (listener: any) => {
    worker.onmessage = (event: { data: string }) =>
      listener(JSON.parse(event.data));
    return () => (worker.onmessage = noop);
  };
}

export function workerEmit(postMessage: (value: any) => any) {
  return (data: any) => postMessage(JSON.stringify(data));
}

export function create<T>(
  config: RPCWorkerConfig = {},
  remote?: Remote<any>,
  remoteDesc?: RemoteDesc,
) {
  const worker = validateWorker(config.worker);

  config.on = workerOn(worker);

  config.emit = workerEmit(worker.postMessage.bind(worker));

  const rpc = createRemote<T>(<RPCConfig>config, remote, remoteDesc);

  if (worker instanceof Worker) {
    (worker as any).onerror = (error: Error) =>
      rpc.destroy('rpc-worker: worker error: ' + error.message);
    const oldDestroy = rpc.destroy;
    (rpc as any).destroy = (reason?: string) => {
      (worker as any).terminate();
      oldDestroy(reason);
    };
  }

  /** @todo handle termination ! who likes memory leaks? */
  return rpc;
}
