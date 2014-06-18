/**
 * file: js-rpc-wrapper-spec.js
 * Created by michael on 18/06/14.
 */
/*global window, jasmine, angular, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, RPC, console, Q, RemoteProcedure, invalidRemote, validCustomRemote, customDesc, getRPCPair, getRPCPairAsync, validDefaultRemote, setTimeout */
describe('rpc wrapper', function () {
    'use strict';
    var Wrapper, provider, wrap;

    beforeEach(function () {
        angular.module('test-wrapper', function () {
        }).config(function (RPCWrapperProvider) {
            provider = RPCWrapperProvider;
            Wrapper = RPCWrapperProvider.WrapperEventually;
            wrap = RPCWrapperProvider.wrapper;
        });
        // Finally setup for test
        module('js-rpc-wrapper', 'test-wrapper');

        inject(function () {});
    });

    describe('provider functions', function () {
        it('should have a wrapper constructor', function () {
            expect(typeof provider.wrapper).toBe('function');
        });

        it('should have a wrapper eventually constructor', function () {
            expect(typeof provider.WrapperEventually).toBe('function');
        });

        it('should have a $get function', function () {
            expect(typeof provider.$get).toBe('function');
        });

        it('should expose SimpleFakePromise', function () {
            expect(typeof provider.SimpleFakePromise).toBe('function');
        });
    });

    describe('wrapper function', function () {
        it('should just work', function () {
            var r = wrap({
                             testObj: {
                                 someFunc: {
                                     invoke: function () {
                                         var d = new provider.SimpleFakePromise();
                                         d = d.defer();
                                         d.resolve(65);
                                         return d.promise;
                                     }
                                 }
                             }
                         }, 'testObj', 'invoke');

            r.someFunc().then(function (result) {
                expect(result).toBe(65);
            });
        });
    });

    describe('wrapper class', function () {
        it('should be a constructor function', function () {
            expect(typeof Wrapper).toBe('function');
        });

        it('should throw given no params', function () {
            expect(function () {
                return new Wrapper();
            }).toThrow();
        });

        it('should throw given invalid params', function () {
            expect(function () {
                return new Wrapper(NaN);
            }).toThrow();
            expect(function () {
                return new Wrapper({});
            }).toThrow();
            expect(function () {
                return new Wrapper({}, NaN);
            }).toThrow();
        });

        it('should construct given valid params', function () {
            expect(new Wrapper([], 'b', 'invoke') instanceof Wrapper).toBe(true);
            expect(Wrapper([], 'b', 'invoke') instanceof Wrapper).toBe(true);
        });

        it('should provide, the provided api (I)', function () {
            var w = new Wrapper(['do'], 'testObj', 'invoke');

            expect(typeof w.do).toBe('function');
        });

        it('should provide, the provided api (I)', function () {
            var fns = ['be', 'there', 'you', 'silly', 'functions'], w = new Wrapper(fns, 'testObj', 'invoke');

            fns.forEach(function (fn) {
                expect(typeof w[fn]).toBe('function');
            });
        });


        it('should not resolve the functions until an \'origin\' is provided', function (done) {
            var fns = ['be', 'do'], w = new Wrapper(fns, 'testObj', 'invoke'), d1 = false, d2 = false;

            w.do('test1').then(function () {
                d1 = true;
                if (d1 && d2) { done(); }
            });

            w.be('test2').then(function () {
                d2 = true;
                if (d1 && d2) { done(); }
            });

            expect(d1).toBe(false);
            expect(d2).toBe(false);

            w.origin({
                         testObj: {
                             do: function (p) {
                                 expect(p).toBe('test1');
                             }, be: function (p) {
                                 expect(p).toBe('test2');
                             }
                         }
                     });
        });
    });
})
;
