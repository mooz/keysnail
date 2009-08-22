/**
 * @fileOverview
 * @name keysnail.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var KeySnail = {
    modules: {},

    get windowType () {
        return window.document.documentElement.getAttribute("windowtype");
    },

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
        if (this.modules.key.status &&
            this.modules.userscript.initFileLoaded) {
            this.modules.key.run();
        }

        // arrange hook points when window is the main browser-window
        if (this.windowType == "navigator:browser") {
            gBrowser.addProgressListener(KeySnail.urlBarListener,
                                         Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
            // window.addEventListener("DOMContentLoaded", function (aEvent) {
            //                             KeySnail.Hook.callHook("DOMContentLoaded", aEvent);
            //                         }, false);
            // window.addEventListener("DOMTitleChanged", function (aEvent) {
            //                             KeySnail.Hook.callHook("DOMTitleChanged", aEvent);
            //                         }, false);
        }

        // arrange destructor
        window.addEventListener("unload", function () { KeySnail.uninit(); }, false);

        this.modules.key.updateStatusBar();
    },

    uninit: function () {
        gBrowser.removeProgressListener(KeySnail.urlBarListener);
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
        // this.message('initModule: module "' + aModuleName + '" initialized.');
    },

    openPreference: function () {
        window.openDialog("chrome://keysnail/content/preference.xul", "Preferences",
                          "chrome,titlebar,toolbar,centerscreen", "prefpane-rcfile");
    },

    showElapsedTime: function (aTag) {
        var now = new Date();
        this.message(aTag + " :: " + (now - _ksLast));
        _ksLast = now;
    },

    message: Application.console.log,

    urlBarListener: {
        QueryInterface: function (aIID) {
            if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports))
                return KeySnail.urlBarListener;
            throw Components.results.NS_NOINTERFACE;
        },

        onLocationChange: function (aProgress, aRequest, aURI) {
            // Application.console.log("onLocationChange");
            KeySnail.Hook.callHook("LocationChange", aURI);
        },

        onStateChange: function () {},
        onProgressChange: function () {},
        onStatusChange: function () {},
        onSecurityChange: function () {},
        onLinkIconAvailable: function () {}
    }
};
