# CH1 RPC

[![CircleCI](https://circleci.com/gh/bennett000/ch1-rpc.svg?style=svg)](https://circleci.com/gh/bennett000/ch1-rpc)

_This is not well maintained_

_This is not traditional RPC, but it is like it_

_This library ships only es6 modules with \*.d.ts files, beware_

## Installation

`yarn add @ch1/rpc-worker`

## Usage

Slightly easier API than in the raw [`@ch1/rpc`](https://github.com/bennett000/ch1-rpc 'CH1 RPC')

Main JS Script

```ts
import * as wrpc from '@ch1/rpc-worker';

const w = new Worker(TEST_FILE);
const rpc = wrpc.create({ worker: w });

rpc.ready
  .then(() => rpc.remote.foo())
  .then(result => {
    expect(result).toBe(7);
    done();
  })
  .catch(done);
```

Worker JS

```ts
import * as wrpc from '@ch1/rpc-worker';

wrpc.create(undefined, {
  foo: () => new Promise(resolve => resolve(7)),
});
```

## License

[LGPL](./LICENSE 'Lesser GNU Public License')
