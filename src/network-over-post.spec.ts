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
      on: () => noop,
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

  describe('createRemote function', () => {
     
  });
  
  describe('createRemoteReturn function', () => {
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

  describe('createInitializationState', () => {
    it('should have a working defer', (done) => {
      const state = nOp.createInitializationState(config, {}, 'testId');
      state.defer.promise.then((test) => {
        expect(test).toBe('testing');
        done();
      });
      state.defer.resolve('testing');
    });
    
    it('should time out if its defer is not satisfied', (done) => {
      config.defaultCreateWait = 5;
      const state = nOp.createInitializationState(config, {}, 'testId');
      state.defer.promise.catch(err => {
        expect(err instanceof Error).toBe(true);
        done();
      });
    });
    
    it('clean should stop timeouts from happening', (done) => {
      config.defaultCreateWait = 5;
      const state = nOp.createInitializationState(config, {}, 'testId');
      let didErr = false;
      
      state.defer.promise.catch(err => {
        expect(err.message).toBeUndefined();
        didErr = true;
      });
      
      state.clean();
      
      setTimeout(() => {
        done();
        expect(didErr).toBe(false);
      }, config.defaultCreateWait * 2);
    });
    
    it('should repeatedly fire create messages', (done) => {
      let emitCount = 0;
      config.defaultCreateRetry = 1;
      config.cemit = (evt) => {
        expect(evt.type).toBe('create'); 
        emitCount += 1;
      };
      nOp.createInitializationState(config, {}, 'testId');
      
      setTimeout(() => {
        // timers are imperfect, ensure two ticks only
        expect(emitCount).toBeGreaterThan(1); 
        done();
      }, 10);
    });
    
    it('stopCreateSpam should clear create messages', (done) => {
      let emitCount = 0;
      config.defaultCreateRetry = 1;
      config.cemit = (evt) => emitCount += 1;
      const state = nOp.createInitializationState(config, {}, 'testId');
      
      state.stopCreateSpam();
      setTimeout(() => {
        expect(emitCount).toBe(0);
        done(); 
      }, 10);
    });
  });

  describe('initialize function', () => {
    let init;
    let initState;
    
    function resetState() {
      config.on = (msg, callback) => { init = callback; };
      initState = {
        clean: () => {},
        defer: defer(),
        stopCreateSpam: () => {},
      };
    }

    beforeEach(() => {
      resetState();
      nOp.initialize(config, initState);
    });

    it('should throw if given an error payload', () => {
      expect(() => init({ uid: 'test', payload: { 
        error: { message: 'test-error'},
      }})).toThrowError('test-error');
    });
    
    it('should throw if given an non RPCReturnPayload', () => {
      expect(() => init({ uid: 'test', invoke: {
        fn: 'test',
        args: [],
      }})).toThrowError();
    });
    
    it('should throw if not given a create or createReturn event', () => {
      expect(() => init({ uid: 'test', type: 'promise', payload: {
        result: [],
      }})).toThrowError();
    });

    describe('create event', () => {
      it('should setLocalRemote state if create is called', () => {
        init({ uid: 'test', type: 'create', payload: {
          result: [ { test: 'object' }],
        }});
        expect(initState.localRemoteDesc).toBeTruthy();
        expect(initState.localRemoteDesc.test).toBeTruthy();
        expect(initState.localRemoteDesc.test).toBe('object');
      });
      
      it('should set hasCreated', () => {
        init({ uid: 'test', type: 'create', payload: { result: [] }});
        expect(initState.hasCreated).toBe(true);
      });
      
      it('should emit a createReturn event', () => {
        let evt;
        config.cemit = (e) => { evt = e; };
        init({ uid: 'test', type: 'create', payload: { result: [] }});
        expect(evt.type).toBe('createReturn');
      });
    });
    
    describe('createReturn event', () => {
      it('should set isCreated', () => {
        init({ uid: 'test', type: 'createReturn', payload: { result: [] }});
        expect(initState.isCreated).toBe(true);
      });

      it('should stopCreateSpam', () => {
        spyOn(initState, 'stopCreateSpam');
        init({ uid: 'test', type: 'createReturn', payload: { result: [] }});
        expect(initState.stopCreateSpam).toHaveBeenCalled();
      });
    });

    describe('detect completing', () => {
      let isCleaned;

      beforeEach(() => {
        resetState();
        isCleaned = false;
        
        config.on = (msg, callback) => {
          init = callback;
          return () => { isCleaned = true; };
        };
        
        nOp.initialize(config, initState);
      });

      it('should clean its listeners', () => {
        initState.hasCreated = true;
        initState.isCreated = true;
        init({ uid: 'test', type: 'createReturn', payload: { result: [] }});
        expect(initState.isCreated).toBe(true);
      });
      
      it('should clean its state', () => {
        initState.hasCreated = true;
        initState.isCreated = true;
        spyOn(initState, 'clean');
        init({ uid: 'test', type: 'createReturn', payload: { result: [] }});
        expect(initState.clean).toHaveBeenCalled();
      });
      
      it('should resolve state\'s defer with the localRemoteDesc', (done) => {
        initState.hasCreated = true;
        initState.isCreated = true;
        initState.localRemoteDesc = 'test-it!';
        init({ uid: 'test', type: 'createReturn', payload: { result: [ ], }});
        initState.defer.promise
          .then((lrd) =>  {
            expect(lrd).toBe('test-it!');
            done();
          });
      });
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
