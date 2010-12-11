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

    init:
    function init() {
        if ("@mozilla.org/addons/integration;1" in Components.classes) // Over Gecko 2.0 or not
        {
            let am = {};
            Components.utils.import("resource://gre/modules/AddonManager.jsm", am);

            let self = this;
            am.AddonManager.getAddonByID(this.id, function (addon) {
                                             self.extInfo = addon;
                                             self.doInit();
                                         });
        }
        else
        {
            var extManager = Components.classes["@mozilla.org/extensions/manager;1"]
                .createInstance(Components.interfaces.nsIExtensionManager);
            this.extInfo = extManager.getItemForID(this.id);
            this.doInit();
        }
    },

    doInit:
    function doInit() {
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
                             "Shell",
                             // UserScript must be the last
                             "UserScript"];
        let modules = this.modules.modules = this.modules;

        // local namespace for user
        this.My = {};
        this.registerModule.call(this, "My");

        // global namespace for user
        try {
            Components.utils.import("resource://keysnail-share/share.js", modules);
        } catch (x) {}

        let self = this;
        moduleObjects.forEach(function (name) { self.registerModule(name); });
        moduleObjects.forEach(function (name) { self.initModule(name); });

        // }} ======================================================================= //

        // now, run the keyhandler
        if (modules.key.status && modules.userscript.initFileLoaded)
            modules.key.run();

        // main-window specific settings
        if (this.windowType === "navigator:browser") {
            this.settingsForBrowserWindow();
            modules.key.updateStatusBar();
        }

        document.addEventListener("copy", function () { modules.command.clipboardChanged(); }, true);
        modules.hook.callHook("KeySnailInitialized");
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

    settingsForBrowserWindow: function () {
        let modules = this.modules;

        gBrowser.addProgressListener(KeySnail.urlBarListener,
                                     Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

        // add context menu
        this.createInstallPluginMenu();

        // start plugin's update checker
        this.startUpdatePluginChecker();

        // hook window unload event
        window.addEventListener("unload", function () { KeySnail.Hook.callHook("Unload"); }, false);

        modules.key.inExternalFile = true;
        modules.hook.addToHook("Unload", function () { gBrowser.removeProgressListener(KeySnail.urlBarListener); });
        this.workAroundPopup();
        modules.key.inExternalFile = false;

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
    },

    startUpdatePluginChecker: function () {
        let modules = this.modules;
        let { userscript, util, plugins } = modules;

        let notification = document.getElementById("keysnail-plugin-notification");

        let paths = [path for ([path, plugin] in Iterator(plugins.context))];

        let hasUpdates = [];

        KeySnail._pluginsWithUpdate = null;

        (function checkNext() {
            if (!paths.length) {
                // finish
                KeySnail._pluginsWithUpdate = hasUpdates;
                if (hasUpdates.length)
                    notification.hidden = false;
                return;
            }

            let path = paths.pop();

            util.message("Checking " + path + " ... ");

            userscript.doesPluginHasUpdate(path, function (hasUpdate, context) {
                util.message("=> " + hasUpdate);
                if (hasUpdate) {
                    context.path = path;
                    hasUpdates.push(context);
                }
                return checkNext();
            });
        })();
    },

    updatePluginNotificationMenu: function () {
        let modules = this.modules;
        let { userscript, util, plugins } = modules;

        let menu = document.getElementById("keysnail-plugin-notification-menu");

        while (menu.hasChildNodes())
            menu.removeChild(menu.firstChild);

        if (!KeySnail._pluginsWithUpdate || !KeySnail._pluginsWithUpdate.length) {
            util.message("no updates found");
            return;
        }

        for (let [, { code, info, path }] in Iterator(KeySnail._pluginsWithUpdate)) {
            function getInfo(name) {
                return modules.L(util.xmlGetLocaleString(info[name]));
            }

            let item = util.xmlToDom(<menuitem label={getInfo("name")}
                                               class="menuitem-iconic"
                                               src={getInfo("iconURL")}/>
            );

            item.setAttribute("oncommand", util.format("KeySnail.updatePlugin('%s')", path));

            menu.appendChild(item);
        }

        menu.appendChild(document.createElement("menuseparator"));
        menu.appendChild(util.xmlToDom(<menuitem label="Update all plugins"
	                                         oncommand="KeySnail.updatePlugins();"/>));
    },

    updatePlugin: function (path, next) {
        let modules = this.modules;
        let { userscript, util, plugins } = modules;

        let scripts = KeySnail._pluginsWithUpdate || [];

        if (scripts.some(function ({ path : p }) path === p)) {
            userscript.updatePlugin(path, function (succeeded) {
                if (succeeded) {
                }
            });
        }
    },

    updatePlugins: function () {
        let modules = this.modules;
        let { userscript, util, plugins } = modules;

        if (KeySnail._pluginsWithUpdate && KeySnail._pluginsWithUpdate.length) {
            let scripts = KeySnail._pluginsWithUpdate;

            (function updateNext() {
                if (!scripts.length) {
                    return alert("Finished!");
                }

                let script = scripts.pop();

                userscript.updatePlugin(script.path, function (succeeded) {
                    if (succeeded) {
                        util.message("updated " + script.path);
                        updateNext();
                    } else {
                        alert("Failed to update plugin");
                        scripts.push(script);
                    }
                });
            })();
        }
    },

    onUpdateNotificationClick: function (ev) {
        if (!KeySnail._pluginsWithUpdate || !KeySnail._pluginsWithUpdate.length)
            return;

        document.getElementById("keysnail-plugin-notification-menu")
            .openPopup(ev.target, "after_start", 0, 0, true);
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

    message: function (aFormat) {
        Application.console.log(KeySnail.modules.util.format.apply(null, arguments));
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
