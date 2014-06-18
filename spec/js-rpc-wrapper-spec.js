/**
 * file: js-rpc-wrapper-spec.js
 * Created by michael on 18/06/14.
 */
/*global window, jasmine, angular, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, RPC, console, Q, RemoteProcedure, invalidRemote, validCustomRemote, customDesc, getRPCPair, getRPCPairAsync, validDefaultRemote, setTimeout */
describe('rpc wrapper', function () {
    'use strict';
    var Wrapper, provider;

    beforeEach(function () {
        angular.module('test-wrapper', function () {
        }).config(function (RPCWrapperProvider) {
            provider = RPCWrapperProvider;
            Wrapper = RPCWrapperProvider.Wrapper;
        });
        // Finally setup for test
        module('js-rpc-wrapper', 'test-wrapper');

        inject(function () {});
    });

    describe('provider functions', function () {
        it('should have a wrapper constructor', function () {
            expect(typeof provider.Wrapper).toBe('function');
        });

        it('should have a $get function', function () {
            expect(typeof provider.$get).toBe('function');
        });

        it('should expose SimpleFakePromise', function () {
            expect(typeof provider.SimpleFakePromise).toBe('function');
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
    });
});
