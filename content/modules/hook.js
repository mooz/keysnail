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

    setWhetherDefinedInExternalFile: function (aFunction) {
        if (this.modules.key.inExternalFile)
            aFunction.ksDefinedInExternalFile = this.modules.key.inExternalFile;
    },

    setHook: function (aHookName, aFunction) {
        this.setWhetherDefinedInExternalFile(aFunction);
        this.hookList[aHookName] = [aFunction];
    },

    addToHook: function (aHookName, aFunction) {
        if (!this.hookList[aHookName]) {
            this.hookList[aHookName] = [];
        }
        this.setWhetherDefinedInExternalFile(aFunction);
        this.hookList[aHookName].push(aFunction);
    },

    removeHook: function (aHookName, aFunction) {
        var hook = this.hookList[aHookName];

        if (!hook)
            return;

        for (var i = 0; i < hook.length; ++i)
        {
            if (hook[i] == aFunction)
            {
                hook.splice(i, 1);
                break;
            }
        }
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
