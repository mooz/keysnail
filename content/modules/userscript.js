/**
 * @fileOverview Codes related to init file and plugins
 * @name userscript.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var userscript = {
    // ==== user configuration file name ====
    // at first .keysnail.js is used. When the file not found,
    // then the _keysnail.js is used instead. (for the Windows user)
    defaultInitFileNames: [".keysnail.js", "_keysnail.js"],
    initFilePath: null,

    directoryDelimiter: null,

    // init file base
    prefDirectory: null,
    // if specified, use this path
    get userPath() {
        try {
            let procDir = util.getSpecialDir("CurProcD");
            if (util.isDirHasFiles(procDir.path, this.defaultInitFileNames))
                return procDir.path;
        } catch (_) {}

        let path = util.getUnicharPref("extensions.keysnail.userscript.location");

        if (!path) {
            path = this.prefDirectory;
            util.setUnicharPref("extensions.keysnail.userscript.location", path);
        }

        return path;
    },
    set userPath(path) {
        util.setUnicharPref("extensions.keysnail.userscript.location", path);
    },
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
        return util.getUnicharPref("extensions.keysnail.plugin.location");
    },

    set pluginDir(aPath) {
        util.setUnicharPref("extensions.keysnail.plugin.location", aPath);
        this.addLoadPath(aPath);
    },

    get disabledPlugins() {
        return (util.getUnicharPref("extensions.keysnail.plugin.disabled_plugins") || "").split(",");
    },

    set disabledPlugins(plugins) {
        util.setUnicharPref("extensions.keysnail.plugin.disabled_plugins", plugins.join(","));
    },

    // ==================== Loader ==================== //

    /**
     * load initialization file (wrap jsFileLoader)
     * @param {string} aInitFilePath
     * @throws {string} error message
     */
    initFileLoader: function (aInitFilePath) {
        key.withExternalFileStatus(false, function () {
            this.initFilePath = aInitFilePath;

            try {
                var start = Date.now();
                this.loadInitFileInternal(aInitFilePath, true);
                var end = Date.now();
                display.echoStatusBar("KeySnail :: [" + aInitFilePath + "] :: " +
                                      util.getLocaleString("initFileLoaded", [(end - start) / 1000]),
                                      3000);
            } catch (e) {
                e.fileName = aInitFilePath;
                throw e;
            }
        }, this);
    },

    /**
     * load js file and execute its content under *KeySnail.modules* scope
     * @param {string} aScriptPath
     */
    loadInitFileInternal: function (aScriptPath, aSavePreserveArea) {
        var code = util.readTextFile(aScriptPath);
        if (KeySnail.isMainWindow && aSavePreserveArea)
            this.preserveCode(code);
        util.evalInContext(code);
    },

    loadSubScript: function (aURI, aContext, aIgnoreCache) {
        if (aURI.indexOf("://") === -1)
            aURI = util.pathToURL(aURI);

        if (aIgnoreCache) {
            // add a parameter to avoid startup cache
            var uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"]
                    .getService(Components.interfaces.nsIUUIDGenerator);
            var uuid = uuidGenerator.generateUUID();
            var uuidString = uuid.toString();
            aURI = aURI + (aURI.indexOf("?") === -1 ? "?" : "&") + "x=" + uuidString;
        }
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

        share.pwd = this.prefDirectory;

        /**
         * In userscript.require'ed script, the multibyte character like Japanese
         * is not correctly processed.
         * So author of the plugin have to use this function like below.
         * L("日本語")
         */
        modules.L = function (aStr) {
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
        modules.M = function (aMultiLang) {
            var msg = aMultiLang[util.userLocale];

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

            return L(msg);
        };

        // Arrange modules.plugins

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

        let reallyLoadPlugin = KeySnail.isMainWindow ||
            util.getBoolPref("extensions.keysnail.plugin.global_enabled", false);

        // before load init file, load special plugins
        if (reallyLoadPlugin)
            this.loadSpecialPlugins();

        loadStatus = this.loadUserScript(this.initFileLoader,
                                         this.userPath,
                                         this.defaultInitFileNames);

        if (loadStatus == -1) {
            // file not found.
            // we need to create the new one
            // or let user to select the init file place
            if (KeySnail.isMainWindow)
                loadStatus = this.beginRcFileWizard();
        }

        if (loadStatus == 0) {
            this.initFileLoaded = true;

            if (reallyLoadPlugin) {
                this.loadPlugins();
                hook.callHook("PluginLoaded");
            }
        } else {
            // failed. disable the keysnail.
            this.initFileLoaded = false;

            key.stop();
            key.updateStatusDisplay();
        }

        return this.initFileLoaded;
    },

    /**
     * reload the init file
     */
    reload: function () {
        // clear current keymaps
        key.keyMapHolder = {};
        key.blackList    = [];
        hook.hookList    = {};

        key.init();
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

            if (!util.openFile(filePath).exists())
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
                var msgstr = util.getLocaleString("userScriptError",
                                                  [e.fileName || "Unknown", e.lineNumber || "Unknown"]);
                msgstr += " :: " + e.message;

                var buttons;
                if ((e.fileName || "").indexOf("chrome://") == -1)
                {
                    let self = this;
                    buttons = [{
                        label     : util.getLocaleString("oldSyntaxMigrationGuide"),
                        callback  : function (aNotification) {
                            openUILinkIn(util.getLocaleString("oldSyntaxMigrationGuideURL"), "tab");
                            aNotification.close();
                        },
                        accessKey : "m"
                    }, {
                        label     : util.getLocaleString("openErrorOccurredPlace"),
                        callback  : function (aNotification) {
                            self.editFile(e.fileName, e.lineNumber);
                            aNotification.close();
                        },
                        accessKey : "o"
                    }];
                }
                display.notify(msgstr, buttons);
                return -2;
            }
        }

        // file not found
        return -1;
    },

    // ============================== Plugin ============================== //

    setDefaultPluginDirectory: function () {
        var pluginDir  = util.getExtensionLocalDirectory("plugins");
        this.pluginDir = pluginDir.path;
    },

    setPluginPathViaDialog: function (aForce) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

        fp.init(window,
                util.getLocaleString("selectPluginDirectory"),
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

    pluginInfoXMLPattern: /\bPLUGIN_INFO[ \t\r\n]*=[ \t\r\n]*(<KeySnailPlugin(?:[ \t\r\n][^>]*)?>([\s\S]+?)<\/KeySnailPlugin[ \t\r\n]*>)/,
    getPluginInformation: function (aText) {
        let matched = this.pluginInfoXMLPattern.exec(aText);
        if (matched) {
            var { PluginInfo } = Components.utils.import("resource://keysnail-share/plugin-info.js", {});
            var xmlString = matched[1];
            var pluginInfo = new PluginInfo(xmlString, util.userLocale);
            return pluginInfo;
        }
        return null;
    },

    normalizePluginSourceCode: function (pluginSourceCode) {
        let normalizedSourceCode = pluginSourceCode.replace(
            this.pluginInfoXMLPattern,
            "__ksPlaceHolder__ = null;"
        );
        return {
            removedLineCount: 0, // TODO
            sourceCode: normalizedSourceCode
        };
    },

    /**
     * Install file to the plugin directory
     * file can be
     * - KeySnail plugin
     * - Library
     * - Images
     * @param {nsIFile} aFile file which will be installed
     * @throws {string} error message when keysnail failed to install <aFile>
     * @returns {nsIFile} newly installed file
     */
    installFile: function (aFile, force) {
        if (!this.pluginDir)
        {
            this.setDefaultPluginDirectory();
        }

        try
        {
            let destinationDir  = util.openFile(this.pluginDir);
            let destinationFile = util.openFile(this.pluginDir);

            destinationFile.append(aFile.leafName);

            if (destinationFile.exists())
            {
                if (util.hashFile(aFile) === util.hashFile(destinationFile))
                {
                    // no need to install this file
                    return destinationFile;
                }

                let confirmed = force ||
                    util.confirm(util.getLocaleString("overWriteConfirmationTitle"),
                                 util.getLocaleString("overWriteConfirmation", [destinationFile.path]));

                if (!confirmed)
                    throw util.getLocaleString("canceledByUser");
            }

            aFile.moveTo(destinationDir, "");

            return destinationFile;
        }
        catch (x)
        {
            throw util.getLocaleString("failedToInstallFile", [aFile.leafName]) + " :: " + x;
        }
    },

    /**
     * Install required files for plugin specified by <b>info</b>
     * @param {PluginInfo} info
     * @param {function} next
     */
    installRequiredFiles: function (pluginInfo, next) {
        function finish(succeeded) {
            return void (typeof next === "function" ? next(succeeded) : 0);
        }

        if (!pluginInfo)
            return finish(false);

        let scripts = pluginInfo.requiredScripts;

        (function installNext() {
            if (!scripts.length)
                return finish(true);

            let scriptURL = scripts.pop();

            util.httpGet(scriptURL, false, function (req) {
                if (req.status !== 200) {
                    util.message(req.responseText);
                    return finish(false);
                }

                try {
                    let name = util.getLeafNameFromURL(scriptURL);
                    let file = userscript.writeTextTmp(name, req.responseText);
                    let installed = userscript.installFile(file);
                    util.message(installed.path + " installed");
                } catch (x) {
                    util.message("An error occured while installing required scripts :: " + x.message);
                } finally {
                    installNext();
                }
            });
        })();
    },

    installPluginAndRequiredFiles: function (context) {
        let { code, name, next, pluginInfo } = context;
        if (!pluginInfo)
            pluginInfo = userscript.getPluginInformation(code);

        function doNext(status, installed) {
            if (typeof next === "function")
                next(status, installed);
        }

        if (!userscript.checkCompatibility(pluginInfo)) {
            // Not compatible with the current keysnail
            if (!context.force) {
                let forced = false;

                if (context.promptNotCompatible) {
                    forced = util.confirm(util.getLocaleString("installingNotCompatiblePlugin"),
                                          util.getLocaleString("installingNotCompatiblePluginPrompt", [
                                              pluginInfo.name,
                                              pluginInfo.version,
                                              KeySnail.version
                                          ]));
                }

                if (!forced)
                    return doNext(false);
            }
        }

        let file = userscript.writeTextTmp(name, code);
        let installed;
        try {
            installed = userscript.installFile(file, context.forceOverWrite);
        } catch (x) {
            return doNext(false);
        }

        userscript.installRequiredFiles(pluginInfo, function (succeeded) {
            if (!succeeded)
                return doNext(succeeded);

            try {
                if (!userscript.isDisabledPlugin(installed.path) && !context.suppressLoad) {
                    userscript.loadPlugin(installed, true /* ignore cache */);
                }
            } catch (x) {
                util.message("An error occured while updating plugin :: " + x.message);
            } finally {
                doNext(true, installed);
            }
        });
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
     *  1: <b>aVersionA</b> is newer than <b>aVersionB</b>
     * -1: <b>aVersionA</b> is older than <b>aVersionB</b>
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
        let tmpFile  = util.getSpecialDir("TmpD");
        tmpFile.append(aFileName);

        util.writeTextFile(util.convertCharCodeFrom(aText, "UTF-8"), tmpFile.path, true);

        return tmpFile;
    },

    doesPluginHasUpdate: function (pluginPath, next) {
        // local file
        let localCode = util.readTextFile(pluginPath);
        let localPluginInfo = userscript.getPluginInformation(localCode);

        let updateURL = localPluginInfo.updateURL;

        if (!updateURL)
            return void (typeof next === "function" ? next(false) : 0);

        util.httpGet(updateURL, false, function (req) {
            let { responseText : remoteCode } = req;
            let remotePluginInfo = userscript.getPluginInformation(remoteCode);

            let hasUpdate = false;

            if (req.status === 200) {
                if (remotePluginInfo) {
                    let localVersion  = localPluginInfo.version;
                    let remoteVersion = remotePluginInfo.version;

                    hasUpdate = localVersion && remoteVersion &&
                        (userscript.compareVersion(localVersion, remoteVersion) < 0);
                }
            }

            if (typeof next === "function")
                next(hasUpdate, { code : remoteCode, pluginInfo : remotePluginInfo });
        });
    },

    /**
     * Check for updates and ask for install it when newer version is found
     * @param {string} pluginPath plugin's full path (plugin.context[pluginPath])
     * @param {function} next callback. 1st argument for this function is the boolean
     * which indicates whether update is found or not.
     */
    updatePlugin: function (pluginPath, next) {
        userscript.doesPluginHasUpdate(pluginPath, function (hasUpdate, context) {
            function doNext(status) {
                if (typeof next === "function")
                    next(status);
            }

            if (!hasUpdate) {
                return doNext(false);
            }

            let { code, pluginInfo } = context;

            /**
             * TODO: It's better to display the diff file of local and remote ones.
             * Are there good diff implementation on JavaScript?
             */
            let name    = pluginInfo.name;
            let version = pluginInfo.version;

            let confirmed = util.confirm(
                util.getLocaleString("updateFoundTitle"),
                util.getLocaleString("updateFoundMessage", [name, version])
            );

            if (confirmed) {
                userscript.installPluginAndRequiredFiles({
                    name       : util.getLeafNameFromURL(util.pathToURL(pluginPath)),
                    code       : code,
                    pluginInfo : pluginInfo,
                    next       : doNext
                });
            } else {
                doNext(false);
            }
        });
    },

    installPluginsFromURLs: function (aURLs, onFinal) {
        var toInstallUrls = Array.slice(aURLs);

        (function installNext(installStatus) {
            if (!toInstallUrls.length) {
                if (typeof onFinal === "function")
                    onFinal(installStatus);
                return;
            }

            userscript.installPluginFromURL(toInstallUrls.shift(), function (installStatus) {
                installNext(installStatus);
            });
        })(true);
    },

    /**
     * Inspired from pluginManager.js
     * http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/pluginManager.js
     * Install plugin from URL
     * @param {string} aURL plugin's url which can be http:// and file://
     * @throws
     */
    installPluginFromURL: function (aURL, next) {
        let isLocalFile = aURL.indexOf("file://") === 0;

        function doNext(status) {
            if (typeof next === "function")
                next(status);
        }

        function displayPromptAndInstall(code) {
            let pluginInfo = userscript.getPluginInformation(code);

            let arg = {
                pluginInfo : pluginInfo,
                pluginURL  : aURL,
                type       : null
            };

            if (!pluginInfo) {
                // not a valid keysnail plugin
                display.notify(util.getLocaleString("invalidPlugin"));
                return doNext(false);
            }

            window.openDialog("chrome://keysnail/content/installplugindialog.xul",
                              "keysnail:installPlugin",
                              "chrome,titlebar,modal,dialog,centerscreen,resizable,scrollbars",
                              arg);

            switch (arg.type) {
            case "install":
                userscript.installPluginAndRequiredFiles({
                    name       : util.getLeafNameFromURL(aURL),
                    code       : code,
                    pluginInfo : pluginInfo,
                    next       : function (succeeded, installed) {
                        if (succeeded) {
                            userscript.newlyInstalledPlugin = installed.path;
                            userscript.openPluginManager();
                        }

                        doNext(succeeded);
                    }
                });
                break;
            case "viewsource":
                gBrowser.loadOneTab(aURL, null, null, null, false);
                doNext(false);
                break;
            default:
                doNext(false);
                break;
            }
        }

        if (isLocalFile) {
            try {
                displayPromptAndInstall(util.readTextFile(util.urlToPath(aURL)));
            } catch (x) {
                return doNext(false);
            }
        } else {
            display.echoStatusBar("Fetching a plugin ...");
            util.httpGet(aURL, false, function (req) {
                display.echoStatusBar("");
                if (req.status !== 200)
                    return doNext(false);

                displayPromptAndInstall(req.responseText);
            });
        }
    },

    openPluginManager: function (initiallySelectedPluginPath) {
        if (initiallySelectedPluginPath)
            userscript.initiallySelectedPluginPath = initiallySelectedPluginPath;

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

    checkCompatibility: function (aPluginInfo) {
        if (!aPluginInfo)
            return false;

        var min = aPluginInfo.minKeySnailVersion;
        var max = aPluginInfo.maxKeySnailVersion;

        if ((min && this.compareVersion(KeySnail.version, min) < 0) ||
            (max && this.compareVersion(KeySnail.version, max) > 0))
        {
            return false;
        }

        return true;
    },

    checkDocumentURI: function (aPluginInfo) {
        var documentURI = document.documentURI;
        var includeURIs  = aPluginInfo.includeDocumentURIs;
        var excludeURIs  = aPluginInfo.excludeDocumentURIs;

        var entry, uri;
        var replacePair = {
            main: "chrome://browser/content/browser.xul"
        };

        for (let entry of includeURIs)
        {
            uri = replacePair[entry] || entry;

            if (uri != documentURI)
                return false;
        }

        for (let entry of excludeURIs)
        {
            uri = replacePair[entry] || entry;

            if (uri == documentURI)
                return false;
        }

        return true;
    },

    loadPlugin: function (aFile, aIgnoreCache) {
        var filePath = aFile.path;
        var context;

        // create context
        context = plugins.context[filePath] = {__proto__ : KeySnail.modules};
        context.__ksFileName__ = aFile.leafName;

        if (this.isDisabledPlugin(aFile.path))
        {
            context.__ksLoaded__ = false;
            return;
        }

        var pluginText = util.readTextFile(aFile.path);

        // Arrange plugin info
        var pluginInfo = this.getPluginInformation(pluginText);
        context.__ksPluginInfo__ = pluginInfo;
        Object.defineProperty(context, "PLUGIN_INFO", {
            value: pluginInfo,
            enumerable: true
        });

        if (!this.checkCompatibility(pluginInfo))
        {
            context.__ksLoaded__        = false;
            context.__ksNotCompatible__ = true;
            // util.message("keysnail :: plugin " + aFile.leafName + " is not compatible with KeySnail " + KeySnail.version);
            return;
        }
        context.__ksNotCompatible__ = false;

        if (!this.checkDocumentURI(pluginInfo))
        {
            // util.message("keysnail :: plugin " + aFile.leafName + " will not be loaded on this URI ... skip");
            context.__ksLoaded__ = false;
            return;
        }

        // add self reference
        context.__ksSelf__ = context;

        let normalizationInfo = this.normalizePluginSourceCode(pluginText);

        key.withExternalFileStatus(true, function () {
            try
            {
                // TODO: this breaks line numbers in errors from plugins
                util.evalInContext(normalizationInfo.sourceCode, context);
                context.__ksLoaded__ = true;
            }
            catch (e)
            {
                context.__ksLoaded__ = false;

                let msgstr = util.getLocaleString("userScriptError", [
                    e.fileName || "Unknown", e.lineNumber || "Unknown"
                ]);

                util.message(msgstr + "\n" + e + " (in " + filePath + ")");
            }
        }, this);
    },

    enablePlugin: function (pluginFile) {
        var toEnablePluginPath = pluginFile.path;

        userscript.disabledPlugins = userscript.disabledPlugins.filter(function (disabledPluginPath) {
            return disabledPluginPath !== toEnablePluginPath;
        });

        if (!plugins.context[toEnablePluginPath].__ksLoaded__) {
            userscript.loadPlugin(pluginFile);
        }

        return plugins.context[toEnablePluginPath].__ksLoaded__;
    },

    disablePlugin: function (pluginFile) {
        var toDisablePluginPath = pluginFile.path;

        if (userscript.disabledPlugins.indexOf(toDisablePluginPath) < 0) {
            userscript.disabledPlugins = userscript.disabledPlugins.concat(toDisablePluginPath);
            // TODO: unload mechanism?
        }

        return true;
    },

    uninstallPlugin: function (pluginFile, noConfirm) {
        var toUninstallPluginPath = pluginFile.path;
        var pluginInfo = plugins.context[toUninstallPluginPath];

        var reallyDelete = noConfirm || util.confirm(util.getLocaleString("deletePluginTitle",
                                                                          [pluginInfo.name]),
                                                     util.getLocaleString("deletePluginMessage",
                                                                          [pluginInfo.name || toUninstallPluginPath]));
        if (reallyDelete) {
            if (pluginFile && pluginFile.exists()) {
                pluginFile.remove(true);
                delete plugins.context[toUninstallPluginPath];
                return true;
            }
        }

        return false;
    },

    /**
     * Load plugins which file name is beginning with _ (underscore)
     */
    loadSpecialPlugins: function () {
        var aPath = this.pluginDir;

        if (!aPath)
            return;

        try
        {
            var files = util.readDirectory(aPath, true);
        }
        catch (x)
        {
            util.message(x);
            return;
        }

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
    loadPlugins: function (aIgnoreCache) {
        var aPath = this.pluginDir;

        if (!aPath)
            return;

        // load plugins in sorted order
        try
        {
            var files = util.readDirectory(aPath, true);
        }
        catch (x)
        {
            util.message(x);
            return;
        }

        files.forEach(
            function (aFile) {
                // plugins's filename must be like "plugin_name.ks.js"
                if (aFile.leafName.match("^_.+\\.ks\\.js$") || !aFile.leafName.match("\\.ks\\.js$") || aFile.isDirectory())
                    return;

                try {
                    this.loadPlugin(aFile, aIgnoreCache);
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
    require: function (aFileName, aContext, aIgnoreCache) {
        var file, filePath;
        var loaded = false;

        aContext = aContext || modules;

        key.withExternalFileStatus(true, function () {
            for (var i = 0; i < this.loadPath.length; ++i)
            {
                filePath = this.loadPath[i] + this.directoryDelimiter + aFileName;
                file = util.openFile(filePath);

                if (!file.exists())
                    continue;

                try
                {
                    this.loadSubScript(filePath, aContext, aIgnoreCache);
                    loaded = true;
                    break;
                }
                catch (e)
                {
                    var msgstr = util.getLocaleString("userScriptError", [
                        e.fileName || "Unknown", e.lineNumber || "Unknown"
                    ]);
                    display.notify(msgstr + "\n" + e);
                }
            }
        }, this);

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
            && util.openFile(aPath).exists())
        {
            this.loadPath.push(aPath);
        }
    },

    // ==================== edit ==================== //

    syncEditorWithGM: function () {
        var gmEditor = util.getUnicharPref("greasemonkey.editor");
        if (gmEditor)
        {
            util.setUnicharPref("extensions.keysnail.userscript.editor", gmEditor);
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
            display.notify(util.getLocaleString("invalidFilePath"));
            return;
        }

        var editorPath = util.getUnicharPref("extensions.keysnail.userscript.editor");

        if (!editorPath &&
            !(editorPath = this.syncEditorWithGM()))
        {
            display.notify(util.getLocaleString("noEditorSelected"));
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
                editorFile = util.openFile(editorPath);
            }
            catch (e)
            {
                display.notify(util.getLocaleString("editorErrorOccurred"));
                return;
            }

            if (!editorFile.exists())
            {
                display.notify(util.getLocaleString("editorNotFound", [editorFile.path]));
                return;
            }
        }

        util.launchProcess(editorFile, args);
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
        var osName = util.getSystemInfo()
            .getProperty("name");

        if (osName.search(/windows/i) != -1)
        {
            pref = util.getEnv("USERPROFILE");
            delimiter = "\\";
        }
        else
        {
            pref = util.getEnv("HOME");
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
            key.run();
            key.updateStatusDisplay();
        }

        return loadStatus;
    },

    /**
     * @returns {boolean}
     */
    openRcFileWizard: function () {
        var params = {
            inn: {
                modules: modules
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
                util.writeTextFile(code, rcFilePlace + this.directoryDelimiter + configFileName);
            }
            catch (e)
            {
                display.notify(util.getLocaleString("failedToWriteText"));
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

                util.setPrefs(prefs);
            }

            // }} ======================================================================= //
        }

        this.userPath = rcFilePlace;

        return true;
    },

    createInitFileFromScheme: function (aScheme) {
        var contentHolder = [util.createSeparator("KeySnail Init File")];

        // Preserved code {{ ======================================================== //

        contentHolder.push("");
        contentHolder.push("// " + util.getLocaleString("preserveDescription1"));
        contentHolder.push("// " + util.getLocaleString("preserveDescription2"));

        contentHolder.push(util.createSeparator());
        contentHolder.push(this.preserve.beginSign);
        if (aScheme.preserved)
            contentHolder.push(aScheme.preserved);
        else
            contentHolder.push("// " + util.getLocaleString("putYourCodesHere"));
        contentHolder.push(this.preserve.endSign);
        contentHolder.push(util.createSeparator());

        // }} ======================================================================= //

        // Special keys {{ ========================================================== //

        contentHolder.push("");
        contentHolder.push(util.createSeparator("Special key settings"));
        contentHolder.push("");
        this.generateSpecialKeySettingsFromScheme(aScheme, contentHolder);
        contentHolder.push("");

        // }} ======================================================================= //

        // Hooks {{ ================================================================= //

        contentHolder.push(util.createSeparator("Hooks"));
        this.generateHookSettingsFromScheme(aScheme, contentHolder);
        contentHolder.push("");

        // }} ======================================================================= //

        // Key bindings {{ ========================================================== //

        contentHolder.push(util.createSeparator("Key bindings"));
        contentHolder.push("");
        this.generateKeyBindingsFromScheme(aScheme, contentHolder);
        contentHolder.push("");

        // }} ======================================================================= //

        var output = util.convertCharCodeFrom(contentHolder.join('\n'), "UTF-8");

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

        var maxLen = Math.max.apply(null, [for (str of keys) str.length]);

        for (let key of keys)
        {
            var setting = settings[key] || "undefined";
            var padding = Math.max(maxLen - key.length, 0) + 2;

            aContentHolder.push('key.' + key + 'Key' + new Array(padding).join(" ") + '= "' + setting + '";');
        }
    },

    generateHookSettingsFromScheme: function (aScheme, aContentHolder) {
        if (!aScheme.hooks || !aScheme.hooks.length)
        {
            return;
        }

        for (let setting of aScheme.hooks)
        {
            let [name, body] = setting;
            if (!name || !body)
                continue;

            aContentHolder.push("");

            aContentHolder.push("hook.addToHook(" + util.toStringForm(name) + ", "
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
                for (let commands of util.values(builtin))
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

            for (let setting of settings)
            {
                if (!setting)
                    continue;

                let [keys, command, ksNoRepeat] = setting;

                var keyStr = (typeof keys === "string") ?
                    util.toStringForm(keys) :
                    keys.toSource().replace(/\\/g, "\\\\").replace(/'/g, "\\'");

                var func = getFunction(command);
                var desc = util.toStringForm(getDescription(command));

                aContentHolder.push("key.set" + modes[mode] + "Key(" + keyStr +
                                    ", " + func + ", " + desc + ", " + !!ksNoRepeat + ");\n");
            }
        }
    }
};
