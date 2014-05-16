/**
 * file: remote-procedure-spec.js
 * Created by michael on 15/05/14.
 */

/*global window, jasmine, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, RemoteProcedure, console, Q, afterEach*/

describe('there should be a unique id function', function () {
    'use strict';
    var rp;
    beforeEach(function () {
        rp = new RemoteProcedure(function () {}, {}, 'fn');
    });

    it('should have a function called uid', function () {
        expect(typeof rp.uid).toBe('function');
    });

    it('should generate unique ids', function () {
        var i, cur, last = 0;

        for (i = 0; i < 10000; i += 1) {
            cur = rp.uid();
            expect(last === cur).toBe(false);
            last = cur;
        }
    });

    it('should have a uidCount that is a \'static\' member', function () {
        var rp2 = new RemoteProcedure(function () {}, {}, 'fn');

        expect(rp2.statics.uidCount).toBe(rp.statics.uidCount);
        rp2.uid();
        expect(rp2.statics.uidCount).toBe(rp.statics.uidCount);
        rp.uid();
        expect(rp2.statics.uidCount).toBe(rp.statics.uidCount);
    });
});

describe('there should be the expected remote procedure interfaces', function () {
    'use strict';
    var rp;
    beforeEach(function () {
        rp = new RemoteProcedure(function () {}, {}, 'fn');
    });

    it('should have an invoke function', function () {
        expect(typeof rp.invoke).toBe('function');
    });

    it('should have a callback function', function () {
        expect(typeof rp.callback).toBe('function');
    });

    it('should have a promise function', function () {
        expect(typeof rp.promise).toBe('function');
    });

    it('should have a listen function', function () {
        expect(typeof rp.listen).toBe('function');
    });

    it('should have an ignore function', function () {
        expect(typeof rp.ignore).toBe('function');
    });
});

describe('the function callers should post the expected messages', function () {
    'use strict';
    var postData = '', callbacks = {}, rp;

    beforeEach(function () {
        callbacks = {};
        postData = '';
        rp = new RemoteProcedure(function testPost(message) {
            postData = JSON.parse(message);
        }, callbacks, 'fn');
    });

    function testMessageResult(type) {
        it ('should send ' + type + ' messages', function () {
            rp[type]('hello');

            expect(postData[type]).toBeTruthy();
            expect(Array.isArray(postData[type])).toBe(true);
            expect(postData[type][0]).toBeTruthy();
            expect(postData[type][0].fn).toBe('fn');
            expect(Array.isArray(postData[type][0].args)).toBe(true);
            expect(postData[type][0].args[0]).toBe('hello');
        });
    }

    testMessageResult('invoke');
    testMessageResult('promise');
    testMessageResult('callback');

    function testCallbackRegistry(type) {
        it ('should register callbacks for ' + type + ' messages', function () {
            rp[type]('hello');

            Object.keys(callbacks).forEach(function (uid) {
                expect(typeof callbacks[uid]).toBe('object');
                expect(typeof callbacks[uid].t).toBe('function');
                expect(typeof callbacks[uid].f).toBe('function');
            });

            expect(Object.keys(callbacks).length).toBe(1);
            rp[type]('goodbye');
            expect(Object.keys(callbacks).length).toBe(2);
        });
    }

    testCallbackRegistry('invoke');
    testCallbackRegistry('callback');
    testCallbackRegistry('promise');
});

