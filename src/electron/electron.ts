/**
 * This module uses an Electron Ipc  and a message parameter to perform RPC
 * [ipcMain](http://electron.atom.io/docs/api/ipc-main/ "Electron Docs")
 * [ipcRenderer](http://electron.atom.io/docs/api/ipc-renderer/ "Electron Docs")
 */

import { Promise } from 'es6-promise';
import { DEFAULT_MESSAGE } from '../rpc/constants';
import { create as createRemote } from '../rpc/js-rpc';

import { 
  isRPC,
  isString, 
  isFunction, 
  typeError,
  uid,
} from '../rpc/utils';

import { 
  Dictionary,
  Remote,
  RemoteDesc,
  RPC, 
  RPCAbstractConfig, 
  RPCConfig, 
} from '../rpc/interfaces';

interface ObjectCtor extends ObjectConstructor {
  assign(target: any, ...sources: any[]): any;
}

declare var Object: ObjectCtor;

export const DEFAULT_MESSAGE_INIT = `${DEFAULT_MESSAGE}_INIT`;

export interface ElectronMainEvent {
  sender: { send: (channel: string, args: any) => any };
}

export interface IpcRenderer {
  on(message: string, handler: (evt: any, arg: any) => any); 
  send(message: string, ...args: any[]): any;
  removeListener: (channel: string, listener: Function) => any;
}

export interface IpcMain {
  on(message: string, handler: (evt: ElectronMainEvent, message: any) => any);
  removeListener: (channel: string, listener: Function) => any;
}

export type Ipc = IpcMain | IpcRenderer;

export interface IpcDictionary<T> extends Dictionary<RPC<T> | Function> {
  destroy: () => Promise<void>;
}


/**
 * Worker RPC Config
 */
export interface RPCElectronConfig extends RPCAbstractConfig {
  ipc?: Ipc;
  messageInit?: string;
}

function hasOnAndRemoveListener(ipc: Ipc) {
  if (!isFunction(ipc.on)) {
    return false;
  }

  if (!isFunction(ipc.removeListener)) {
    return false;
  }
  
  return true;
}

export function isElectronIpcRenderer(ipc: any): ipc is IpcRenderer {
  if (!ipc) {
    return false;
  }
  
  if (!isFunction(ipc.send)) {
    return false;
  }

  return hasOnAndRemoveListener(ipc);
}

export function isElectronIpcMain(ipc: any): ipc is IpcMain {
  if (!ipc) {
    return false;
  }

  return hasOnAndRemoveListener(ipc);
}

export function electronIpcOn(ipc, message) {
  
  function listenerActual(listener) {
    ipc.on(message, (evt, args) => listener(args));
    // must return a destroy function
    // _note_ recursively calling `removeListener` with `listenerActual` does
    // not seem to work :/
    return () => ipc.removeAllListeners(message);
  }
  
  return listenerActual;
}

export function electronIpcEmit(postMessage) {
  return (data) => postMessage(data);
}

export function createDictionaryEntry<T>(dict: IpcDictionary<T>,
                                         config: RPCElectronConfig, 
                                         ipc: IpcMain, 
                                         remote: Remote<T>,
                                         remoteDesc: RemoteDesc,
                                         evt: ElectronMainEvent,
                                         message: string) {
  const id = uid();
  const localConfig = Object.assign({}, config);
  localConfig.message = message;
  localConfig.on = electronIpcOn(ipc, message);
  localConfig.emit = electronIpcEmit(evt.sender.send.bind(evt.sender, message));
  const r = createRemote<T>(<RPCConfig>localConfig, remote, remoteDesc);
  const remoteDestroy = r.destroy;
  
  r.destroy = () => remoteDestroy()
    .then(() => { delete dict[id]; })
    .catch(() => { delete dict[id]; }); 
  
  dict[id] = r;
}

export function create<T>(
  config: RPCElectronConfig,
  remote?: Remote<T>,
  remoteDesc?: RemoteDesc): IpcDictionary<T> | RPC<T> {

  if (!isElectronIpcRenderer(config.ipc) && !isElectronIpcMain(config.ipc)) {
    typeError('create: expecting ipcRenderer or ipcMain'); 
  }
  const ipc = config.ipc;
  const messageInit = config.messageInit || DEFAULT_MESSAGE_INIT;
  
  /** make sure to check for IPCRenderer *first* since it *has* a send method */
  if (isElectronIpcRenderer(ipc)) {
    const message = uid();
    config.message = message;
    config.on = electronIpcOn(ipc, message);
    config.emit = electronIpcEmit(ipc.send.bind(ipc, message));
    const r = createRemote<T>(<RPCConfig>config, remote, remoteDesc);
    /** Let the main process know we're ready */
    ipc.send(messageInit, message);
    return r;
  } 
  
  if (isElectronIpcMain(ipc)) {
    const dict = <IpcDictionary<T>>Object.create(null, {
      destroy: {
        enumerable: false,
        configurable: true,
        writable: true,
        value: () => Promise.all(Object.keys(dict)
          .map((key) => { 
            const rpc = dict[key];
            if (isRPC<T>(rpc)) {
              rpc.destroy();
            }
            delete dict[key];
          }))
          .then(() => ipc.removeListener(messageInit, listener))
      }
    });
    
    function listener(evt, message) {
      createDictionaryEntry(
        dict, config, ipc, remote, remoteDesc, evt, message);
    }

    ipc.on(messageInit, listener);
    
    return dict;
  } 
  
  typeError('Ipc object is invalid: ' + Object.keys(ipc).join(', ')); 
}

