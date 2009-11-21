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

    schemeContext: null,

    onLoad: function () {
        this.prefDirectory        = this.modules.userscript.prefDirectory;
        this.defaultInitFileNames = this.modules.userscript.defaultInitFileNames;
        this.directoryDelimiter   = this.modules.userscript.directoryDelimiter;

        this.rcFilePath   = this.prefDirectory;
        this.rcFileObject = this.modules.util.openFile(this.prefDirectory);

        window.document.documentElement.setAttribute("windowtype", window.name);
    },

    selectMethod: function () {
        var menuList  = document.getElementById("keysnail-rcwizard-selectmethod");
        var startPage = document.getElementById("keysnail-rcwizard-startpage");

        startPage.next = ["create-rcfile", "select-rcfile"][menuList.selectedIndex];

        return true;
    },

    updatePageCreate: function () {
        var fileField = document.getElementById("keysnail-userscript-destination");

        // Note: DO *NOT* change the order of these two lines.
        fileField.file  = this.rcFileObject;
        fileField.label = this.rcFilePath;
    },

    updatePageScheme: function () {
        var list = document.getElementById("keysnail-rcwizard-scheme-list");

        if (list.ksInitialized === true)
            return;

        var defaultIconURL = "chrome://keysnail/skin/icon/empty.png";
        var context        = this.schemeContext = {};

        for each (var leaf in this.getSchemeFiles().map(function (aFile) aFile.leafName))
        {
            try
            {
                if (!leaf.match(".+\\.js$"))
                    continue;

                context[leaf] = {};
                var path = "resource://keysnail-scheme/" + leaf;
                window.alert(path);
                Components.utils.import(path, context[leaf]);
                var scheme = context[leaf].SCHEME;

                var listitem = document.createElement("listitem");
                listitem.setAttribute("class", "listitem-iconic");
                listitem.setAttribute("style", "padding: 5px;border-bottom: 1px #BBB dotted;");
                listitem.setAttribute("image", scheme.icon || defaultIconURL);
                listitem.setAttribute("label", this.getString(scheme.name));
                listitem.setAttribute("value", leaf);

                list.appendChild(listitem);
            }
            catch (x)
            {
                window.alert(x);
                delete context[leaf];
            }
        }

        var description = document.getElementById("keysnail-rcwizard-scheme-description");

        if (list.firstChild)
        {
            list.selectItem(list.firstChild);
            this.schemeListOnSelect();
        }

        list.ksInitialized = true;
    },

    updatePageSelect: function () {
        var fileField = document.getElementById("keysnail-userscript-place");

        fileField.file = this.rcFileObject;
        fileField.label = this.rcFilePath;
    },

    // Key Scheme handling {{ =================================================== //

    getString: function (aLocaleString) {
        if (typeof aLocaleString === "string")
            return this.modules.L(aLocaleString);
        else
            return this.modules.M(aLocaleString);
    },

    schemeListOnSelect: function (event) {
        var list   = document.getElementById("keysnail-rcwizard-scheme-list");
        var scheme = this.schemeContext[list.selectedItem.getAttribute("value")].SCHEME;

        var description = document.getElementById("keysnail-rcwizard-scheme-description");
        description.value = this.getString(scheme.description);
    },

    /**
     * returns all available scheme files
     * @returns {[nsILocalFile]} scheme files
     */
    getSchemeFiles: function () {
        const ID = "keysnail@mooz.github.com";
        var installedLocation = Components.classes["@mozilla.org/extensions/manager;1"]
            .getService(Components.interfaces.nsIExtensionManager)
            .getInstallLocation(ID);

        var ksSchemeRoot = installedLocation.location;
        ksSchemeRoot.append(ID);
        ksSchemeRoot.append("schemes");

        window.alert(ksSchemeRoot.path);

        return this.modules.util.readDirectory(ksSchemeRoot, true);
    },

    // }} ======================================================================= //

    // Utils {{ ================================================================= //

    changePathClicked: function (aUpdateFunction) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);

        fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
        // set default directory
        fp.displayDirectory = this.modules.util.openFile(this.prefDirectory);

        var response = fp.show();
        if (response == nsIFilePicker.returnOK)
        {
            if (aUpdateFunction == this.updatePageSelect &&
                !this.modules.util.isDirHasFiles(fp.file.path, this.directoryDelimiter, this.defaultInitFileNames))
            {
                // directory has no rc file.
                this.modules.util.alert("KeySnail", this.modules.util.getLocaleString("noUserScriptFound", [fp.file.path]));
                return;
            }

            this.rcFileObject = fp.file;
            this.rcFilePath = fp.file.path;
            // aUpdateFunction() does not works well
            // because the 'this' value becomes 'button' widget
            aUpdateFunction.apply(this);
        }
    },

    setSpecialKeys: function (aStorage) {
        var keys = keyCustomizer.keys;
        for (var i = 0; i < keys.length; ++i) {
            aStorage[keys[i] + "Key"] = keyCustomizer.getTextBoxValue(keys[i]);
        }
    },

    // }} ======================================================================= //

    // Termination {{ =========================================================== //

    onFinish: function () {
        if (!this.rcFilePath || !this.rcFileObject)
            return false;

        var selectedMethod = document.getElementById("keysnail-rcwizard-startpage").next;

        // return changed arguments
        window.arguments[0].out = {};
        window.arguments[0].out.selectedMethod = selectedMethod;

        // ================ init file path ================ //
        window.arguments[0].out.rcFilePath = this.rcFilePath;
        window.arguments[0].out.configFileNameIndex
            = document.getElementById("keysnail-userscript-filename-candidates").selectedIndex;

        if (selectedMethod == 'create-rcfile')
        {
            // Set information for creating new one {{ ================================== //

            var list   = document.getElementById("keysnail-rcwizard-scheme-list");
            var scheme = this.schemeContext[list.selectedItem.getAttribute("value")].SCHEME;
            window.arguments[0].out.scheme = scheme;

            // }} ======================================================================= //
        }

        return true;
    },

    onCancel: function () {
        // When user clicked "cancel" button, window.arguments[0].out is left to null.
        window.arguments[0].out = null;

        return true;
    }

    // }} ======================================================================= //
};

(function () {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);
     var browserWindow = wm.getMostRecentWindow("navigator:browser");
     rcWizard.modules = browserWindow.KeySnail.modules;
 })();
