KeySnail.UserScript = {
    modules: null,

    // ==== user configuration file name ====
    // at first .keysnail.js is used. When the file not found,
    // then the _keysnail.js is used. (for Windows user)
    defaultConfigFileNames: [".keysnail.js", "_keysnail.js"],

    directoryDelimiter: null,
    prefDirectory: null,
    // if specified, use this path
    userPath: null,

    // may access from other modules
    userScriptLoaded: false,

    // line number of the Function() consctuctor
    userScriptOffset: 26,

    loadConfigFile: function (aConfigFilePath) {
        var start = new Date();

        try {
            var code = this.modules.util
                .readTextFile(aConfigFilePath).value;
            new Function("with (KeySnail.modules) {" + code + " }")();
        } catch (e) {
            // how awful ...
            // this.message(e.fileName);
            if (e.fileName == "chrome://keysnail/content/userscript.js") {
                e.fileName = aConfigFilePath;
                e.lineNumber = e.lineNumber - this.userScriptOffset + 1;                
            }
            throw e;
        }

        var end = new Date();

        this.modules.display
            .echoStatusBar("KeySnail: [" + aConfigFilePath + "]: " +
                           this.modules.util.getLocaleString("userScriptLoaded", [(end - start) / 1000]),
                           3000);
        return true;
    },

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

    beginRcFileWizard: function () {
        var loadStatus = -1;

        if (this.openDialog()) {
            loadStatus = this.loadConfigFiles(this.userPath,
                                              this.defaultConfigFileNames);
        }

        return loadStatus;
    },

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

    load: function () {
        var loadStatus = -1;

        if (this.userPath) {
            // if user defined the script path
            loadStatus = this.loadConfigFiles(this.userPath,
                                              this.defaultConfigFileNames);
        }

        // if (loadStatus < 0 && this.userPath != this.prefDirectory) {
        //     // check for the default path
        //     loadStatus = this.loadDefaultConfigFile();
        // }

        if (loadStatus < 0) {
            switch (loadStatus) {
            case -1:
                // file not found
                // we need to create the new one
                // or let user to select the userscript place
                loadStatus = this.beginRcFileWizard();
                break;
            case -2:
                // an error occured in the userscript file
                break;
            }
        }

        if (loadStatus == 0) {
            this.userScriptLoaded = true;
        } else {
            // disable the keysnail
            this.userScriptLoaded = false;

            this.modules.key.stop();
            this.modules.key.updateMenu();
            this.modules.key.updateStatusBar();
        }
    },

    // loadDefaultConfigFile: function () {
    //     return this.loadConfigFiles(this.prefDirectory,
    //                                 this.defaultConfigFileNames);
    // },

    loadUserConfigFile: function () {
        return this.loadConfigFiles(this.userPath,
                                    this.defaultConfigFileNames);
    },

    loadConfigFiles: function (aBaseDir, aConfigFileNames) {
        var prefix = aBaseDir + this.directoryDelimiter;
        var filePath;

        for (var i = 0; i < aConfigFileNames.length; ++i) {
            filePath = prefix + aConfigFileNames[i];

            if (!this.modules.util.openFile(filePath).exists()) {
                // skip
                continue;
            }

            try {
                if (this.loadConfigFile(filePath)) {
                    this.message(filePath + " loaded");
                    // success
                    this.userScriptLoaded = true;
                    return 0;
                }
            } catch (e) {
                // userscript error
                var msgstr = this.modules.util
                    .getLocaleString("userScriptError", [e.fileName, e.lineNumber]);
                msgstr += "\n [" + e.message + "]";
                this.modules.display.prettyPrint(msgstr);
                this.message(msgstr);
                // this.modules.util.alert(window, "KeySnail", msgstr);
                return -2;
            }
        }

        // file not found
        return -1;
    },

    openDialog: function () {
        var params = {
            inn: {
                util: this.modules.util,
                prefDirectory: this.prefDirectory,
                configFileNames: this.defaultConfigFileNames,
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
            var configFileName = this.defaultConfigFileNames[params.out.configFileNameIndex];

            var defaultConfigFileBase = "chrome://keysnail/content/resources/.keysnail.js.";

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

            this.message("userLocale: " + userLocale);

            var defaultConfigFile = this.modules.util.getContents(defaultConfigFileBase + userLocale);

            if (!defaultConfigFile) {
                defaultConfigFile = this.modules.util.getContents(defaultConfigFileBase + "en");
            }

            if (!defaultConfigFile) {
                this.message("rc file wizard: failed to open the default .keysnail file");
                return false;
            }

            try {
                this.modules.util.writeText(defaultConfigFile,
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
