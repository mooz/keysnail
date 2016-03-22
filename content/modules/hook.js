/**
 * @fileOverview Provides hook system
 * @name hook.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var hook = {
    // ==== hooks ====
    hookList: {},               // all hooks are stored in it

    init: function () {

    },

    setWhetherDefinedInExternalFile: function (aFunction, doNotExport) {
        if (key.inExternalFile || doNotExport)
            aFunction.ksDefinedInExternalFile = true;
    },

    setHook: function (aHookName, aFunction, doNotExport) {
        this.setWhetherDefinedInExternalFile(aFunction, doNotExport);
        this.hookList[aHookName] = [aFunction];
    },

    addToHook: function (aHookName, aFunction, doNotExport) {
        if (!this.hookList[aHookName])
        {
            this.hookList[aHookName] = [];
        }
        this.setWhetherDefinedInExternalFile(aFunction, doNotExport);
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

        for (let [i, action] of util.keyValues(hook)) {
            try {
                action(arg);
            } catch (x) {
                util.error(x, "callHook %s[%s]", name, i);
            }
        }
    }
};
