const TEST_FILE = '/base/intermediate/test-worker.js';

const wrpc = window.TEST_RPC;
const noop = () => {};

describe('web worker rpc functions', () => {
  describe('validateWorker function', () => {
    it('should create a worker if given a string', () => {
      const w = wrpc.validateWorker(TEST_FILE);
      expect(w instanceof Worker).toBe(true);
      w.terminate();
    });

    it('should return the worker it was given', () => {
      const w = new Worker(TEST_FILE);
      const w2 = wrpc.validateWorker(w);
      expect(w).toBe(w2);
      w.terminate();
    });

    it('should return self otherwise', () => {
      const w = wrpc.validateWorker(undefined);
      expect(w).toBe(self);
    });
  });

  describe('workerOn', () => {
    it('should return a function', () => {
      const w = new Worker(TEST_FILE);
      expect(typeof wrpc.workerOn(w)).toBe('function');
      w.terminate();
    });

    it('should parse a given `event.data`', done => {
      const w = new Worker(TEST_FILE);
      const testObj = { test: true, a: '1' };
      const testJson = JSON.stringify(testObj);
      const listener = wrpc.workerOn(w);
      listener(result => {
        expect(JSON.stringify(result)).toBe(testJson);
        w.terminate();
        done();
      });
      w.onmessage({ data: testJson });
    });
  });

  describe('workerEmit', () => {
    it('should return a function', () => {
      expect(typeof wrpc.workerEmit(noop)).toBe('function');
    });

    it('should stringify a given object', done => {
      const testObj = { test: true, a: '1' };
      const testJson = JSON.stringify(testObj);
      const emit = wrpc.workerEmit(data => {
        expect(data).toBe(testJson);
        done();
      });
      emit(testObj);
    });
  });

  describe('create function', () => {
    it('should run without incident', () => {
      const w = new Worker(TEST_FILE);

      expect(() => wrpc.create({ worker: w })).not.toThrowError();
      w.terminate();
    });
  });

  describe('e2e function', () => {
    it('should invoke a worker function', done => {
      const w = new Worker(TEST_FILE);
      const rpc = wrpc.create({ worker: w });

      rpc.ready
        .then(() => rpc.remote.foo())
        .then(result => {
          expect(result).toBe(7);
          w.terminate();
          done();
        })
        .catch(done);
    });
  });
});
