KeySnail.UserScript = {
    modules: null,

    // ==== user configuration file name ====
    // at first .keysnail.js is used. When the file not found,
    // then the _keysnail.js is used. (for Windows user)
    defaultInitFileNames: [".keysnail.js", "_keysnail.js"],

    directoryDelimiter: null,

    // init file base
    prefDirectory: null,
    // if specified, use this path
    userPath: null,
    // pathes user script loaded from
    loadPath: [],

    // may access from other modules
    initFileLoaded: false,

    // line number of the Function() consctuctor
    userScriptOffset: 35,

    // ==================== Loader ==================== //

    /**
     * load js file and execute its content under *KeySnail.modules* scope
     * @param {String} aScriptPath
     * @throw exception
     */
    jsFileLoader: function (aScriptPath) {
        try {
            var code = this.modules.util
                .readTextFile(aScriptPath).value;
            new Function("with (KeySnail.modules) {" + code + " }")();            
        } catch (e) {
            if (e.fileName == "chrome://keysnail/content/userscript.js") {
                e.fileName = aScriptPath;
                e.lineNumber = e.lineNumber - this.userScriptOffset + 1;                
            }
            throw e;
        }
    },

    /**
     * load initialization file (wrap jsFileLoader)
     * @param {String} aInitFilePath
     * @throw exception
     */
    initFileLoader: function (aInitFilePath) {
        var start = new Date();
        this.jsFileLoader(aInitFilePath);
        var end = new Date();

        this.modules.display
            .echoStatusBar("KeySnail: [" + aInitFilePath + "]: " +
                           this.modules.util
                           .getLocaleString("initFileLoaded", [(end - start) / 1000]),
                           3000);
    },

    // ======================================== //

    init: function () {
        // Note: Do *NOT* call this method before the "key" module initialization.
        // Keymaps used in userscript are arranged in key.init().
        // In most case, this module have to be initialized
        // after all other modules initializations are done.

        [this.prefDirectory, this.directoryDelimiter]
            = this.getPrefDirectory();

        this.userPath = nsPreferences
            .getLocalizedUnicharPref("extensions.keysnail.userscript.location")
            || nsPreferences
            .copyUnicharPref("extensions.keysnail.userscript.location");

        if (!this.userPath) {
            this.userPath = this.prefDirectory;
            nsPreferences.setUnicharPref("extensions.keysnail.userscript.location", this.userPath);
        }

        this.load();
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
            loadStatus = this.beginRcFileWizard();
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
                this.message(filePath + " loaded");
                return 0;
            } catch (e) {
                // userscript error
                var msgstr = this.modules.util
                    .getLocaleString("userScriptError", [e.fileName, e.lineNumber]);
                msgstr += " [" + e.message + "]";
                this.modules.display.prettyPrint(msgstr);
                this.message(msgstr);
                return -2;
            }
        }

        // file not found
        return -1;
    },

    /**
     * load script specified by <aFileName> in the load path
     * scrips are executed under the KeySnail.modules scope
     * @param {String} aFileName
     */
    require: function (aFileName) {
        var baseDir;
        for (var i = 0; i < this.loadPath.length; ++i) {
            baseDir = this.loadPath[i];
            if (!baseDir)
                continue;

            // loadUserScript return -1 when file not found
            if (this.loadUserScript(this.jsFileLoader,
                                    baseDir, [aFileName]) != -1)
                break;
        }
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

        // avoid duplication
        if (!this.loadPath.some(function (aContained) aContained == aPath)) {
            this.loadPath.push(aPath);
        }
    },

    // ==================== util / wizard ==================== //

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

    beginRcFileWizard: function () {
        var loadStatus = -1;

        if (this.openDialog()) {
            loadStatus = this.loadUserScript(this.userPath,
                                             this.defaultInitFileNames);
        }

        return loadStatus;
    },

    openDialog: function () {
        var params = {
            inn: {
                util: this.modules.util,
                prefDirectory: this.prefDirectory,
                configFileNames: this.defaultInitFileNames,
                directoryDelimiter: this.directoryDelimiter
            },
            out: null
        };

        window.openDialog("chrome://keysnail/content/rcwizard.xul",
                          "KeySnail",
                          "chrome, dialog, modal, resizable=no, top=300,left=300",
                          params).focus();

        if (!params.out) {
            this.message("Not params out!");
            // so, what can we do?
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

            var defaultInitFileBase = "chrome://keysnail/content/resources/.keysnail.js.";

            // When I tried to get the userLocale via copyUnicharPref(), the function sometimes
            // returned the "property" file place, not the locale. So it's better to use
            // getLocalizedUnicharPref()
            // and getLocalizedUnicharPref() sometimes return null :<
            // so I have to check whether it is null or not.
            var userLocale = nsPreferences.getLocalizedUnicharPref("general.useragent.locale")
                || nsPreferences.copyUnicharPref("general.useragent.locale");

            userLocale = {
                "ja-JP": "ja",
                "ja_JP": "ja",
                "JP":    "ja",
                "en-US": "en"
            }[userLocale] || userLocale;

            var defaultInitFile = this.modules.util.getContents(defaultInitFileBase + userLocale);

            if (!defaultInitFile) {
                defaultInitFile = this.modules.util.getContents(defaultInitFileBase + "en");
            }

            if (!defaultInitFile) {
                this.message("rc file wizard: failed to open the default .keysnail file");
                return false;
            }

            try {
                this.modules.util.writeText(defaultInitFile,
                                            rcFilePlace + this.directoryDelimiter + configFileName);
            } catch (e) {
                this.message("openDialog: " + e);
                return false;
            }

            break;
        }

        nsPreferences.setUnicharPref("extensions.keysnail.userscript.location", rcFilePlace);
        this.userPath = rcFilePlace;

        return true;
    },

    message: KeySnail.message
};
