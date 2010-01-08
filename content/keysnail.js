/**
 * @fileOverview
 * @name keysnail.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var KeySnail = {
    modules: {},

    get windowType() {
        if (this._windowType)
            return this._windowType;

        return this._windowType = window.document.documentElement.getAttribute("windowtype");
    },

    get version() {
        return this.extInfo.version;
    },

    get id() {
        return "keysnail@mooz.github.com";
    },

    get isThunderbird() {
        return !!window.navigator.userAgent.match(/thunderbird/i);
    },

    init: function () {
        var extmanager = Components.classes["@mozilla.org/extensions/manager;1"]
            .createInstance(Components.interfaces.nsIExtensionManager);

        this.extInfo = extmanager.getItemForID(this.id);

        // Arrange modules {{ ======================================================= //

        var moduleObjects = ["Util",
                             "Display",
                             "Command",
                             "HTML",
                             "Hook",
                             "Macro",
                             "Style",
                             "Key",
                             "Prompt",
                             "Ext",
                             // UserScript must be the last
                             "UserScript"];
        this.modules.modules = this.modules;

        // local namespace for user
        this.My = {};
        this.registerModule.call(this, "My");

        // global namespace for user
        try {
            Components.utils.import("resource://keysnail-share/share.js", this.modules);
        } catch (x) {}

        var i;
        var len = moduleObjects.length;
        for (i = 0; i < len; ++i)
        {
            this.registerModule.call(this, moduleObjects[i]);
        }

        for (i = 0; i < len; ++i)
        {
            this.initModule.call(this, moduleObjects[i]);
        }

        // }} ======================================================================= //

        // now, run the keyhandler
        if (this.modules.key.status &&
            this.modules.userscript.initFileLoaded)
        {
            this.modules.key.run();
        }

        // arrange hook points when window is the main browser-window
        if (this.windowType === "navigator:browser")
        {
            gBrowser.addProgressListener(KeySnail.urlBarListener,
                                         Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

            // add context menu
            this.createInstallPluginMenu();

            // hook window unload event
            window.addEventListener("unload", function () { KeySnail.Hook.callHook("Unload"); }, false);

            this.modules.key.inExternalFile = true;
            this.modules.hook.addToHook("Unload", function () { gBrowser.removeProgressListener(KeySnail.urlBarListener); });
            this.workAroundPopup();
            this.modules.key.inExternalFile = false;

            // hook location bar copy / cut event
            try
            {
                let controller        = document.getElementById("urlbar")._copyCutController;
                let originalDoCommand = controller.doCommand;
                controller.doCommand = function (aCommand) {
                    originalDoCommand.apply(this, arguments);
                    KeySnail.modules.command.clipboardChanged();
                };
            }
            catch (x)
            {
                this.message(x);
            }
        }

        this.modules.key.updateStatusBar();
    },

    /**
     * Register modules
     * add given module to KeySnail.modules
     * @param {[string]} aModuleName
     */
    registerModule: function (aModuleName) {
        // KeySnail.Key => modules.key
        // KeySnail.HTML => modules.html
        this.modules[aModuleName.toLowerCase()] = this[aModuleName];
        // this.modules.__defineGetter__(aModuleName.toLowerCase(), function () KeySnail[aModuleName]);
    },

    /**
     * Init modules
     * call each modules init() and add member 'modules' and 'parent'.
     * @param {[string]} aModuleName
     */
    initModule: function (aModuleName) {
        if (!this[aModuleName])
        {
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

    workAroundPopup: function () {
        with (KeySnail.modules)
        {
            const allowedEventsKey = "dom.popup_allowed_events";
            var allowedEvents = util.getUnicharPref(allowedEventsKey, "");
            var tmpAllowedEvents;

            if (allowedEvents.indexOf("keypress") === -1)
            {
                tmpAllowedEvents = allowedEvents + " keypress";
                util.setUnicharPref(allowedEventsKey, tmpAllowedEvents);

                hook.addToHook("Unload", function () {
                                   util.setUnicharPref(allowedEventsKey, allowedEvents);
                               });
            }
        }
    },

    /**
     * Open preference dialog
     */
    openPreference: function (aForce) {
        var openedWindow = Components.classes['@mozilla.org/appshell/window-mediator;1']
            .getService(Components.interfaces.nsIWindowMediator)
            .getMostRecentWindow('KeySnail:Preference');

        if (openedWindow && !aForce)
        {
            openedWindow.focus();
        }
        else
        {
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

    message: function (aFormat) {
        Application.console.log(this.modules.util.format.apply(null, arguments));
    },

    /**
     * For checking the "LocationChange"
     */
    urlBarListener: {
        QueryInterface: function (aIID) {
            if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports))
            {
                return KeySnail.urlBarListener;
            }
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
