import * as wrpc from './worker';

wrpc.create(undefined, {
  foo: () => new Promise(resolve => resolve(7)),
});
