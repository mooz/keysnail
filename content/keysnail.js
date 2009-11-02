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

    get version () {
        return "1.0.9";
    },

    init: function () {
        var moduleObjects = ["Util",
                             "Display",
                             "Command",
                             "HTML",
                             "Hook",
                             "Macro",
                             "Key",
                             "Prompt",
                             "Ext",
                             // UserScript must be the last
                             "UserScript"];
        this.modules.modules = this.modules;

        // local namespace for user
        this.My = {};
        this.registerModule.call(this, "My");

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

            // add context menu
            this.createInstallPluginMenu();

            // arrange destructor
            window.addEventListener("unload", function () { KeySnail.uninit(); }, false);
        }

        this.modules.key.updateStatusBar();
    },

    uninit: function () {
        if (this.windowType == "navigator:browser") {
            gBrowser.removeProgressListener(KeySnail.urlBarListener);
        }
    },

    /**
     * Register modules
     * add given module to KeySnail.modules
     * @param {[string]} aModuleName
     */
    registerModule: function (aModuleName) {
        // KeySnail.Key => modules.key
        // KeySnail.HTML => modules.html
        this.modules.__defineGetter__(aModuleName.toLowerCase(), function () KeySnail[aModuleName]);
    },

    /**
     * Init modules
     * call each modules init() and add member 'modules' and 'parent'.
     * @param {[string]} aModuleName
     */
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

    /**
     * Create context menu
     */
    createInstallPluginMenu: function () {
        var modules = this.modules;

        function setMenuDisplay() {
            var item = document.getElementById("keysnail-plugin-installer");
            item.hidden = !gContextMenu.onLink || !gContextMenu.linkURL.match("\\.ks\\.js$");
        }

        function installPlugin() {
            var url = gContextMenu.linkURL;
            modules.userscript.installPluginFromURL(url);
        }

        var contextMenu = document.getElementById("contentAreaContextMenu");
        var menuitem    = document.getElementById("keysnail-plugin-installer");

        menuitem = document.createElement("menuitem");
        menuitem.id = "keysnail-plugin-installer";
        menuitem.setAttribute("label", modules.util.getLocaleString("installThisPlugin"));
        menuitem.setAttribute("accesskey", "k");
        menuitem.setAttribute("class", "menuitem-iconic");
        menuitem.setAttribute("src", "chrome://keysnail/skin/notify-icon16.png");
        contextMenu.appendChild(menuitem);

        menuitem.addEventListener("command", installPlugin, false);
        contextMenu.addEventListener("popupshowing", setMenuDisplay, false);
    },

    /**
     * Open preference dialog
     */
    openPreference: function () {
        var openedWindow = Components.classes['@mozilla.org/appshell/window-mediator;1']
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow('KeySnail:Preference');

        if (openedWindow) {
            openedWindow.focus();
        } else {
            window.openDialog("chrome://keysnail/content/preference.xul",
                              "Preferences",
                              "chrome=yes,titlebar=yes,toolbar=yes,centerscreen=yes,resizable=yes,scrollbars=yes",
                              "prefpane-rcfile");
        }
    },

    showElapsedTime: function (aTag) {
        var now = new Date();
        this.message(aTag + " :: " + (now - _ksLast));
        _ksLast = now;
    },

    message: Application.console.log,

    /**
     * For checking the "LocationChange"
     */
    urlBarListener: {
        QueryInterface: function (aIID) {
            if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports))
                return KeySnail.urlBarListener;
            throw Components.results.NS_NOINTERFACE;
        },

        onLocationChange: function (aProgress, aRequest, aURI) {
            KeySnail.Hook.callHook("LocationChange", aURI);
        },

        onStateChange: function () {},
        onProgressChange: function () {},
        onStatusChange: function () {},
        onSecurityChange: function () {},
        onLinkIconAvailable: function () {}
    }
};
