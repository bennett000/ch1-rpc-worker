import * as rpc from './js-rpc';
import { DEFAULT_MESSAGE } from './constants';
import { noop } from './utils';

describe('js-rpc functions', () => {
  let config;

  beforeEach(() => {
    config = {
      emit: noop,
      enableStackTrace: false,
      message: '',
      on: noop,
      remote: {},
    };
  });

  describe('create function', () => {
    it('should run without incident if given valid parameters', () => {
      expect(() => rpc.create<Object, Object>(config, {})).not.toThrowError();
    });
  });
  
  describe('validateRemote function', () => {
    it('should resolve if a given value is falsey', () => {
      expect(() => rpc.validateRemote(null)).not.toThrowError();
    });
    
    it('should throw if given value is truthy and also not an object', () => {
      expect(() => rpc.validateRemote('hello')).toThrowError();
    }); 
    
    it('should not throw if given a valid object', () => {
      expect(() => rpc.validateRemote({})).not.toThrowError();
    });
  });

  describe('validateConfig function', () => {
    it('should return an immutable (frozen) object', () => {
      const validConfig = rpc.validateConfig(config, {});      
      
      expect(() => validConfig.message = 'test').toThrowError();
    });
    
    it('should default to having a false stack prop', () => {
      config.enableStackTrace = '';
      const validConfig = rpc.validateConfig(config, {});

      expect(validConfig.enableStackTrace).toBe(false);
    });
    
    it('should default to using DEFAULT_MESSAGE', () => {
      config.message = '';
      const validConfig = rpc.validateConfig(config, {});

      expect(validConfig.message).toBe(DEFAULT_MESSAGE);
    });
    
    it('should create a `cemit` method that calls emit with message prop',
      () => {
        let message;
        config.emit = (m) => { message = m; };
        const validConfig = rpc.validateConfig(config, {});
        validConfig.cemit({
          payload: {
            error: {
              message: 'test',
            },
          },
          type: 'invokeReturn',
          uid: 'test',
        });

        expect(message).toBe(DEFAULT_MESSAGE);
      });
  });
});
