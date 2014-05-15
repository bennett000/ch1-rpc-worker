/*global window, jasmine, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, SimpleFakePromise, SimpleDefer, afterEach*/

describe('Simple fake promises', function () {
    'use strict';

    var Q;
    beforeEach(function () {
        Q = new SimpleFakePromise();
    });

    describe('promise \'library\' API', function () {
        it('should provide a library object, with, or without new', function () {
            expect(new SimpleFakePromise() instanceof SimpleFakePromise).toBe(true);
            expect(SimpleFakePromise() instanceof SimpleFakePromise).toBe(true);
        });

        it('should provide a defer function', function () {
            expect(typeof Q.defer).toBe('function');
        });
    });

    describe('defer API', function () {
        it('should return defer objects', function () {
            expect(Q.defer() instanceof SimpleDefer).toBe(true);
        });

        it('should provide resolve/reject methods', function () {
            expect(typeof Q.defer().resolve).toBe('function');
            expect(typeof Q.defer().reject).toBe('function');
        });

        it('should privde a promise object', function () {
            expect(typeof Q.defer().promise).toBe('object');
        });
    });

    describe('promise API', function () {
        it('should provide a then method', function () {
            expect(typeof Q.defer().promise.then).toBe('function');
        });
    });

    describe('expected functionality', function () {
        var d, isDone = false;
        beforeEach(function () {
            d = new Q.defer();
        });

        afterEach(function () { isDone = false; });

        it('should call then method(s) on resolve', function () {
            d.promise.then(function () {
                isDone = true;
            });

            d.resolve();

            expect(isDone).toBe(true);
        });

        it('should throw on empty then, non functional success, or non functional/undefined fail', function () {
            expect(function () {
                d.promise.then('asdfasdf');
            }).toThrow();

            expect(function () {
                d.promise.then();
            }).toThrow();

            expect(function () {
                d.promise.then(function () {}, 'tomato');
            }).toThrow();

        });


        it('should call then method(s) on reject', function () {
            d.promise.then(function () {
                isDone = 'tomato';
            }, function () {
                isDone = true;
            });

            d.reject(new Error('test'));

            expect(isDone).toBe(true);
        });

        it('should throw if reject is not given an Error object', function () {
            d.promise.then(function () {
                isDone = 'tomato';
            }, function () {
                isDone = true;
            });

            expect(function () {
                d.reject('hi there, I\'m not an error');
            }).toThrow();

            d.reject(new Error('test'));

            expect(isDone).toBe(true);
        });

        it('should auto execute successful \'new\' thens (thens called after resolution) ', function () {
            d.promise.then(function () {
                isDone = true;
            }, function () {
                isDone = true;
            });

            d.resolve();
            expect(isDone).toBe(true);

            d.promise.then(function () {
               isDone = 'cheese!';
            });

            expect(isDone).toBe('cheese!');
        });

        it('should auto execute failing \'new\' thens (thens called after resolution) ', function () {
            d.promise.then(function () {
                isDone = true;
            }, function () {
                isDone = true;
            });

            d.reject(new Error('tester!'));
            expect(isDone).toBe(true);

            d.promise.then(function () {
            }, function () {
                isDone = 'failure!';
            });

            expect(isDone).toBe('failure!');
        });
    });
});