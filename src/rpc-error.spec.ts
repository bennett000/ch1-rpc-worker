import * as rpcError from './rpc-error';

describe('RPCError', () => {
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
  
  describe('createRPCError functions', () => {
    it('should create a stack trace if configured to do so', () => {
      config.enableStackTrace = true;

      expect(rpcError.createRPCError(config, new Error('test')).stack)
        .toBeTruthy();
    });

    it('should detect TypeErrors', () => {
      const err = rpcError.createRPCError(config, new TypeError('test'));
      expect(err.type).toBe('TypeError');
    });
  });

  describe('createErrorFromRPCError function', () => {
    it('should default to generic Error type errors', () => {
      class MyError extends Error { constructor(msg) { super(msg); } }
      const rpcErr = rpcError.createRPCError(config, new MyError('test')); 
      const err = rpcError.createErrorFromRPCError(rpcErr);
      
      expect(err instanceof Error).toBe(true);
    });
    
    it('should support EvalError type errors', () => {
      const rpcErr = rpcError.createRPCError(config, new EvalError('test'));
      const err = rpcError.createErrorFromRPCError(rpcErr);

      expect(err instanceof Error).toBe(true);
    });
    
    it('should support RangeError type errors', () => {
      const rpcErr = rpcError.createRPCError(config, new RangeError('test'));
      const err = rpcError.createErrorFromRPCError(rpcErr);

      expect(err instanceof Error).toBe(true);
    });
    
    it('should support ReferenceError type errors', () => {
      const rpcErr = rpcError
        .createRPCError(config, new ReferenceError('test'));
      const err = rpcError.createErrorFromRPCError(rpcErr);

      expect(err instanceof Error).toBe(true);
    });
    
    it('should support SyntaxError type errors', () => {
      const rpcErr = rpcError.createRPCError(config, new SyntaxError('test'));
      const err = rpcError.createErrorFromRPCError(rpcErr);

      expect(err instanceof Error).toBe(true);
    });

    it('should support TypeError type errors', () => {
      const rpcErr = rpcError.createRPCError(config, new TypeError('test'));
      const err = rpcError.createErrorFromRPCError(rpcErr);

      expect(err instanceof Error).toBe(true);
    });

    it('should support URIError type errors', () => {
      const rpcErr = rpcError.createRPCError(config, new URIError('test'));
      const err = rpcError.createErrorFromRPCError(rpcErr);

      expect(err instanceof Error).toBe(true);
    });
  });

  describe('prefixStackWith function', () => {
    it('should prefix the first arguments stack with the second\'s', () => {
      const a = { stack: 'hello', message: 'test' };
      const b = { stack: 'world', message: 'test' };
      const expected = b.stack + a.stack;
      rpcError.prefixStackWith(a, b);
      
      expect(a.stack).toBe(expected);
    });
  });
});