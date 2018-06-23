import * as erpc from './electron';
import { noop } from '../rpc/utils';

describe('electron IPC  rpc functions', () => {
  describe('isElectronIpcRenderer', () => {
    it('should return false for falsies', () => {
      expect(erpc.isElectronIpcRenderer(null)).toBe(false);
    });

    it('should return false for items without a send', () => {
      expect(
        erpc.isElectronIpcRenderer({ on: noop, removeListener: noop }),
      ).toBe(false);
    });

    it('should return false for items without an on', () => {
      expect(
        erpc.isElectronIpcRenderer({ send: noop, removeListener: noop }),
      ).toBe(false);
    });

    it('should return false for items without a removeListener', () => {
      expect(erpc.isElectronIpcRenderer({ send: noop, on: noop })).toBe(false);
    });

    it('should return true for items with on/send/removeListener', () => {
      expect(
        erpc.isElectronIpcRenderer({
          on: noop,
          send: noop,
          removeListener: noop,
        }),
      ).toBe(true);
    });
  });

  describe('isElectronIpcMain', () => {
    it('should return false for falsies', () => {
      expect(erpc.isElectronIpcMain(null)).toBe(false);
    });

    it('should return false for items without an on', () => {
      expect(erpc.isElectronIpcMain({ removeListener: noop })).toBe(false);
    });

    it('should return false for items without a removeListener', () => {
      expect(erpc.isElectronIpcMain({ on: noop })).toBe(false);
    });

    it('should return true for items with on/removeListener', () => {
      expect(
        erpc.isElectronIpcMain({
          on: noop,
          removeListener: noop,
        }),
      ).toBe(true);
    });
  });

  describe('electronIpcOn', () => {
    it('should return a function', () => {
      expect(
        typeof erpc.electronIpcOn(
          {
            on: noop,
            send: noop,
            removeListener: noop,
          },
          noop,
        ),
      ).toBe('function');
    });

    it('should parse a given string', done => {
      const testObj = { test: true, a: '1' };
      const testJson = JSON.stringify(testObj);
      const listener = erpc.electronIpcOn(
        {
          on: (message, fn) => {
            fn({}, testObj);
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

  describe('electronIpcEmit', () => {
    it('should return a function', () => {
      expect(typeof erpc.electronIpcEmit(noop)).toBe('function');
    });

    it('should stringify a given object', done => {
      const testObj = { test: true, a: '1' };
      const testJson = JSON.stringify(testObj);
      const emit = erpc.electronIpcEmit(data => {
        expect(JSON.stringify(data)).toBe(testJson);
        done();
      });
      emit(testObj);
    });
  });

  describe('create function', () => {
    it('should run without incident', () => {
      const s = { send: noop, on: noop, removeListener: noop };

      expect(() => erpc.create({ ipc: s })).not.toThrowError();
    });

    it('should throw without an ipc', () => {
      expect(() => erpc.create(<erpc.RPCElectronConfig>{})).toThrowError();
    });
  });
});
