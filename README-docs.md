# JS RPC

JS RPC provides JavaScript and TypeScript developers a library that allows them
to perform [Remote Procedure Calls](https://en.wikipedia.org/wiki/Remote_procedure_call "Wikipedia Entry for RPC").

This library is written in pure JavaScript, well pure TypeScript and works 
across numerous transports including Web Workers, Web Sockets, and custom 
transports.

## tl;dr

Process A
```js
const b = rpc.create({ /* config */}, {
  sayOnA: (arg) => console.log(`Process B says ${arg}`);
});

remote.ready().then(() => b.remote.sayOnB('hello world');
// will call sayOnB on process B
```

Process B
```js
const a = rpc.create({ /* config */}, {
  sayOnB: (arg) => console.log(`Process A says ${arg}`);
});

remote.ready().then(() => a.remote.sayOnA('hello world');
// will call sayOnA on process A
```

## How It Works

js-rpc can work across any transport provided that the transport can be
simplified into `on` and `emit` functions.

What do we mean by `on` and `emit` functions?  Let's imagine for a moment the
[Web Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers "MDN: Using Web Workers")

_note: js-rpc contains convenience functions that provide WebWorker support out
of the box.  The examples here are educational and *do not* need to be 
implemented_

In our first process we might have a Web Worker:

```js
// make a new worker
const myWorker = new Worker("worker.js");

// js-rpc only wants/needs to use the first parameter of emit consequently the
// WebWorker post message can be used out of the box
const emit = myWorker.postMessage.bind(myWorker);

// js-rpc's on message wants/needs data to be its first parameter.  Since
// WebWorker.onmessage boxes passed data into an even we need to extract it
const on = myWorker.onmessage((event) => event.data);

// make a RPC Object:
const worker = ({ on, emit }, /* object to expose on worker process */);
```

In our second WebWorker process we have a slightly different API:

```js
// WebWorkers use a variable called "self" to register their messages:
// self.postMessage has the same api as in our previous example
const emit = self.postMessage.bind(self);

// self.onmessage also boxes data into events
const on = self.onmessage((event) => event.data);

// make a RPC Object:
const self = ({ on, emit }, /* object to expose on window process */);
```



## License

[![LGPLv3 License Logo and Local Text][licenseImage]][licenseText]

[licenseImage]: https://www.gnu.org/graphics/lgplv3-147x51.png "LGPLv3 logo"
[licenseText]: ./LICENSE "LGPLv3 Full Text"

Copyright (c) 2016 Michael Bennett

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
