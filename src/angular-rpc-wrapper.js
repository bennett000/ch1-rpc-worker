/**
 * Provides a wrapper/facade to an object with async methods invoke/callback/promise
 * file: angular-rpc-wrapper
 * Created by michael on 17/06/14.
 */

/*global angular*/
angular.module('js-rpc-wrapper', []).provider('RPCWrapper', function () {
    'use strict';

    // not super happy with this solution...
    // the following is an inline copy of SimpleFakePromise
    /* jshint ignore:start */
    function SimpleDefer(){"use strict";if(!(this instanceof SimpleDefer))return new SimpleDefer;var a,b,c=this,d=[],e=[];c.promise=Object.create(null),c.promise.then=function(c,f){if("function"!=typeof c)throw new TypeError("then's first parameter must be a function");if(void 0!==f&&"function"!=typeof f)throw new TypeError("then second parameter {undefined|function}");void 0===a?(d.push(c),f&&e.push(f)):a?c.apply(null,b):f.apply(null,b)},c.resolve=function(){void 0===a&&(a=!0,b=Array.prototype.slice.call(arguments,0),d.forEach(function(a){a.apply(null,b)}),d=[])},c.reject=function(c){if(!(c instanceof Error))throw new Error("promise rejections must be Error objects");void 0===a&&(a=!1,b=[c],e.forEach(function(a){a(c)}),e=[])}}function SimpleFakePromise(){"use strict";return this instanceof SimpleFakePromise?void(this.defer=function(){return new SimpleDefer}):new SimpleFakePromise}
    /* jshint ignore:end */
    /*global SimpleFakePromise*/

    var Q = new SimpleFakePromise();
    /**
     *
     * @param functionList {Array.<string>}
     * @param topLevelObj {string} name of the top level object to 'wrap'
     * @param type {string} callback, invoke, or promise
     * @returns {boolean}
     * @throws on invalid parameters
     */
    function validateWrapperConstruct(functionList, topLevelObj, type) {
        if (!Array.isArray(functionList)) {
            return false;
        }
        if ((type !== 'callback') && (type !== 'promise') && (type !== 'invoke')) {
            return false;
        }

        if ((!topLevelObj) || (typeof topLevelObj !== 'string')) {
            return false;
        }

        return true;
    }

    function Wrapper(functionList, topLevelObj, type) {
        // guard
        if (!(this instanceof Wrapper)) {
            return new Wrapper(functionList, topLevelObj, type);
        }

        if (!validateWrapperConstruct(functionList, topLevelObj, type)) {
            throw new TypeError('RPC Wrapper: invalid parameters');
        }

        /** @dict, source of the wrapped function */
        var that = this, origin = Object.create(null);

        function checkFnExists(fn) {
            if (!origin[topLevelObj]) {
                return false;
            }
            if (!origin[topLevelObj][fn][type]) {
                return false;
            }
            if (typeof origin[topLevelObj][fn][type] === 'function') {
                return true;
            }
            return false;
        }

        /**
         * gets, and possibly sets the origin object, this is the object with
         * the 'target' functions to run
         * @param obj
         * @returns {null}
         */
        function getSetOrigin(obj) {
            if ((obj) && (typeof obj === 'object')) {
                origin = obj;
            }
            return origin;
        }

        /**
         * binds a given function
         * @param fn {string}
         * @returns {function(...)}
         */
        function bind(fn) {
            return angular.bind(origin[topLevelObj][fn], origin[topLevelObj][fn][type]);
        }


        /**
         * @param fn {string}
         * @param args {Array}
         * @returns {*}
         */
        function apply(fn, args) {
            return origin[topLevelObj][fn][type].apply(origin[topLevelObj][fn], args);
        }

        /**
         * returns a wrapped function that will eventually work
         * @param fn
         * @returns {wrappedFn}
         */
        function getWrappedFunction(fn) {
            var exists = checkFnExists(fn),
                delay = 15,
                delayMultiplier = 1.35,
                delayMax = 60000;

            if (exists) {
                return bind(fn);
            }

            /**
             * Polls a function, and runs it eventually
             * @param args {Array}
             * @param defer {Q.defer}
             */
            function poll(args, defer) {
                exists = checkFnExists(fn);
                if (exists) {
                    apply(fn, args).then(defer.resolve, defer.reject);
                    return;
                }
                /*global setTimeout, console */
                setTimeout(function () {
                    poll(args, defer);
                    delay *= delayMultiplier;
                    if (delay > delayMax) {
                        delay = delayMax;
                        console.warn('jsRPC Wrapper: no expected function timeout reached! ', fn);
                    }
                }, delay);
            }

            /**
             * Takes any arguments
             * @returns {*}
             */
            function wrappedFn() {
                var args = Array.prototype.slice.call(arguments, 0),
                    defer;
                if (exists) {
                    return apply(fn, args);
                } else {
                    exists = checkFnExists(fn);
                    if (exists) {
                        return apply(fn, args);
                    }
                    defer = Q.defer();

                    poll(args, defer);

                    return defer.promise;
                }
            }
            return wrappedFn;
        }

        /**
         * build the object
         */
        function init() {
            functionList.forEach(function(fn) {
                that[fn] = getWrappedFunction(fn);
            });
        }

        init();
        this.origin = getSetOrigin;
    }

    this.$get = function () { return Wrapper; };
    this.Wrapper = Wrapper;
    this.SimpleFakePromise = SimpleFakePromise;
});
