/**
 * @fileOverview
 * @name rcwizard.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var rcWizard = {
    modules: null,

    prefDirectory: null,
    defaultInitFileNames: null,
    directoryDelimiter: null,

    rcFilePath: null,
    rcFileObject: null,

    onLoad: function () {
        // to access the utility
        this.modules = window.arguments[0].inn.modules;

        this.prefDirectory = this.modules.userscript.prefDirectory;
        this.defaultInitFileNames = this.modules.userscript.defaultInitFileNames;
        this.directoryDelimiter = this.modules.userscript.directoryDelimiter;

        this.rcFilePath = this.prefDirectory;
        this.rcFileObject = this.modules.util.openFile(this.prefDirectory);

        window.document.documentElement.setAttribute("windowtype", window.name);
    },

    selectMethod: function () {
        var menuList
            = document.getElementById("keysnail-rcwizard-selectmethod");
        var startPage
            = document.getElementById("keysnail-rcwizard-startpage");

        startPage.next = ["create-rcfile", "select-rcfile"]
        [menuList.selectedIndex];

        // switch (menuList.selectedIndex) {
        // case 0:
        //     startPage.next = "create-rcfile";
        //     break;
        // case 1:
        //     startPage.next = "select-rcfile";
        //     break;
        // }

        return true;
    },

    updatePageCreate: function () {
        var fileField = document.getElementById("keysnail-userscript-destination");

        // Note: Do *NOT* change these two lines order
        fileField.file = this.rcFileObject;
        fileField.label = this.rcFilePath;
    },

    updatePageSelect: function () {
        var fileField = document.getElementById("keysnail-userscript-place");

        fileField.file = this.rcFileObject;
        fileField.label = this.rcFilePath;
    },

    // ==================== util ==================== //

    pathToLocalFile: function (aPath) {
        var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance();
        var localFile = file
            .QueryInterface(Components.interfaces.nsILocalFile);
        if (!localFile) return false;

        localFile.initWithPath(aPath);

        return localFile;
    },

    changePathClicked: function (aUpdateFunction) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);

        fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
        // set default directory
        fp.displayDirectory = this.modules.util.openFile(this.prefDirectory);

        var response = fp.show();
        if (response == nsIFilePicker.returnOK) {
            if (aUpdateFunction == this.updatePageSelect &&
                !this.modules.util.isDirHasFiles(fp.file.path,
                                                 this.directoryDelimiter,
                                                 this.defaultInitFileNames)) {
                // directory has no rc file.
                this.modules.util.alert(window, "KeySnail",
                                        this.modules.util.getLocaleString("noUserScriptFound",
                                                                          [fp.file.path]));
                return;
            }

            this.rcFileObject = fp.file;
            this.rcFilePath = fp.file.path;
            // aUpdateFunction() does not works well
            // because the 'this' value becomes 'button' widget
            aUpdateFunction.apply(rcWizard);
        }
    },

    setSpecialKeys: function (aStorage) {
        var keys = keyCustomizer.keys;
        for (var i = 0; i < keys.length; ++i) {
            aStorage[keys[i] + "Key"] = keyCustomizer.getTextBoxValue(keys[i]);
        }
    },

    // ==================== termination ==================== //

    onFinish: function () {
        if (!this.rcFilePath || !this.rcFileObject) {
            return false;
        }

        var selectedMethod = document.getElementById("keysnail-rcwizard-startpage").next;

        // return changed arguments
        window.arguments[0].out = {};
        window.arguments[0].out.selectedMethod = selectedMethod;

        // ================ init file path ================ //
        window.arguments[0].out.rcFilePath = this.rcFilePath;
        window.arguments[0].out.configFileNameIndex
            = document.getElementById("keysnail-userscript-filename-candidates").selectedIndex;

        if (selectedMethod == 'create-rcfile') {
            // ================ special keys ================ //
            window.arguments[0].out.keys = {};
            this.setSpecialKeys(window.arguments[0].out.keys);
            // ================ scheme ================ //
            var selectedScheme = ["emacs", null]
            [document.getElementById("keysnail-rcwizard-selectscheme").selectedIndex];
            window.arguments[0].out.selectedScheme = selectedScheme;
            // ================ document ================ //
            window.arguments[0].out.insertDocument = 
                document.getElementById("keysnail-rcwizard-selectscheme-insert-document").checked;
        }

        return true;
    },

    onCancel: function () {
        // When user clicked "cancel" button, window.arguments[0].out is left to null.
        window.arguments[0].out = null;

        return true;
    }
};

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
        } else {
            this.setTextBoxValue(aKeyName, "Not defined");
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
     rcWizard.modules = keyCustomizer.modules = browserWindow.KeySnail.modules;
 })();
