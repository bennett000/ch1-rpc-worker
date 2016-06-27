import { Dictionary } from './interfaces';
import { defer, noop } from './utils';
import * as rp from './remote-procedure';

describe('remoteProcedure functions', () => {
  describe('callbackRemote', () => {
    it('should throw if not given a callback', () => {
      const dict = {};
      const post = noop;
      expect(() => rp
        .callbackRemote(dict, post, 'invoke', 'remote function', []))
        .toThrowError();
    });
    
    it('should register the last argument as a callback', () => {
      const dict = {};
      const post = noop;
      const callback = noop;
      rp.callbackRemote(dict, post, 'invoke', 'remote function', [
        'args', callback]);
      
      let found = false;
      
      for (let i in dict) {
        if (dict[i] === callback) {
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
    it('should register a given ', () => {
      
    });
  });
  
  describe('registerDefer function', () => {
    it('should add a defer to a dictionary', () => {
      const dict: Dictionary<any> = {};
      const d = defer();
      const id = 'test';
      rp.registerDefer(dict, d, id);
      
      expect(dict[id]).toBeTruthy();
    });
    
    it('should throw if registering the same uid', () => {
      const dict: Dictionary<any> = {};
      const d = defer();
      const id = 'test';
      rp.registerDefer(dict, d, id);

      expect(() => rp.registerDefer(dict, d, id)).toThrowError();
    });
  });

  describe('registerCallback function', () => {
    it('should add a callback to a dictionary', () => {
      const dict: Dictionary<any> = {};
      const callback = noop;
      const id = 'test';
      rp.registerCallback(dict, callback, id);

      expect(dict[id]).toBeTruthy();
    });

    it('should throw if registering the same uid', () => {
      const dict: Dictionary<any> = {};
      const callback = noop;
      const id = 'test';
      rp.registerCallback(dict, callback, id);

      expect(() => rp.registerCallback(dict, callback, id)).toThrowError();
    });
  });
});
