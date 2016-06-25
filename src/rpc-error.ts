import { RPCConfig, RPCError } from './interfaces';

export function createRPCError(c: RPCConfig, error: Error): RPCError {
  let errorType = 'Error';
  let stack = '';

  if (error instanceof EvalError) {
    errorType = 'EvalError';
  }
  
  if (error instanceof RangeError) {
    errorType = 'RangeError';
  }
  
  if (error instanceof ReferenceError) {
    errorType = 'ReferenceError';
  }
  
  if (error instanceof SyntaxError) {
    errorType = 'SyntaxError';
  }
  
  if (error instanceof TypeError) {
    errorType = 'TypeError';
  }
  
  if (error instanceof URIError) {
    errorType = 'URIError';
  }

  if (c.enableStackTrace) {
    stack = error.stack;
  }

  return {
    message: error.message,
    stack,
    type: errorType,
  };
}

// prefix a's stack with b's
export function prefixStackWith(a, b) {
  a.stack = b.stack + a.stack;
}

export function createErrorFromRPCError(error: RPCError): Error {
  let err: Error;
  
  switch (error.type) {
    case 'EvalError':
      err = new EvalError(error.message);
      prefixStackWith(err, error);
      return err;

    case 'RangeError':
      err = new RangeError(error.message);
      prefixStackWith(err, error);
      return err;
    
    case 'ReferenceError':
      err = new ReferenceError(error.message);
      prefixStackWith(err, error);
      return err;
    
    case 'SyntaxError':
      err = new SyntaxError(error.message);
      prefixStackWith(err, error);
      return err;
    
    case 'TypeError':
      err = new TypeError(error.message);
      prefixStackWith(err, error);
      return err;
    
    case 'URIError':
      err = new URIError(error.message);
      prefixStackWith(err, error);
      return err;
      
    default:
      err = new Error(error.message);
      prefixStackWith(err, error);
      return err;
  }
}

