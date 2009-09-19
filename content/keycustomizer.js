var keyCustomizer = {
    prefPrefix: 'keysnail-userscript-key-',
    keys: [
        'quit',
        'help',
        'escape',
        'macroStart',
        'macroEnd',
        'suspend',
        'universalArgument',
        'negativeArgument1',
        'negativeArgument2',
        'negativeArgument3'
    ],

    initPane: function () {
        var keys = this.keys;
        for (var i = 0; i < keys.length; ++i) {
            this.setTextBoxValue(keys[i], this.modules.key[keys[i] + "Key"]);
        }

        this.changed = false;
    },

    set: function (aKeyName) {
        var output = {
            keyStr: ""
        };

        window.openDialog(
            'chrome://keysnail/content/keyGrabber.xul',
            '_blank',
            'chrome,modal,resizable=no,titlebar=no,centerscreen',
            output,
            this.modules.util.getLocaleString('setKey'),
            this.modules.util.getLocaleString('cancel')
        );

        if (output.keyStr != "") {
            this.setTextBoxValue(aKeyName, output.keyStr);
            this.modules.key[aKeyName] = output.keyStr;
        } else {
            this.setTextBoxValue(aKeyName, "Not defined");
        }
    },

    apply: function () {
        var keys = this.keys;
        for (var i = 0; i < keys.length; ++i) {
            this.modules.key[keys[i] + "Key"] = this.getTextBoxValue(keys[i]) || "";
        }
    },

    getSpecialKeys: function () {
        var specialKeys = {
            quitKey              : null,
            helpKey              : null,
            escapeKey            : null,
            macroStartKey        : null,
            macroEndKey          : null,
            universalArgumentKey : null,
            negativeArgument1Key : null,
            negativeArgument2Key : null,
            negativeArgument3Key : null,
            suspendKey           : null
        };

        for (var key in specialKeys) {
            specialKeys[key] = 
                document.getElementById(this.prefPrefix +
                                        key.slice(0, key.length - 3)).value || "";
        }

        return specialKeys;
    },

    setTextBoxValue: function (aKeyName, aValue) {
        var textBox = document.getElementById(this.prefPrefix + aKeyName);
        if (textBox.value != aValue)
            this.changed = true;
        textBox.value = aValue;
    },

    getTextBoxValue: function (aKeyName) {
        var textBox = document.getElementById(this.prefPrefix + aKeyName);
        return (textBox && textBox.value)
            || (null);
    }
};

(function () {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);
     var browserWindow = wm.getMostRecentWindow("navigator:browser");
     keyCustomizer.modules = browserWindow.KeySnail.modules;
 })();
