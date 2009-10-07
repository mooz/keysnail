/**
 * @fileOverview
 * @name shell.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Shell = function () {
    /**
     * @private
     */
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    var modules;

    var exts = {};
    var extArray;

    function createExtList() {
        var keyList = [];
        var extList = [];
        var name;

        for (name in exts) {
            keyList.push(name);
        }
        keyList = keyList.sort();

        for (var i = 0; i < keyList.length; ++i) {
            name = keyList[i];
            extList.push([name, exts[name].description]);
        }

        return extList;
    }

    function registerExt(aName, aBody, aReplace) {
        if (exts[aName] && !aReplace)
            return;
        exts[aName] = aBody;
    }

    function message(aMsg) {
        Application.console.log(aMsg);
    }

    // ================ public ================ //

    var self = {
        init: function () {
            if (KeySnail.windowType != "navigator:browser")
                return;

            modules = this.modules;
        },

        // set migemoMinWordLength(aNum) {
        //     if (typeof(aNum) == "number")
        //         migemoMinWordLength = Math.round(aNum);
        // },

        // set displayDelayTime(aMiliSec) {
        //     if (typeof(aMiliSec) == "number")
        //         displayDelayTime = aMiliSec;
        // },

        add: function (aName, aAction, aDescription, aOption, aReplace) {
            var body = {
                action: aAction,
                description: aDescription
            };

            if (typeof(aName) == "object") {
                aName.forEach(
                    function (name) {
                        registerExt(name, body, aReplace);
                    });
            } else {
                registerExt(aName, body, aReplace);
            }
        },

        description: function (aName) {
            if (exts[aName])
                return exts[aName].description;
            else
                return "";
        },

        do: function (aArgument) {
            extList = createExtList();

            var savedSubstrMatch = modules.prompt.substrMatch;
            modules.prompt.substrMatch = false;
            modules.prompt.read("Ext:",
                                function (name) {
                                    if (name in exts) {
                                        exts[name].action.apply(modules, [{}, aArgument]);
                                    } else {
                                        modules.display.echoStatusBar('command "' + name + '" not found');
                                    }
                                    modules.prompt.substrMatch = savedSubstrMatch;
                                },
                                null, extList, "", 0, "ext");

            // modules.prompt.selector(
            //     {
            //         message: "Ext:",
            //         callback: function (aIndex) {
            //             if (aIndex >= 0) {
            //                 var name = extList[aIndex][0];
            //                 exts[name].action.apply(modules, [{}, aArgument]);
            //             }
            //         },
            //         header: ["Name", "Description"],
            //         flags: [0, modules.IGNORE],
            //         collection: extList
            //     }
            // );
        }
    };

    return self;
}();

