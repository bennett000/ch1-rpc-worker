// import { RemoteProcedure } from './remote-procedure';
//
// /**
//  * file: remote-procedure-spec.js
//  * Created by michael on 15/05/14.
//  */
//
//
// describe('remote procedure object', () => {
//   'use strict';
//
//   it('should always function as a constructor function', () => {
//     const rp = RemoteProcedure(() => {}, {}, 'fn');
//     expect(rp instanceof RemoteProcedure).toBe(true);
//   });
//
//   it('should be an object', () => {
//     const rp = RemoteProcedure(() => {}, {}, 'fn');
//     expect(rp instanceof RemoteProcedure).toBe(true);
//   });
// });
//
// describe('there should be a unique id function', () => {
//   'use strict';
//   let rp;
//   beforeEach(() => {
//     rp = RemoteProcedure(() => {}, {}, 'fn');
//   });
//
//   it('should have a function called uid', () => {
//     expect(typeof rp.uid).toBe('function');
//   });
//
//   it('should generate unique ids', () => {
//     let i, cur, last = 0;
//
//     for (i = 0; i < 10000; i += 1) {
//       cur = rp.uid();
//       expect(last === cur).toBe(false);
//       last = cur;
//     }
//   });
// });
//
// describe('there should be the expected remote procedure interfaces', () => {
//   let rp;
//   beforeEach(() => {
//     rp = RemoteProcedure(() => {}, {}, 'fn');
//   });
//
//   it('should have an invoke function', () => {
//     expect(typeof rp.invoke).toBe('function');
//   });
//
//   it('should have a callback function', () => {
//     expect(typeof rp.callback).toBe('function');
//   });
//
//   it('should have a promise function', () => {
//     expect(typeof rp.promise).toBe('function');
//   });
//
//   it('should have a listen function', () => {
//     expect(typeof rp.listen).toBe('function');
//   });
//
//   it('should have an ignore function', () => {
//     expect(typeof rp.ignore).toBe('function');
//   });
// });
//
// describe('the function callers should post the expected messages', () => {
//   'use strict';
//   let postData; 
//   let callbacks = {};
//   let rp;
//
//   beforeEach(() => {
//     callbacks = {};
//     postData = { };
//     rp = RemoteProcedure((message) => {
//       postData = JSON.parse(message);
//     }, callbacks, 'fn');
//   });
//
//   function testMessageResult(type) {
//     it ('should send ' + type + ' messages', () => {
//       rp[type]('hello');
//
//       expect(postData[type]).toBeTruthy();
//       expect(Array.isArray(postData[type])).toBe(true);
//       expect(postData[type][0]).toBeTruthy();
//       expect(postData[type][0].fn).toBe('fn');
//       expect(Array.isArray(postData[type][0].args)).toBe(true);
//       expect(postData[type][0].args[0]).toBe('hello');
//     });
//   }
//
//   testMessageResult('invoke');
//   testMessageResult('promise');
//   testMessageResult('callback');
//
//   function testCallbackRegistry(type) {
//     it ('should register callbacks for ' + type + ' messages', () => {
//       rp[type]('hello');
//
//       Object.keys(callbacks).forEach((uid) => {
//         expect(typeof callbacks[uid]).toBe('object');
//         expect(typeof callbacks[uid].t).toBe('function');
//         expect(typeof callbacks[uid].f).toBe('function');
//       });
//
//       expect(Object.keys(callbacks).length).toBe(1);
//       rp[type]('goodbye');
//       expect(Object.keys(callbacks).length).toBe(2);
//     });
//   }
//
//   testCallbackRegistry('invoke');
//   testCallbackRegistry('callback');
//   testCallbackRegistry('promise');
// });
//
// describe('the function listeners should operate as expected', () => {
//   let postData = '', callbacks = {}, rp;
//
//   beforeEach(() => {
//     callbacks = {};
//     postData = '';
//     rp = RemoteProcedure((message) => {
//       postData = JSON.parse(message);
//     }, callbacks, 'fn');
//   });
//
//   it('listeners should return valid uids', () => {
//     const listenFn1 = (a, b) => a + b;
//     const listenFn2 = (a, b) => a - b;
//     let uid = rp.listen(listenFn1);
//
//     expect(callbacks[uid].toString()).toBe(listenFn1.toString());
//
//     uid = rp.listen(listenFn2);
//
//     expect(callbacks[uid].toString()).toBe(listenFn2.toString());
//   });
//
//   it('should throw without a callback', () => {
//     expect(() => {
//       rp.listen();
//     }).toThrow();
//   });
//
//   it('ignores should return promises', () => {
//     const r = rp.ignore('234523');
//
//     expect(typeof r.then).toBe('function');
//   });
//
// });
