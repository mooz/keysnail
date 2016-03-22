/**
 * @fileOverview
 * @name rcwizard.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

(function () {
    // {{%ARRANGE_MODULES%
    const { classes : Cc, interfaces : Ci } = Components;

    const { modules } = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator)
        .getMostRecentWindow("navigator:browser").KeySnail;

    const { my, share, persist, util, display, command, html, hook, macro, style,
            key, prompt, ext, shell, userscript, completer, vimp, L, M, plugins }
        = modules;
    // }}%ARRANGE_MODULES%

    var rcWizard = {
        modules: null,

        prefDirectory: null,
        defaultInitFileNames: null,

        rcFilePath: null,
        rcFileObject: null,

        schemeContext: null,

        onLoad: function () {
            this.prefDirectory        = userscript.prefDirectory;
            this.defaultInitFileNames = userscript.defaultInitFileNames;

            this.rcFilePath   = this.prefDirectory;
            this.rcFileObject = util.openFile(this.prefDirectory);

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

            let self = this;

            this.getSchemeFiles(function (files) {
                for (let leaf of files.map(function (f) f.leafName))
                {
                    try
                    {
                        if (!leaf.match(".+\\.js$"))
                            continue;

                        context[leaf] = {};
                        var path = "resource://keysnail-scheme/" + leaf;
                        Components.utils.import(path, context[leaf]);
                        var scheme = context[leaf].SCHEME;

                        var listitem = document.createElement("listitem");
                        listitem.setAttribute("class", "listitem-iconic");
                        listitem.setAttribute("style", "padding: 5px;border-bottom: 1px #BBB dotted;");
                        listitem.setAttribute("image", scheme.icon || defaultIconURL);
                        listitem.setAttribute("label", self.getString(scheme.name));
                        listitem.setAttribute("value", leaf);
                        listitem.setAttribute("tooltiptext", self.getString(scheme.description));

                        list.appendChild(listitem);
                    }
                    catch (x)
                    {
                        delete context[leaf];
                    }
                }

                var description = document.getElementById("keysnail-rcwizard-scheme-description");

                if (list.firstChild)
                {
                    list.selectItem(list.firstChild);
                    self.schemeListOnSelect();
                }

                list.ksInitialized = true;
            });
        },

        updatePageSelect: function () {
            var fileField = document.getElementById("keysnail-userscript-place");

            fileField.file = this.rcFileObject;
            fileField.label = this.rcFilePath;
        },

        // Key Scheme handling {{ =================================================== //

        getString: function (aLocaleString) {
            if (typeof aLocaleString === "string")
                return L(aLocaleString);
            else
                return M(aLocaleString);
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
        getSchemeFiles: function (next) {
            const ID = util.parent.id;

            function doNext(root) {
                root.append("schemes");
                next(util.readDirectory(root, true));
            }

            let am = {};
            Components.utils.import("resource://gre/modules/AddonManager.jsm", am);
            am.AddonManager.getAddonByID(ID, function (addon) {
                doNext(addon.getResourceURI('/').QueryInterface(Ci.nsIFileURL).file.clone());
            });
        },

        // }} ======================================================================= //

        // Utils {{ ================================================================= //

        changePathClicked: function (aUpdateFunction) {
            try {
                var nsIFilePicker = Ci.nsIFilePicker;
                var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

                fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
                // set default directory
                try {
                    fp.displayDirectory = util.openFile(this.prefDirectory);
                } catch (x) {
                    util.error("fp.displayDirectory", x);
                }

                var response = fp.show();
                if (response == nsIFilePicker.returnOK)
                {
                    if (aUpdateFunction == this.updatePageSelect &&
                        !util.isDirHasFiles(fp.file.path,
                                            this.defaultInitFileNames)) {
                        // directory has no rc file.
                        util.alert("KeySnail", util.getLocaleString("noUserScriptFound", [fp.file.path]));
                        return;
                    }

                    this.rcFileObject = fp.file;
                    this.rcFilePath = fp.file.path;
                    aUpdateFunction.apply(this);
                }
            } catch (x) {
                util.error("changePathClicked", x);
            }
        },

        setSpecialKeys: function (aStorage) {
            var keys = keyCustomizer.keys;
            for (var i = 0; i < keys.length; ++i)
            {
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

    window.rcWizard = rcWizard;
})();
