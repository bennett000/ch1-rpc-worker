import { RPCAsync, RPCAsyncContainerDictionary } from './interfaces';
import { defer, isDefer, isFunction, noop } from './utils';
import * as rp from './remote-procedure';

describe('remoteProcedure functions', () => {
  let config;

  beforeEach(() => {
    config = {
      emit: noop,
      enableStackTrace: false,
      message: '',
      on: () => noop,
      remote: {},
    };
  });
  
  describe('create function', () => {
    it('should call  promise remote if given a promise', () => {
      const dict = Object.create(null);
      rp.create(config, dict, 'some func', 'promise')('arg');
      expectDeferIn(dict);
    });
    
    it('should call callbackRemote if given a nodeCallback', () => {
      const dict = Object.create(null);
      rp.create(config, dict, 'some func', 'nodeCallback')('arg', noop);
      expectFunctionIn(dict);
    });
    
    it('should default to config', () => {
      const dict = Object.create(null);
      config.defaultAsyncType = 'promise';
      rp.create(config, dict, 'some func')();
      expectDeferIn(dict);
    });
  });
  
  describe('callbackRemote', () => {
    it('should throw if not given a callback', () => {
      const dict: RPCAsyncContainerDictionary = {};
      const post = noop;
      expect(() => rp
        .callbackRemote(dict, post, 'invoke', 'remote function', []))
        .toThrowError();
    });
    
    it('should register the last argument as a callback', () => {
      const dict: RPCAsyncContainerDictionary = {};
      const post = noop;
      const callback = noop;
      rp.callbackRemote(dict, post, 'invoke', 'remote function', [
        'args', callback]);
      
      let found = false;
      
      for (let i in dict) {
        if (dict[i].async === callback) {
          found = true;
        }
      }
      
      expect(found).toBe(true);
    });
  });
  
  describe('doPost function', () => {
    it('should call the given post method', () => {
      let isDone = false;
      const post = () => { isDone = true; };
      
      rp.doPost(post, 'invoke', 'remote', ['some', 'args']);
    });
  });

  describe('promiseRemote function', () => {
    it('should register a new defer', () => {
      const dict: RPCAsyncContainerDictionary = {};
      const post = noop;
      rp.promiseRemote(dict, post, 'invoke', 'remote function', [
        'args']);

      expectDeferIn(dict);
    });
  });
  
  describe('registerDefer function', () => {
    it('should add a defer to a dictionary', () => {
      const dict: RPCAsyncContainerDictionary = {};
      const d = defer();
      const id = 'test';
      rp.registerDefer(dict, d, id);
      
      expect(dict[id]).toBeTruthy();
    });
    
    it('should throw if registering the same uid', () => {
      const dict: RPCAsyncContainerDictionary = {};
      const d = defer();
      const id = 'test';
      rp.registerDefer(dict, d, id);

      expect(() => rp.registerDefer(dict, d, id)).toThrowError();
    });
  });

  describe('registerCallback function', () => {
    it('should add a callback to a dictionary', () => {
      const dict: RPCAsyncContainerDictionary = {};
      const callback = noop;
      const id = 'test';
      rp.registerCallback(dict, callback, id);

      expect(dict[id]).toBeTruthy();
    });

    it('should throw if registering the same uid', () => {
      const dict: RPCAsyncContainerDictionary = {};
      const callback = noop;
      const id = 'test';
      rp.registerCallback(dict, callback, id);

      expect(() => rp.registerCallback(dict, callback, id)).toThrowError();
    });
  });
});

function expectDeferIn(dict) {
  let found;

  /* tslint:disable for-in */
  for (let i in dict) {
    if (!dict[i].async) {
      break;
    }
    if (isDefer(dict[i].async)) {
      found = dict[i].async;
    }
  }

  expect(found).toBeTruthy();
}

function expectFunctionIn(dict) {
  let found;

  /* tslint:disable for-in */
  for (let i in dict) {
    if (!dict[i].async) {
      break;
    }
    if (isFunction(dict[i].async)) {
      found = dict[i].async;
    }
  }

  expect(found).toBeTruthy();
}
