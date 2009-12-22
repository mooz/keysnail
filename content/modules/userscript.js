/**
 * @fileOverview Codes related to init file and plugins
 * @name userscript.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.UserScript = {
    modules: null,

    /**
     * load js file and execute its content under *KeySnail.modules* scope
     * @param {string} aScriptPath
     */
    jsFileLoader: function (aScriptPath, aPreserve) {
        var code = this.modules.util.readTextFile(aScriptPath);
        if (this.parent.windowType === "navigator:browser" && aPreserve)
            this.preserveCode(code);
        Function("with (KeySnail.modules) {" + code + " }")();
    },

    // ==== user configuration file name ====
    // at first .keysnail.js is used. When the file not found,
    // then the _keysnail.js is used instead. (for the Windows user)
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

    get pluginDir() {
        return this.modules.util.getUnicharPref("extensions.keysnail.plugin.location");
    },

    set pluginDir(aPath) {
        this.modules.util.setUnicharPref("extensions.keysnail.plugin.location", aPath);
        this.addLoadPath(aPath);
    },

    get disabledPlugins() {
        return (this.modules.util.getUnicharPref("extensions.keysnail.plugin.disabled_plugins")
                || "").split(",");
    },

    // line number of the Function() constructor
    userScriptOffset: 19,

    // ==================== Loader ==================== //

    /**
     * load initialization file (wrap jsFileLoader)
     * @param {string} aInitFilePath
     * @throws {string} error message
     */
    initFileLoader: function (aInitFilePath) {
        var savedStatus = this.modules.key.inExternalFile;
        this.modules.key.inExternalFile = false;
        try
        {
            var start = new Date();
            this.jsFileLoader(aInitFilePath, true);
            var end = new Date();
        }
        catch (e)
        {
            if (!e.fileName || e.fileName == "chrome://keysnail/content/modules/userscript.js")
            {
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
        if (aURI.indexOf("://") == -1)
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

        if (!this.userPath)
        {
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
            try {
                return decodeURIComponent(escape(aStr));
            } catch (x) {
                return aStr;
            }
        };

        /**
         * simple function works like getLocaleString()
         * which can be used from plugin, userscript and init file.
         * Usage:
         * M({ja: "こんにちは",
         *    en: "Hello"})
         */
        this.modules.M = function (aMultiLang) {
            var msg = aMultiLang[this.modules.util.userLocale];

            if (msg === undefined)
            {
                msg = aMultiLang["en"];

                if (msg === undefined)
                {
                    for (var lang in aMultiLang)
                    {
                        msg = aMultiLang[lang];
                        break;
                    }
                }
            }

            return this.modules.L(msg);
        };

        // Arrange plugin scope, option holder, and lib area
        this.modules.plugins         = {};
        this.modules.plugins.context = {};
        this.modules.plugins.options = {};
        this.modules.plugins.lib     = {};

        if (this.pluginDir)
            this.addLoadPath(this.pluginDir);

        this.load();
    },

    linkMembers: function (aFrom, aTo, aMembers) {
        for (var i = 0; i < aMembers.length; ++i)
        {
            aTo[aMembers[i]] = aFrom[aMembers[i]];
        }
    },

    /**
     * load init file
     */
    load: function () {
        var loadStatus = -1;

        // before load init file, load special plugins
        this.loadSpecialPlugins();

        loadStatus = this.loadUserScript(this.initFileLoader,
                                         this.userPath,
                                         this.defaultInitFileNames);

        if (loadStatus == -1)
        {
            // file not found.
            // we need to create the new one
            // or let user to select the init file place
            if (this.parent.windowType == "navigator:browser")
            {
                loadStatus = this.beginRcFileWizard();
            }
        }

        if (loadStatus == 0)
        {
            this.initFileLoaded = true;

            if (this.parent.windowType == "navigator:browser" ||
                this.modules.util.getBoolPref("extensions.keysnail.plugin.global_enabled", false))
            {
                this.loadPlugins();
                this.modules.hook.callHook("PluginLoaded");
            }
        }
        else
        {
            // failed. disable the keysnail.
            this.initFileLoaded = false;

            this.modules.key.stop();
            this.modules.key.updateMenu();
            this.modules.key.updateStatusBar();
        }

        return this.initFileLoaded;
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
        return this.load();
    },

    /**
     * load user script (js file)
     * @param {Function(String)} aLoader
     * @param {String} aBaseDir base directory of the js file (e.g. "/home/hoge")
     * @param {[String]} aUserScriptNames script names to load
     * @return {int} status
     *  0: success
     * -1: file not found
     * -2: error occurred in the js file
     */
    loadUserScript: function (aLoader, aBaseDir, aUserScriptNames) {
        var prefix = aBaseDir + this.directoryDelimiter;
        var filePath;

        for (var i = 0; i < aUserScriptNames.length; ++i)
        {
            filePath = prefix + aUserScriptNames[i];

            if (!this.modules.util.openFile(filePath).exists())
            {
                // not exist. skip
                continue;
            }

            try
            {
                aLoader.call(this, filePath);
                // success
                return 0;
            }
            catch (e)
            {
                // userscript error
                var msgstr = this.modules.util
                    .getLocaleString("userScriptError", [e.fileName || "Unknown", e.lineNumber || "Unknown"]);
                msgstr += " :: " + e.message;

                var buttons;
                if ((e.fileName || "").indexOf("chrome://") == -1)
                {
                    let self = this;
                    buttons = [{
                                   label     : this.modules.util.getLocaleString("openErrorOccurredPlace"),
                                   callback  : function (aNotification) {
                                       self.editFile(e.fileName, e.lineNumber);
                                       aNotification.close();
                                   },
                                   accessKey : "o"
                               }];
                }
                this.modules.display.notify(msgstr, buttons);
                return -2;
            }
        }

        // file not found
        return -1;
    },

    // ============================== Plugin ============================== //

    setDefaultPluginDirectory: function () {
        var pluginDir  = this.modules.util.getExtentionLocalDirectory("plugins");
        this.pluginDir = pluginDir.path;
    },

    setPluginPathViaDialog: function (aForce) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

        fp.init(window,
                this.modules.util.getLocaleString("selectPluginDirectory"),
                nsIFilePicker.modeGetFolder);

        var response;
        // TODO: Is it really good to force user to select the directory?
        while (response !== nsIFilePicker.returnOK)
        {
            response = fp.show();

            if (!aForce)
                break;
        }

        this.pluginDir = fp.file.path;
    },

    getPluginInformation: function (aText) {
        let m = /\bPLUGIN_INFO[ \t\r\n]*=[ \t\r\n]*(<KeySnailPlugin(?:[ \t\r\n][^>]*)?>([\s\S]+?)<\/KeySnailPlugin[ \t\r\n]*>)/(aText);

        return m ? new XML(m[1]) : null;
    },

    getPluginInformationFromPath: function (aPath) {
        var read = this.modules.util.readTextFile(aPath);
        if (!read)
            return null;

        return this.getPluginInformation(read);
    },

    /**
     * Install file to the plugin directory
     * file can be
     * - KeySnail plugin
     * - Library
     * - Images
     * @param {nsIFile} aFile file which will be installed
     * @throws {string} error message when keysnail failed to install <aFile>
     * @returns {nsIFile} newly instaled file
     */
    installFile: function (aFile) {
        if (!this.pluginDir)
        {
            this.setDefaultPluginDirectory();
        }

        with (this.modules)
        {
            try
            {
                var destinationDir  = util.openFile(this.pluginDir);
                var destinationFile = util.openFile(this.pluginDir);
                destinationFile.append(aFile.leafName);

                if (destinationFile.exists() &&
                    !util.confirm(util.getLocaleString("overWriteConfirmationTitle"),
                                  util.getLocaleString("overWriteConfirmation", [destinationFile.path])))
                {
                    // canceled
                    throw util.getLocaleString("canceledByUser");
                }

                aFile.moveTo(destinationDir, "");

                return destinationFile;
            }
            catch (x)
            {
                throw util.getLocaleString("failedToInstallFile", [aFile.leafName]) + " :: " + x;
            }
        }
    },

    uninstallPlugin: function (aFile) {
        aFile.remove(false);
    },

    installRequiredFiles: function (aXml) {
        if (!aXml || !aXml.require.length())
            return;

        var scripts = aXml.require.script;

        for each (var script in scripts)
        {
            var url = script.text();
            var xhr = this.modules.util.httpGet(url);

            if (xhr && xhr.responseText)
            {
                try
                {
                    var fileName     = this.modules.util.getLeafNameFromURL(url);
                    var tmpFile      = this.writeTextTmp(fileName, xhr.responseText);
                    var installed    = this.installFile(tmpFile);
                    this.message(installed.path + " installed");
                }
                catch (x)
                {
                    this.modules.display.notify("Error occurred while installing the required file :: " + x);
                }
            }
            else
            {
                this.message(url + " skipped");
            }
        }
    },

    /**
     * Compare two version like 0.4.23 and 0.4.27
     * In this case, this function returns -1,
     * which means the second argument 0.4.27 is newer than the first one 0.4.23.
     * asterisk can be used which matches any part of dotted number
     * @param {string} aVersionA
     * @param {string} aVersionB
     * @returns {integer} 0, 1, -1
     *  0: when two version are considered as same
     *  1: <aVersionA> is newer than <aVersionB>
     * -1: <aVersionA> is older than <aVersionB>
     */
    compareVersion: function (aVersionA, aVersionB) {
        var a = aVersionA.split(".");
        var b = aVersionB.split(".");
        var cmpLen = Math.min(a.length, b.length);

        for (var i = 0; i < cmpLen; ++i)
        {
            if (a[i] == "*" || b[i] == "*")
                continue;

            var numA = parseInt(a[i]);
            var numB = parseInt(b[i]);

            if (numA == numB)
                continue;

            if (numA > numB)
                return 1;
            else
                return -1;
        }

        return a.length - b.length;
    },

    /**
     * Write text to the tmp directory with the given filename
     * @param {string} aFileName
     * @param {string} aText
     * @returns {nsIFile} created tmp file
     */
    writeTextTmp: function (aFileName, aText) {
        var tmpFile  = this.modules.util.getSpecialDir("TmpD");
        tmpFile.append(aFileName);

        this.modules.util.writeTextFile(this.modules.util.convertCharCodeFrom(aText, "UTF-8"),
                                        tmpFile.path, true);

        return tmpFile;
    },

    /**
     * Check for updates and ask for install it when newer version is found
     * @param {string} aPluginPath plugin's full path (plugin.context[aPluginPath])
     * @returns {boolean} true when plugin is updated. false when updates not found.
     * @throws {string} error message when keysnail failed to update the plugin
     */
    updatePlugin: function (aPluginPath) {
        var localContent, localInfo;
        var remoteContent, remoteInfo;

        with (this.modules)
        {
            // local file
            localContent = util.readTextFile(aPluginPath);
            localInfo    = this.getPluginInformation(localContent);

            var updateURL = util.xmlGetLocaleString(localInfo.updateURL);

            if (!updateURL)
            {
                throw "This plugin does not have a update url";
            }

            // http
            var xhr       = util.httpGet(updateURL);
            remoteContent = xhr.responseText;

            if (!remoteContent)
            {
                throw "Failed to get update info";
            }

            remoteInfo = this.getPluginInformation(remoteContent);

            if (!remoteInfo)
            {
                // not a valid keysnail plugin
                throw "Failed to get update info";
            }

            var localVersion = util.xmlGetLocaleString(localInfo.version);
            var remoteVersion = util.xmlGetLocaleString(remoteInfo.version);

            if (!localVersion || !remoteVersion)
            {
                throw "Plugin does not have an verison information";
            }

            if (this.compareVersion(localVersion, remoteVersion) >= 0)
            {
                // local one is equal or newer than remote one
                display.echoStatusBar(util.getLocaleString("updateNotFound",
                                                           [util.xmlGetLocaleString(remoteInfo.name)]), 2000);
                return false;
            }

            if (!this.checkCompatibility(remoteInfo) &&
                !util.confirm(util.getLocaleString("installingNotCompatiblePlugin"),
                              util.getLocaleString("installingNotCompatiblePluginPrompt",
                                                   [util.xmlGetLocaleString(remoteInfo.name),
                                                    remoteVersion,
                                                    KeySnail.version])))
            {
                // The file to be installed is not compatible with the current KeySnail
                return false;
            }

            /**
             * TODO: It's better to display the diff file of local and remote ones.
             * Are there good diff implementation on JavaScript?
             */
            if (util.confirm(util.getLocaleString("updateFoundTitle"),
                             util.getLocaleString("updateFoundMessage",
                                                  [util.xmlGetLocaleString(remoteInfo.name), remoteVersion])))
            {
                util.writeTextFile(util.convertCharCodeFrom(remoteContent, "UTF-8"), aPluginPath, true);
                this.installRequiredFiles(remoteInfo);
                var installed = util.openFile(aPluginPath);
                if (!this.isDisabledPlugin(aPluginPath))
                    this.loadPlugin(installed);
                display.notify(util.getLocaleString("pluginUpdated",
                                                    [util.xmlGetLocaleString(remoteInfo.name), remoteVersion]));

                return true;
            }
        }
    },

    /**
     * Inspired from pluginManager.js
     * http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/pluginManager.js
     * Install plugin from URL
     * @param {string} aURL plugin's url which can be http:// and file://
     * @throws
     */
    installPluginFromURL: function (aURL) {
        var source;
        var isLocalFile = (aURL.indexOf("file://") == 0);

        with (this.modules)
        {
            if (isLocalFile)
            {
                // local file
                try {
                    source = util.readTextFile(util.urlToPath(aURL));
                } catch (x) {
                    throw "Failed to read plugin from '" + aURL + "'";
                }
            }
            else
            {
                // http
                var xhr     = util.httpGet(aURL);
                var headers = {};
                source  = xhr.responseText;

                if (!source)
                {
                    throw "Failed to get plugin from '" + aURL + "'";
                }

                try
                {
                    xhr.getAllResponseHeaders()
                        .split(/\r?\n/).forEach(
                            function (h) {
                                var pair = h.split(': ');
                                if (pair && pair.length > 1)
                                {
                                    headers[pair.shift()] = pair.join('');
                                }
                            });
                }
                catch (e)
                {
                    this.message(e);
                }
            }

            var arg = {
                xml: this.getPluginInformation(source),
                pluginURL: aURL,
                type: null
            };

            if (!arg.xml)
            {
                // not a valid keysnail plugin
                display.notify(util.getLocaleString("invalidPlugin"));
                return;
            }

            window.openDialog("chrome://keysnail/content/installplugindialog.xul",
                              "keysnail:installPlugin",
                              "chrome,titlebar,modal,dialog,centerscreen,resizable,scrollbars",
                              arg);

            // canceled?
            if (!arg.type)
                return;

            var fileName   = util.getLeafNameFromURL(aURL);
            var pluginFile = this.writeTextTmp(fileName, source);

            if (arg.type == "install")
            {
                // install
                if (!this.checkCompatibility(arg.xml))
                {
                    // Not compatible with the current keysnail
                    this.modules.key.viewURI("http://wiki.github.com/mooz/keysnail");

                    if (!util.confirm(util.getLocaleString("installingNotCompatiblePlugin"),
                                      util.getLocaleString("installingNotCompatiblePluginPrompt",
                                                           [util.xmlGetLocaleString(arg.xml.name),
                                                            arg.xml.version,
                                                            KeySnail.version])))
                        {
                            // user canceled
                            return;
                        }
                }

                try
                {
                    var installed = this.installFile(pluginFile);
                    // install required files
                    this.installRequiredFiles(arg.xml);
                    // successfully finished
                    this.loadPlugin(installed);
                    this.newlyInstalledPlugin = installed.path;
                    if (!isLocalFile)
                    {
                        this.openPluginManager();
                    }
                }
                catch (x)
                {
                    display.notify(x, 2000);
                }
            }
            else if (arg.type == "viewsource")
            {
                gBrowser.loadOneTab(util.pathToURL(pluginFile.path), null, null, null, false);
            }
        }
    },

    openPluginManager: function () {
        var pluginManagerURL = "chrome://keysnail/content/pluginmanager.xul";

        var tabs = gBrowser.mTabContainer.childNodes;
        for (var i = 0; i < tabs.length; ++i)
        {
            if (tabs[i].linkedBrowser.currentURI.spec == pluginManagerURL)
            {
                gBrowser.mTabContainer.selectedIndex = i;

                tabs[i].linkedBrowser.reload();

                return;
            }
        }

        gBrowser.loadOneTab(pluginManagerURL, null, null, null, false);
    },

    isDisabledPlugin: function (aPath) {
        return this.disabledPlugins.some(function (aDisabled) aPath === aDisabled);
    },

    checkCompatibility: function (aXml) {
        if (!aXml)
            return false;

        var min = aXml.minVersion;
        var max = aXml.maxVersion;

        if ((min && this.compareVersion(KeySnail.version, min) < 0) ||
            (max && this.compareVersion(KeySnail.version, max) > 0))
        {
            return false;
        }

        return true;
    },

    checkDocumentURI: function (aXml) {
        var documentURI = document.documentURI;
        var includeURI  = aXml.include;
        var excludeURI  = aXml.exclude;

        var entry, uri;
        var replacePair = {
            main: "chrome://browser/content/browser.xul"
        };

        for each (entry in includeURI)
        {
            uri = replacePair[entry] || entry;

            if (uri != documentURI)
                return false;
        }

        for each (entry in excludeURI)
        {
            uri = replacePair[entry] || entry;

            if (uri == documentURI)
                return false;
        }

        return true;
    },

    loadPlugin: function (aFile) {
        var filePath = aFile.path;
        var context;

        // create context
        this.modules.plugins.context[filePath] = {__proto__ : KeySnail.modules};
        context = this.modules.plugins.context[filePath];
        context.__ksFileName__ = aFile.leafName;

        if (this.isDisabledPlugin(aFile.path))
        {
            context.__ksLoaded__ = false;
            return;
        }

        var xml = this.getPluginInformationFromPath(aFile.path);

        if (!this.checkCompatibility(xml))
        {
            context.__ksLoaded__        = false;
            context.__ksNotCompatible__ = true;
            // this.message("keysnail :: plugin " + aFile.leafName + " is not compatible with KeySnail " + KeySnail.version);
            return;
        }
        context.__ksNotCompatible__ = false;

        if (!this.checkDocumentURI(xml))
        {
            // this.message("keysnail :: plugin " + aFile.leafName + " will not be loaded on this URI ... skip");
            context.__ksLoaded__ = false;
            return;
        }

        // add self reference
        context.__ksSelf__   = context;

        this.modules.key.inExternalFile = true;

        try
        {
            this.loadSubScript(filePath, context);
            context.__ksLoaded__ = true;
        }
        catch (e)
        {
            context.__ksLoaded__ = false;
            // delete KeySnail.modules.plugins.context[filePath];
            var msgstr = this.modules.util
                .getLocaleString("userScriptError", [e.fileName || "Unknown", e.lineNumber || "Unknown"]);
            this.message(msgstr + e + " (in " + filePath + ")");
        }

        this.modules.key.inExternalFile = false;
    },

    /**
     * Load plugins which file name is beggining with _
     */
    loadSpecialPlugins: function () {
        var aPath = this.pluginDir;

        if (!aPath)
            return;

        var files = this.modules.util.readDirectory(aPath, true);

        files.forEach(
            function (aFile) {
                // special plugins filename must be like "_special_plugin_name.ks.js"
                if (!aFile.leafName.match("^_.+\\.ks\\.js$") || aFile.isDirectory())
                    return;

                try {
                    this.loadPlugin(aFile);
                } catch (x) {}
            }, this);
    },

    /**
     * Load all plugins in the plugin directory
     */
    loadPlugins: function () {
        var aPath = this.pluginDir;

        if (!aPath)
            return;

        // load plugins in sorted order
        var files = this.modules.util.readDirectory(aPath, true);

        files.forEach(
            function (aFile) {
                // plugins's filename must be like "plugin_name.ks.js"
                if (aFile.leafName.match("^_.+\\.ks\\.js$") || !aFile.leafName.match("\\.ks\\.js$") || aFile.isDirectory())
                    return;

                try {
                    this.loadPlugin(aFile);
                } catch (x) {}
            }, this);
    },

    /**
     * load script specified by <aFileName> in the load path
     * scripts are executed under the given context
     * when no context is given, the KeySnail.modules scope will be used
     * @param {string} aFileName file name of the script which will be loaded
     * @param {object} aContext context scripts will be evaluated under
     */
    require: function (aFileName, aContext) {
        var file, filePath;
        var loaded = false;

        aContext = aContext || this.modules;

        this.modules.key.inExternalFile = true;
        for (var i = 0; i < this.loadPath.length; ++i)
        {
            filePath = this.loadPath[i] + this.directoryDelimiter + aFileName;
            file = this.modules.util.openFile(filePath);

            if (!file.exists())
                continue;

            try
            {
                this.loadSubScript(filePath, aContext);
                loaded = true;
                break;
            }
            catch (e)
            {
                var msgstr = this.modules.util
                    .getLocaleString("userScriptError", [e.fileName || "Unknown", e.lineNumber || "Unknown"]);
                this.modules.display.notify(msgstr + "\n" + e);
            }
        }
        this.modules.key.inExternalFile = false;

        return loaded;
    },

    /**
     * add load path.
     * ~ at the head of path will be expanded to $HOME or $USERPROFILE
     * @param {String} aPath
     */
    addLoadPath: function (aPath) {
        // sh-like expansion
        aPath = aPath.replace(/^~/, this.prefDirectory);

        if (aPath[aPath.length - 1] == this.directoryDelimiter)
        {
            aPath = aPath.substr(0, aPath.length - 1);
        }

        // avoid duplication / not existing directory
        if (!this.loadPath.some(function (aContainedPath) { return aContainedPath == aPath; } )
            && this.modules.util.openFile(aPath).exists())
        {
            this.loadPath.push(aPath);
        }
    },

    // ==================== edit ==================== //

    syncEditorWithGM: function () {
        var gmEditor = this.modules.util.getUnicharPref("greasemonkey.editor");
        if (gmEditor)
        {
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

        if (typeof aLineNum === 'number')
            args.push("+" + aLineNum.toString());

        if (!aFilePath)
        {
            this.modules.display.notify(this.modules.util
                                        .getLocaleString("invalidFilePath"));
            return;
        }

        var editorPath = this.modules.util
            .getUnicharPref("extensions.keysnail.userscript.editor");

        if (!editorPath &&
            !(editorPath = this.syncEditorWithGM()))
        {
            this.modules.display.notify(this.modules.util
                                        .getLocaleString("noEditorSelected"));
            return;
        }

        var editorFile;
        var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
            .getService(Components.interfaces.nsIXULRuntime);
        if ("Darwin" == xulRuntime.OS)
        {
            // wrap with open command (borrowed idea from GreaseMonkey)

            args.unshift(editorPath);
            args.unshift("-a");

            editorFile = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
            editorFile.followLinks = true;
            editorFile.initWithPath("/usr/bin/open");
        }
        else
        {
            try
            {
                editorFile = this.modules.util.openFile(editorPath);
            }
            catch (e)
            {
                this.modules.display.notify(this.modules.util
                                            .getLocaleString("editorErrorOccurred"));
                return;
            }

            if (!editorFile.exists())
            {
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

        if (beginPos != -1 && endPos != -1)
        {
            beginPos += this.preserve.beginSign.length + 1;
            endPos--;
            this.preserve.code = aCode.slice(beginPos, endPos);
        }
        else
        {
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

        if (osName.search(/windows/i) != -1)
        {
            pref = this.modules.util.getEnv("USERPROFILE");
            delimiter = "\\";
        }
        else
        {
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

        if (this.openRcFileWizard())
        {
            loadStatus = this.loadUserScript(this.initFileLoader, this.userPath, this.defaultInitFileNames);
        }

        if (loadStatus == 0)
        {
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
    openRcFileWizard: function () {
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

        window.openDialog("chrome://keysnail/content/rcwizard.xul",
                          "keysnail:initFileWizard",
                          "chrome=yes,titlebar=yes,dialog=yes,modal=yes,resizable=yes,scrollbars=yes," + myCenterScreen(650, 600),
                          params);

        if (!params.out)
            return false;

        var rcFilePlace = params.out.rcFilePath;

        if (params.out.selectedMethod === "create-rcfile")
        {
            if (!params.out.scheme)
                return false;

            var scheme = params.out.scheme;

            var code = this.createInitFileFromScheme(scheme);
            var configFileName = this.defaultInitFileNames[params.out.configFileNameIndex];

            try
            {
                this.modules.util.writeTextFile(code, rcFilePlace + this.directoryDelimiter + configFileName);
            }
            catch (e)
            {
                this.modules.display.notify(this.modules.util.getLocaleString("failedToWriteText"));
                return false;
            }

            // Apply preference settings {{ ============================================= //

            if (scheme && typeof scheme.prefs === "object")
            {
                var prefBase = "extensions.keysnail.";
                var prefs = {};

                for (var prefLeaf in scheme.prefs)
                {
                    prefs[prefBase + prefLeaf] = scheme.prefs[prefLeaf];
                }

                this.modules.util.setPrefs(prefs);
            }

            // }} ======================================================================= //
        }

        this.modules.util.setUnicharPref("extensions.keysnail.userscript.location", rcFilePlace);
        this.userPath = rcFilePlace;

        return true;
    },

    createInitFileFromScheme: function (aScheme) {
        var contentHolder = [this.modules.util.createSeparator("KeySnail Init File")];

        // Preserved code {{ ======================================================== //

        contentHolder.push("");
        contentHolder.push("// " + this.modules.util.getLocaleString("preserveDescription1"));
        contentHolder.push("// " + this.modules.util.getLocaleString("preserveDescription2"));

        contentHolder.push(this.modules.util.createSeparator());
        contentHolder.push(this.preserve.beginSign);
        if (aScheme.preserved)
            contentHolder.push(aScheme.preserved);
        else
            contentHolder.push("// " + this.modules.util.getLocaleString("putYourCodesHere"));
        contentHolder.push(this.preserve.endSign);
        contentHolder.push(this.modules.util.createSeparator());

        // }} ======================================================================= //

        // Special keys {{ ========================================================== //

        contentHolder.push("");
        contentHolder.push(this.modules.util.createSeparator("Special key settings"));
        contentHolder.push("");
        this.generateSpecialKeySettingsFromScheme(aScheme, contentHolder);
        contentHolder.push("");

        // }} ======================================================================= //

        // Hooks {{ ================================================================= //

        contentHolder.push(this.modules.util.createSeparator("Hooks"));
        this.generateHookSettingsFromScheme(aScheme, contentHolder);
        contentHolder.push("");

        // }} ======================================================================= //

        // Key bindings {{ ========================================================== //

        contentHolder.push(this.modules.util.createSeparator("Key bindings"));
        contentHolder.push("");
        this.generateKeyBindingsFromScheme(aScheme, contentHolder);
        contentHolder.push("");

        // }} ======================================================================= //

        var output = this.modules.util.convertCharCodeFrom(contentHolder.join('\n'), "UTF-8");

        return output;
    },

    generateSpecialKeySettingsFromScheme: function (aScheme, aContentHolder) {
        var settings = aScheme.specialKeys || {};
        var keys = [
            'quit'              ,
            'help'              ,
            'escape'            ,
            'macroStart'        ,
            'macroEnd'          ,
            'suspend'           ,
            'universalArgument' ,
            'negativeArgument1' ,
            'negativeArgument2' ,
            'negativeArgument3'
        ];

        var maxLen = Math.max.apply(null, [str.length for each (str in keys)]);

        for each (var key in keys)
        {
            var setting = settings[key] || "undefined";
            var padding = Math.max(maxLen - key.length, 0) + 2;

            aContentHolder.push('key.' + key + new Array(padding).join(" ") + '= "' + setting + '";');
        }
    },

    generateHookSettingsFromScheme: function (aScheme, aContentHolder) {
        if (!aScheme.hooks || !aScheme.hooks.length)
        {
            return;
        }

        for each (var setting in aScheme.hooks)
        {
            [name, body] = setting;
            if (!name || !body)
                continue;

            aContentHolder.push("");

            aContentHolder.push("hook.addToHook(" + this.modules.util.toStringForm(name) + ", "
                                + body.toString() + ");");
        }
    },

    generateKeyBindingsFromScheme: function (aScheme, aContentHolder) {
        if (!aScheme.keybindings)
            return;

        var builtin = {};

        try
        {
            Components.utils.import("resource://keysnail-share/functions.js", builtin);
            builtin = builtin.ksBuiltin;
        }
        catch (x)
        {
            return;
        }

        var modes = {
            global : "Global",
            view   : "View",
            edit   : "Edit",
            caret  : "Caret"
        };

        var self = this;

        function getFunction(aCommand) {
            if (typeof aCommand === "string")
            {
                for each (var commands in builtin)
                {
                    if (commands[aCommand])
                        return commands[aCommand][0].toString();
                }
            }
            else
            {
                return aCommand[0].toString();
            }

            return null;
        }

        var bundleSvc    = Components.classes["@mozilla.org/intl/stringbundle;1"]
            .getService(Components.interfaces.nsIStringBundleService);
        const kBundleURI = "chrome://keysnail/locale/functions.properties";
        var stringBundle = bundleSvc.createBundle(kBundleURI);

        function getBuiltinDescription(aStringKey) {
            try
            {
                return stringBundle.GetStringFromName(aStringKey);
            }
            catch (x)
            {
                return aStringKey;
            }
        }

        function getDescription(aCommand) {
            if (typeof aCommand === "string")
                return getBuiltinDescription(aCommand);
            else
                return aCommand[1];
        }

        for (var mode in aScheme.keybindings)
        {
            if (!modes[mode])
                continue;

            var settings = aScheme.keybindings[mode];

            for each (var setting in settings)
            {
                if (!setting)
                    continue;

                [keys, command, ksNoRepeat] = setting;

                var keyStr = (typeof keys === "string") ?
                    this.modules.util.toStringForm(keys) :
                    keys.toSource().replace(/\\/g, "\\\\").replace(/'/g, "\\'");

                var func = getFunction(command);
                var desc = this.modules.util.toStringForm(getDescription(command));

                aContentHolder.push("key.set" + modes[mode] + "Key(" + keyStr +
                                    ", " + func + ", " + desc + ", " + !!ksNoRepeat + ");\n");
            }
        }
    },

    message: KeySnail.message
};
