/**
 * @fileOverview
 * @name hook.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Hook = {
    // ==== common ====
    modules: null,

    // ==== hooks ====
    hookList: {},               // all hooks are stored in it

    init: function () {

    },

    setHook: function (aHookName, aFunction) {
        this.hookList[aHookName] = [aFunction];
    },

    addToHook: function (aHookName, aFunction) {
        if (!this.hookList[aHookName]) {
            this.hookList[aHookName] = [];
        }
        this.hookList[aHookName].push(aFunction);
    },

    callHook: function (aHookName, aArgument) {
        if (this.hookList[aHookName]) {
            var hook = this.hookList[aHookName];
            for (var i = 0; i < hook.length; ++i) {
                hook[i].apply(KeySnail, [aArgument]);
            }
        }
    }
};
