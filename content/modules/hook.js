/**
 * @fileOverview Provides hook system
 * @name hook.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

let hook = {
    // ==== hooks ====
    hookList: {},               // all hooks are stored in it

    init: function () {

    },

    setWhetherDefinedInExternalFile: function (aFunction) {
        if (key.inExternalFile)
            aFunction.ksDefinedInExternalFile = key.inExternalFile;
    },

    setHook: function (aHookName, aFunction) {
        this.setWhetherDefinedInExternalFile(aFunction);
        this.hookList[aHookName] = [aFunction];
    },

    addToHook: function (aHookName, aFunction) {
        if (!this.hookList[aHookName])
        {
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

    callHook: function (name, arg) {
        let hook = this.hookList[name];

        if (!hook)
            return;

        for (let [, action] in Iterator(hook)) {
            try {
                action(arg);
            } catch (x) {
                util.message("callHook :: " + x);
            }
        }
    }
};
