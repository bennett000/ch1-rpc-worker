# CH1 RPC

[![CircleCI](https://circleci.com/gh/bennett000/ch1-rpc-worker.svg?style=svg)](https://circleci.com/gh/bennett000/ch1-rpc-worker)

_This is not well maintained_

_This is not traditional RPC, but it is like it_

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

## Error Handling

- Individual remote function calls handle their own errors through their own
  async interfaces
- Global errors related specifically to the workers trigger `onDestroy`
- Calling `RPC<RemoteType>.destroy()` _will_ call terminate on the worker

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

// handle onDestroy here
rpc.onDestroy((reason?: string) => {
  // cleanup, restart, whatever
});
```

## API

The worker extension is pretty much as described above. For more information
on the `RPC<RemoteType>` object see the
[`@ch1/rpc docs`](https://github.com/bennett000/ch1-rpc 'CH1 RPC')

## License

[LGPL](./LICENSE 'Lesser GNU Public License')
