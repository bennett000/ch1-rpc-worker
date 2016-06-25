import * as rpc from './js-rpc';
import { DEFAULT_MESSAGE } from './constants';

describe('js-rpc functions', () => {
  let config;

  beforeEach(() => {
    config = {
      emit: () => {},
      enableStackTrace: false,
      message: '',
      on: () => {},
      remote: {},
    };
  });

  describe('create function', () => {
    it('should run without incident if given valid parameters', () => {
      expect(() => rpc.create<Object, Object>({}, config)).not.toThrowError();
    });
  });
  
  describe('validateRemote function', () => {
    it('should throw if given value is not an object', () => {
      expect(() => rpc.validateRemote(null)).toThrowError();
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
          error: {
            message: 'test',
          },
        });

        expect(message).toBe(DEFAULT_MESSAGE);
      });
  });
});
