/**
 * file: remote-procedure-spec.js
 * Created by michael on 15/05/14.
 */

/*global window, jasmine, beforeEach, describe, expect, waitsFor, spyOn, runs, it, module,inject, workular, RemoteProcedure, console, Q*/

describe('there should be a unique id function', function () {
    'use strict';
    var rp;
    beforeEach(function () {
        rp = new RemoteProcedure(function () {}, {});
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
        var rp2 = new RemoteProcedure(function () {}, {});

        expect(rp2.statics.uidCount).toBe(rp.statics.uidCount);
        rp2.uid();
        expect(rp2.statics.uidCount).toBe(rp.statics.uidCount);
        rp.uid();
        expect(rp2.statics.uidCount).toBe(rp.statics.uidCount);
    });
});