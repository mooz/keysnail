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

    setTextBoxValue: function (aKeyName, aValue) {
        var textBox = document.getElementById(this.prefPrefix + aKeyName);
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
