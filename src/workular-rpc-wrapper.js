/**
 * file: workular-rpc-wrapper.js
 * Created by michael on 24/06/14.
 */

/*global workular*/

/**
 * @todo when workular upgrades to a provider model, just use the angular copy
 * @todo do not forget workular 5.1 has no bind method.. yet
 *
 * *Consider this a 'shim'*
 */

workular.module('js-rpc-wrapper', []).factory('RPCWrapper', ['underscore', function (_) {
    'use strict';

    /**
     * Generates an interface to a remote object that assumes all calls are the
     * given type 'callback', 'invoke', or 'promise'
     *
     * @param remote {Object} remote object to 'act' on
     * @param topLevelObj {string} name of the top level object to 'wrap'
     * @param type {string} callback, invoke, or promise
     * @returns {Object} wrapped object
     * @throws {TypeError} TypeErrors thrown given invalid inputs
     */
    function wrapRPC(remote, topLevelObj, type) {
        if (!remote[topLevelObj]) {
            throw new TypeError('wrapRPC: invalid toplevel object');
        }
        if ((type !== 'callback') && (type !== 'promise') && (type !== 'invoke')) {
            throw new TypeError('wrapRPC: invalid type, must be promise, callback, or invoke');
        }
        var rObj = Object.create(null);
        Object.keys(remote[topLevelObj]).forEach(function (attr) {
            var value = remote[topLevelObj][attr];
            // if we encounter a truthy object, recurse
            if ((remote[topLevelObj][attr]) && (typeof remote[topLevelObj][attr] === 'object')) {
                rObj[attr] = wrapRPC(remote[topLevelObj], attr, type);
            }
            if (!value[type]) { return; }
            if (typeof value[type] === 'function') {
                // don't forget to bind this sucker!
                rObj[attr] = _.bind(remote[topLevelObj][attr][type], remote[topLevelObj][attr]);
            }
        });
        return rObj;
    }

    return {
        wrapper: wrapRPC
    };
}]);

