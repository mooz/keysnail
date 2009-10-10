/**
 * @fileOverview
 * @name userscript.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.UserScript = {
    modules: null,

    // ==== user configuration file name ====
    // at first .keysnail.js is used. When the file not found,
    // then the _keysnail.js is used. (for Windows user)
    defaultInitFileNames: [".keysnail.js", "_keysnail.js"],
    initFilePath: null,

    directoryDelimiter: null,

    // init file base
    prefDirectory: null,
    // if specified, use this path
    userPath: null,
    // pathes user script loaded from
    loadPath: [],

    // may access from other modules
    initFileLoaded: false,

    preserve: {
        beginSign : "//{{%PRESERVE%",
        endSign   : "//}}%PRESERVE%",
        code: null
    },

    // line number of the Function() constructor
    userScriptOffset: 48,

    // ==================== Loader ==================== //

    /**
     * load js file and execute its content under *KeySnail.modules* scope
     * @param {string} aScriptPath
     */
    jsFileLoader: function (aScriptPath, aPreserve) {
        var code = this.modules.util.readTextFile(aScriptPath).value;
        if (KeySnail.windowType == "navigator:browser" && aPreserve)
            this.preserveCode(code);
        Function("with (KeySnail.modules) {" + code + " }")();
    },

    /**
     * load initialization file (wrap jsFileLoader)
     * @param {string} aInitFilePath
     * @throws {string} error message
     */
    initFileLoader: function (aInitFilePath) {
        var savedStatus = this.modules.key.inExternalFile;
        this.modules.key.inExternalFile = false;
        try {
            var start = new Date();
            this.jsFileLoader(aInitFilePath, true);
            var end = new Date();
        } catch (e) {
            if (!e.fileName || e.fileName == "chrome://keysnail/content/modules/userscript.js") {
                e.fileName = aInitFilePath;
                e.lineNumber -= (this.userScriptOffset - 1);
            }

            this.modules.key.inExternalFile = savedStatus;
            throw e;
        }
        this.modules.key.inExternalFile = savedStatus;

        this.initFilePath = aInitFilePath;

        this.modules.display
            .echoStatusBar("KeySnail :: [" + aInitFilePath + "] :: " +
                           this.modules.util
                           .getLocaleString("initFileLoaded", [(end - start) / 1000]),
                           3000);
    },

    loadSubScript: function (aURI, aContext) {
        if (aURI.indexOf("file://") != 0)
            aURI = this.modules.util.pathToURL(aURI);

        Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Components.interfaces.mozIJSSubScriptLoader)
            .loadSubScript(aURI, aContext);
    },

    // ======================================== //

    init: function () {
        // Note: Do *NOT* call this method before the "key" module initialization.
        // Keymaps used in userscript are arranged in key.init().
        // In most case, this module have to be initialized
        // after all other modules initializations are done.

        [this.prefDirectory, this.directoryDelimiter]
            = this.getPrefDirectory();

        this.userPath = this.modules.util
            .getUnicharPref("extensions.keysnail.userscript.location");

        if (!this.userPath) {
            this.userPath = this.prefDirectory;
            this.modules.util.setUnicharPref("extensions.keysnail.userscript.location", this.userPath);
        }

        /**
         * In userscript.require'ed script, the multibyte character like Japanese
         * is not correctly processed.
         * So author of the plugin have to use this function like below.
         * L("日本語")
         */
        this.modules.L = function (aStr) {
            return decodeURIComponent(escape(aStr));
        };

        // Arrange plugin scope
        this.modules.plugins = {};

        this.load();
    },

    linkMembers: function (aFrom, aTo, aMembers) {
        for (var i = 0; i < aMembers.length; ++i) {
            aTo[aMembers[i]] = aFrom[aMembers[i]];
        }
    },

    /**
     * load init file
     */
    load: function () {
        var loadStatus = -1;

        loadStatus = this.loadUserScript(this.initFileLoader,
                                         this.userPath,
                                         this.defaultInitFileNames);

        if (loadStatus == -1) {
            // file not found.
            // we need to create the new one
            // or let user to select the init file place
            if (this.parent.windowType == "navigator:browser") {
                loadStatus = this.beginRcFileWizard();
            }
        }

        if (loadStatus == 0) {
            this.initFileLoaded = true;
        } else {
            // failed. disable the keysnail.
            this.initFileLoaded = false;

            this.modules.key.stop();
            this.modules.key.updateMenu();
            this.modules.key.updateStatusBar();
        }
    },

    /**
     * reload the init file
     */
    reload: function () {
        // clear current keymaps
        this.modules.key.keyMapHolder = {};
        this.modules.key.blackList    = [];
        this.modules.hook.hookList    = {};

        this.userPath = this.modules.util.getUnicharPref("extensions.keysnail.userscript.location");

        this.modules.key.init();
        this.load();
    },

    /**
     * load user script (js file)
     * @param {Function(String)} aLoader
     * @param {String} aBaseDir base directory of the js file (e.g. "/home/hoge")
     * @param {[String]} aUserScriptNames script names to load
     * @return {int} status
     *  0: success
     * -1: file not found
     * -2: error occured in the js file
     */
    loadUserScript: function (aLoader, aBaseDir, aUserScriptNames) {
        var prefix = aBaseDir + this.directoryDelimiter;
        var filePath;

        for (var i = 0; i < aUserScriptNames.length; ++i) {
            filePath = prefix + aUserScriptNames[i];

            if (!this.modules.util.openFile(filePath).exists()) {
                // not exist. skip
                continue;
            }

            try {
                aLoader.call(this, filePath);
                // success
                // this.message(filePath + " loaded");
                return 0;
            } catch (e) {
                // userscript error
                var msgstr = this.modules.util
                    .getLocaleString("userScriptError", [e.fileName, e.lineNumber]);
                msgstr += " [" + e.message + "]";

                var buttons;
                if ((e.fileName || "").indexOf("://") == -1) {
                    let self = this;
                    buttons = [{
                                   label: this.modules.util.getLocaleString("openErrorOccuredPlace"),
                                   callback: function (aNotification) {
                                       self.editFile(e.fileName, e.lineNumber);
                                       aNotification.close();
                                   },
                                   accessKey: "o"
                               }];
                }
                this.modules.display.notify(msgstr, buttons);
                return -2;
            }
        }

        // file not found
        return -1;
    },

    /**
     * load script specified by <aFileName> in the load path
     * scripts are executed under the KeySnail.modules scope
     * @param {String} aFileName
     * @augments
     */
    require: function (aFileName) {
        var baseDir;

        this.modules.key.inExternalFile = true;
        for (var i = 0; i < this.loadPath.length; ++i) {
            baseDir = this.loadPath[i];
            if (!baseDir)
                continue;

            // loadUserScript return -1 when file not found
            if (this.loadUserScript(this.jsFileLoader,
                                    baseDir,
                                    [aFileName]) != -1)
                break;
        }
        this.modules.key.inExternalFile = false;
    },

    /**
     * add load path.
     * ~ in the head of path will be expanded to $HOME or $USERPROFILE
     * @param {String} aPath
     */
    addLoadPath: function (aPath) {
        // sh-like expansion
        aPath = aPath.replace(/^~/, this.prefDirectory);

        if (aPath[aPath.length - 1] == this.directoryDelimiter) {
            aPath = aPath.substr(0, aPath.length - 1);
        }

        // avoid duplication / not existing directory
        if (!this.loadPath.some(function (aContainedPath) { return aContainedPath == aPath; } )
            && this.modules.util.openFile(aPath).exists()) {
            this.loadPath.push(aPath);
        }
    },

    // ==================== edit ==================== //

    syncEditorWithGM: function () {
        var gmEditor = this.modules.util.getUnicharPref("greasemonkey.editor");
        if (gmEditor) {
            this.modules.util.setUnicharPref("extensions.keysnail.userscript.editor", gmEditor);
        }

        return gmEditor;
    },

    /**
     *
     * @param {} aLineNum
     */
    editInitFile: function (aLineNum) {
        this.editFile(this.initFilePath, aLineNum);
    },

    /**
     *
     * @param {} aFilePath
     * @param {} aLineNum
     */
    editFile: function (aFilePath, aLineNum) {
        var args = [aFilePath];

        if (typeof(aLineNum) == 'number')
            args.push("+" + aLineNum.toString());

        if (!aFilePath) {
            this.modules.display.notify(this.modules.util
                                        .getLocaleString("invalidFilePath"));
            return;
        }

        var editorPath = this.modules.util
            .getUnicharPref("extensions.keysnail.userscript.editor");

        if (!editorPath &&
            !(editorPath = this.syncEditorWithGM())) {
            this.modules.display.notify(this.modules.util
                                        .getLocaleString("noEditorSelected"));
            return;
        }

        var editorFile;
        var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
            .getService(Components.interfaces.nsIXULRuntime);
        if ("Darwin" == xulRuntime.OS) {
            // wrap with open command (inspired from GreaseMonkey)

            args.unshift(editorPath);
            args.unshift("-a");

            editorFile = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
            editorFile.followLinks = true;
            editorFile.initWithPath("/usr/bin/open");
        } else {
            try {
                editorFile = this.modules.util.openFile(editorPath);
            } catch (e) {
                this.modules.display.notify(this.modules.util
                                            .getLocaleString("editorErrorOccured"));
                return;
            }

            if (!editorFile.exists()) {
                this.modules.display.notify(this.modules.util
                                            .getLocaleString("editorNotFound", [editorFile.path]));
                return;
            }
        }

        var process = Components.classes["@mozilla.org/process/util;1"]
            .createInstance(Components.interfaces.nsIProcess);
        process.init(editorFile);

        process.run(false, args, args.length);
    },

    // ==================== util / wizard ==================== //

    /**
     * Preserve the code in init file, specified area
     * @param {string} aCode whole code of init file
     */
    preserveCode: function (aCode) {
        var beginPos = aCode.indexOf(this.preserve.beginSign);
        var endPos = aCode.indexOf(this.preserve.endSign);

        if (beginPos != -1 && endPos != -1) {
            beginPos += this.preserve.beginSign.length + 1;
            endPos--;
            this.preserve.code = aCode.slice(beginPos, endPos);
        } else {
            this.preserve.code = "";
        }
    },

    /**
     *
     * @returns
     */
    getPrefDirectory: function () {
        var pref = null;
        var delimiter = null;
        var osName = this.modules.util.getSystemInfo()
            .getProperty("name");

        if (osName.search(/windows/i) != -1) {
            pref = this.modules.util.getEnv("USERPROFILE");
            delimiter = "\\";
        } else {
            pref = this.modules.util.getEnv("HOME");
            delimiter = "/";
        }

        return [pref, delimiter];
    },

    /**
     * @returns {integer} status
     */
    beginRcFileWizard: function () {
        var loadStatus = -1;

        if (this.openDialog()) {
            loadStatus = this.loadUserScript(this.initFileLoader,
                                             this.userPath,
                                             this.defaultInitFileNames);
        }

        if (loadStatus == 0) {
            this.initFileLoaded = true;
            this.modules.key.run();
            this.modules.key.updateMenu();
            this.modules.key.updateStatusBar();
        }

        return loadStatus;
    },

    /**
     * @returns {boolean}
     */
    openDialog: function () {
        var params = {
            inn: {
                modules: this.modules
            },
            out: null
        };

        function myCenterScreen(windowWidth, windowHeight) {
            var x = (screen.width - windowWidth) / 2;
            var y = (screen.height - windowHeight) / 2;
            return "left=" + x + ",top=" + y;
        }

        // width="600px"
        // height="600px"
        // chrome,dialog,modal,centerscreen,dependent
        window.openDialog("chrome://keysnail/content/rcwizard.xul",
                          "keysnail:initFileWizard",
                          "chrome=yes,titlebar=yes,dialog=yes,modal=yes,resizable=yes,scrollbars=yes," + myCenterScreen(600, 600),
                          params);

        if (!params.out) {
            return false;
        }

        var rcFilePlace = params.out.rcFilePath;

        switch (params.out.selectedMethod) {
        case "select-rcfile":
            // params.out.rcFilePath means the directory
            // where userscript located.
            // there are nothing to do in this method.
            break;
        case "create-rcfile":
            // params.out.destinationPath means the destination directory
            // where default-userscript copied.
            // now copy default configuration file to there.
            var configFileName = this.defaultInitFileNames[params.out.configFileNameIndex];

            // var tank = {};
            // try {
            //     Components.utils.import("resource://keysnail-share/functions.js", tank);
            // } catch (x) {
            // }

            var defaultInitFileBase = "chrome://keysnail/content/resources/.keysnail.js.";
            var scheme = (params.out.selectedScheme == null) ? "" : params.out.selectedScheme + ".";
            var userLocale = params.out.selectedLocale || "en";

            var defaultInitFile = this.modules.util.getContents(defaultInitFileBase + scheme + userLocale);

            if (!defaultInitFile) {
                defaultInitFile = this.modules.util.getContents(defaultInitFileBase + scheme + "en");
            }

            if (!defaultInitFile) {
                this.modules.display.notify(this.modules.util
                                            .getLocaleString("failedToOpenDefaultInitFile"));
                return false;
            }

            // ================ insert document ================ //
            var documentString = "";
            if (params.out.insertDocument) {
                var doc = "doc.";
                documentString = this.modules.util.getContents(defaultInitFileBase + doc + userLocale);
                if (!documentString) {
                    documentString = this.modules.util.getContents(defaultInitFileBase + doc + "en");
                }
            }
            defaultInitFile = defaultInitFile.replace('####REPLACE_WITH_DOC####', documentString);

            // ================ insert special key settings ================ //
            var keys = params.out.keys;
            var specialKeySettings = [];
            var maxLen = Math.max.apply(null, [str.length for each (str in
                                                                    (function (obj) {
                                                                         for (var key in obj) yield key;
                                                                     })(keys))]);
            for (var key in keys) {
                var padding = Math.max(maxLen - key.length, 0) + 2;
                specialKeySettings.push('key.' + key +
                                        new Array(padding).join(" ") +
                                        '= "' + keys[key] + '";');
            }
            defaultInitFile = defaultInitFile.replace('####REPLACE_WITH_SPECIAL_KEYS####',
                                                      specialKeySettings.join('\n'));

            // ================ write content ================ //
            try {
                this.modules.util.writeText(defaultInitFile,
                                            rcFilePlace + this.directoryDelimiter + configFileName);
            } catch (e) {
                this.modules.display.notify(this.modules.util
                                            .getLocaleString("failedToWriteText"));
                return false;
            }

            // ================ add misc setting ================ //
            var prefixArgumentKey = "extensions.keysnail.keyhandler.use_prefix_argument";
            if (params.out.selectedScheme == "emacs") {
                nsPreferences.setBoolPref(prefixArgumentKey, true);
            }

            break;
        }

        nsPreferences.setUnicharPref("extensions.keysnail.userscript.location", rcFilePlace);
        this.userPath = rcFilePlace;

        return true;
    },

    message: KeySnail.message
};
