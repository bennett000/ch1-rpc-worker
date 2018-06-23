import * as srpc from './socket-io';
import { noop } from '../rpc/utils';

describe('socket-io  rpc functions', () => {
  describe('isSocket', () => {
    it('should return false for falsies', () => {
      expect(srpc.isSocketIo(null)).toBe(false);
    });

    it('should return false for items without an off', () => {
      expect(srpc.isSocketIo({ on: noop, removeListener: noop })).toBe(false);
    });

    it('should return false for items without an on', () => {
      expect(srpc.isSocketIo({ emit: noop, removeListener: noop })).toBe(false);
    });

    it('should return false for items without a removeListener', () => {
      expect(srpc.isSocketIo({ emit: noop, on: noop })).toBe(false);
    });

    it('should return true for items with on/emit/removeListener', () => {
      expect(
        srpc.isSocketIo({
          on: noop,
          emit: noop,
          removeListener: noop,
        }),
      ).toBe(true);
    });
  });

  describe('socketOn', () => {
    it('should return a function', () => {
      expect(
        typeof srpc.socketOn(
          {
            on: noop,
            emit: noop,
            removeListener: noop,
          },
          noop,
        ),
      ).toBe('function');
    });

    it('should parse a given string', done => {
      const testObj = { test: true, a: '1' };
      const testJson = JSON.stringify(testObj);
      const listener = srpc.socketOn(
        {
          on: (message, fn) => {
            fn(testObj);
          },
        },
        'message',
      );
      listener(data => {
        expect(JSON.stringify(data)).toBe(testJson);
        done();
      });
    });
  });

  describe('socketEmit', () => {
    it('should return a function', () => {
      expect(typeof srpc.socketEmit(noop)).toBe('function');
    });

    it('should stringify a given object', done => {
      const testObj = { test: true, a: '1' };
      const testJson = JSON.stringify(testObj);
      const emit = srpc.socketEmit(data => {
        expect(JSON.stringify(data)).toBe(testJson);
        done();
      });
      emit(testObj);
    });
  });

  describe('create function', () => {
    it('should run without incident', () => {
      const s = { emit: noop, on: noop, removeListener: noop };

      expect(() => srpc.create({ socket: s })).not.toThrowError();
    });

    it('should throw without a socket', () => {
      expect(() => srpc.create(<srpc.RPCSocketIoConfig>{})).toThrowError();
    });
  });
});
