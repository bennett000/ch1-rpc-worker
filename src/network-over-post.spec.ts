import * as nOp from './network-over-post';
import { defer } from './utils';

import { 
  isRPCErrorPayload, 
  isRPCReturnPayload,
  noop 
} from './utils';

describe('network over power functions', () => {
  let config;
  let event;

  beforeEach(() => {
    config = {
      emit: noop,
      cemit: noop,
      enableStackTrace: false,
      message: '',
      on: noop,
      remote: {},
    };
    
    event = {
      payload: {
        result: [],
      },
      type: 'invokeReturn',
      uid: 'test',
    };
  });

  describe('ack function', () => {
    it('should throw if useAcks is false', () => {
      expect(() => nOp.ack(config, event)).toThrowError();
    }); 
    
    it('should throw if it gets an ack it\'s not expecting', () => {
      config.useAcks = {};
      expect(() => nOp.ack(config, event)).toThrowError();
    });
    
    it('should throw if it gets an payload it\'s not expecting', () => {
      config.useAcks = {};
      event.payload = {
        error: {
          message: 'test',
        },
      };
      expect(() => nOp.ack(config, event)).toThrowError();
    });
    
    it('should clean the timeout waiting', () => {
      event.payload.result.push('test');
      config.useAcks = { test: 12345 };
      nOp.ack(config, event);
      
      expect(config.useAcks.test).toBeUndefined();
    });
  });

  describe('invoke function', () => {
    it('should emit RPCReturnPayloads if the function passes', () => {
      let result;
      
      config.remote = {
        test: (arg) => result = arg
      };
      
      config.cemit = (arg) => { 
        expect(isRPCReturnPayload(arg.payload)).toBe(true); 
      };
      
      nOp.invoke(config, { fn: 'test', args: [1] }, 'testId'); 
      
      expect(result).toBe(1);
    });

    it('should emit RPCErrorPayload if the function fails', () => {
      // trigger an error by wiping remotes
      config.remote = {};

      config.cemit = (arg) => {
        expect(isRPCErrorPayload(arg.payload)).toBe(true);
      };

      nOp.invoke(config, { fn: 'test', args: [1] }, 'testId');
    });
  });
  
  describe('on function', () => {
    it('should not sendAcks by default', () => {
      let didRun = false;
      let emit;
      config.on = (message, trigger) => { emit = trigger; };
      const sendAck = (c, uid) => { didRun = true; };
       
      nOp.on(sendAck, config, {
        test: noop
      }, 'id');
      
      emit(event);
      
      expect(didRun).toBe(false);
    });

    it('should sendAcks if useAcks is true *and* the event is not an ack',
      () => {
        let didRun = true;
        let emit;
        config.on = (message, trigger) => { emit = trigger; };
        config.useAcks = Object.create(null);
        const sendAck = (c, uid) => { didRun = true; };

        nOp.on(sendAck, config, {
          test: noop
        }, 'id');

        emit(event);

        expect(didRun).toBe(true);
      });
  });
  
  describe('fireError function', () => {
    it('should be able to process defers', (done) => {
      const d = defer();
      
      event.payload = { error: { message: 'test' }};
      nOp.fireError(config, event.payload, d);
      
      d.promise
        .then((result) => {
          expect(result).toBe('this should not happen');
          done();
        })
        .catch((error) => {
          expect(error instanceof Error).toBe(true);
          done();
        });
    });
    
    it('should be able to process callbacks', () => {
      let err;
      
      event.payload = { error: { message: 'test' }};
      nOp.fireError(config, event.payload, (error) => { err = error; });
      
      expect(err instanceof Error).toBe(true);
    });
  });

  describe('fireSuccess function', () => {
    it('should be able to process defers', (done) => {
      const d = defer();
      event.payload.result.push(true);
      nOp.fireSuccess(config, event.payload, d);

      d.promise
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch((error) => {
          expect(error.message).toBeUndefined();
          done();
        });
    });

    it('should be able to process callbacks', () => {
      let res;
      event.payload.result.push(true);
      nOp.fireSuccess(config, event.payload, 
        (err, result) => { res = result; });

      expect(res).toBeTruthy();
    });
  });

  describe('returnPayload function', () => {
    it('should throw an error if a callback is missing', () => {
      expect(() => nOp.returnPayload(config, event.payload, {}, 'test'))
        .toThrowError();
    });
    
    it('should throw an error if a payload is unexpected', () => {
      event.payload = { };
      expect(() => nOp.returnPayload(config, event.payload, {}, 'test'))
        .toThrowError();
    });

    it('should delete callbacks if it processes an error', () => {
      const callbacks = {
        test: noop,
      };
      
      event.payload = { error: { message: 'test' }};
      
      nOp.returnPayload(config, event.payload, callbacks, 'test');
      
      expect(callbacks.test).toBeUndefined();
    });
    
    it('should delete callbacks if it processes an return value', () => {
      const callbacks = {
        test: noop,
      };

      nOp.returnPayload(config, event.payload, callbacks, 'test');

      expect(callbacks.test).toBeUndefined();
    });
  });
});
