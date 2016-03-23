/**
 * @fileOverview Provides command system
 * @name ext.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var ext = function () {
    /**
     * @private
     */
    const Cc = Components.classes;
    const Ci = Components.interfaces;

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

        for (let name of keyList)
            extList.push([name, exts[name].description || ""]);

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
            if (!KeySnail.isMainWindow)
                return;
        },

        get exts () {
            return exts;
        },

        add: function (aName, aAction, aDescription, aOption) {
            var body = {
                action: aAction,
                description: aDescription
            };

            if (typeof(aName) == "object") {
                aName.forEach(
                    function (name) {
                        registerExt(name, body, true);
                    });
            } else {
                registerExt(aName, body, true);
            }
        },

        exec: function (aName, aArgument, aEvent) {
            if (aName in exts) {
                exts[aName].action(aEvent || {}, aArgument);
            } else {
                display.echoStatusBar('ext "' + aName + '" not found');
            }
        },

        /**
         * Get description for ext specified by <aName>
         * @param {string} aName ext's name
         * @returns {string} ext's description
         */
        description: function (aName) {
            if (aName in exts) {
                return exts[aName].description;
            } else {
                return "";
            }
        },

        /**
         * Portal of the ext. All exts are listed and executed when user select the one.
         * @param {integer} aArgument Prefix argument passed to the ext
         */
        select: function (aArgument, aEvent) {
            extList = createExtList();

            // var savedSubstrMatch = modules.prompt.substrMatch;
            // modules.prompt.substrMatch = false;
            // modules.prompt.read("Ext:",
            //                     function (name) {
            //                         if (name in exts) {
            //                             exts[name].action.apply(modules, [{}, aArgument]);
            //                         } else {
            //                             modules.display.echoStatusBar('command "' + name + '" not found');
            //                         }
            //                         modules.prompt.substrMatch = savedSubstrMatch;
            //                     },
            //                     null, extList, "", 0, "ext");

            prompt.selector({
                message: (aArgument ? key.universalArgumentKey + " " : "") + "Ext:",
                callback: function (aIndex) {
                    if (aIndex >= 0) {
                        var name = extList[aIndex][0];
                        self.exec(name, aArgument, aEvent);
                    }
                },
                header: ["Name", "Description"],
                collection: extList
            });
        }
    };

    return self;
}();

