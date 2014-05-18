/**
 * file: simple-fake-promise.js
 * Created by michael on 15/05/14.
 *
 * These promises are not 'real' in the sense that they can function
 * synchronously.  They are _only_ intended for use in applications where
 * asynchronicity is already implied.  For example on one side of a web worker,
 * or on the side of a socket.
 */

function SimpleDefer() {
    'use strict';
    if (!(this instanceof SimpleDefer)) {
        return new SimpleDefer();
    }

    var that = this, passes = [], fails = [], resolution, resultArgs;

    that['promise'] = Object.create(null);

    that.promise['then'] = function simpleThen(pass, fail) {
        if (typeof pass !== 'function') {
            throw new TypeError('then\'s first parameter must be a function');
        }
        if ((fail !== undefined) && (typeof fail !== 'function')) {
            throw new TypeError('then second parameter {undefined|function}');
        }

        if (resolution === undefined) {
            // if the promise is not resolved add the thens
            passes.push(pass);
            if (fail) {
                fails.push(fail);
            }
        } else {
            // if the promise is resolved, call the functions
            if (resolution) {
                pass.apply(null, resultArgs);
            } else {
                fail.apply(null, resultArgs);
            }
        }
    };

    that['resolve'] = function simpleResolve () {
        // resolve the promise if it has not already been resolved
        if (resolution === undefined) {
            resolution = true;
        } else { return; }

        resultArgs = Array.prototype.slice.call(arguments, 0);

        passes.forEach(function (pass) {
            pass.apply(null, resultArgs);
        });

        passes = [];
    };

    /**
     * rejects a promise
     * @param err {Error}
     */
    that['reject'] = function simpleReject (err) {
        if (!(err instanceof Error)) {
            throw new Error('promise rejections must be Error objects');
        }

        // reject the promise if it has not already been resolved
        if (resolution === undefined) {
            resolution = false;
        } else { return; }

        resultArgs = [err];

        fails.forEach(function (failFn) {
            failFn(err);
        });

        fails = [];
    };
}

function SimpleFakePromise() {
    'use strict';

    // ensure object constructor
    if (!(this instanceof SimpleFakePromise)) {
        return new SimpleFakePromise();
    }

    this.defer = function simpleDefer() {
        return new SimpleDefer();
    };
}