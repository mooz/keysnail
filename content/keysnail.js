var KeySnail = {
    modules: {},

    init: function () {
        // unfortunately, changes in this order
        // may cause the undefined error
        // Added (07/10 09)
        var moduleObjects = ["Util",
                             "Display",
                             "Command",
                             "HTML",
                             "Hook",
                             "Macro",
                             "Key",
                             // UserScript must be the last
                             "UserScript"];

        this.modules.modules = this.modules;

        var i;
        var len = moduleObjects.length;
        for (i = 0; i < len; ++i) {
            this.registerModule.call(this, moduleObjects[i]);
        }
        for (i = 0; i < len; ++i) {
            this.initModule.call(this, moduleObjects[i]);
        }

        // now, run the keyhandler
        if (this.modules.key.status) {
            this.modules.key.run();
        }

        this.modules.key.updateStatusBar();
    },

    registerModule: function (aModuleName) {
        // KeySnail.Key => modules.key
        // KeySnail.HTML => modules.html
        this.modules[aModuleName.toLowerCase()] = this[aModuleName];
    },

    initModule: function (aModuleName) {
         if (!this[aModuleName]) {
            this.message('initModule: module "' + aModuleName + '" is not loaded. Skip this module.');
            return;
        }
        // add member "modules" to each module Object
        this[aModuleName].modules = this.modules;
        // add member "parent" to each module Object
        this[aModuleName].parent = this;
        // initialize module
        this[aModuleName].init();
        this.message('initModule: module "' + aModuleName + '" initialized.');
    },

    openPreference: function () {
        window.openDialog("chrome://keysnail/content/preference.xul", "Preferences",
                          "chrome,titlebar,toolbar,centerscreen", "prefpane-rcfile");
    },

    uninit: function () {
        // this.message("Bye!");
    },

    message: function (msg) {
        Application.console.log(msg);
    }
};
