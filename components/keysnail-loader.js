/**
 * @fileOverview
 * @name keysnail-loader.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const Cc = Components.classes;
const Ci = Components.interfaces;

const prefService = Cc['@mozilla.org/preferences;1'].getService(Ci.nsIPrefBranch);

const CID         = Components.ID('{ed3f874d-1b4d-40f2-a19a-e424156ac49b}');
const CONTRACT_ID = '@github.com/mooz/keysnail/loader;1';
const CLASS_NAME  = 'KeySnail Loader';

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

if (XPCOMUtils.generateNSGetFactory)
    var STARTUP_TOPIC = 'profile-after-change'; // for gecko 2.0
else
    var STARTUP_TOPIC = 'app-startup';

function loadScript(path, context) {
    const loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader.loadSubScript(path, context);
}

function loadModule(module, context) {
    loadScript("chrome://keysnail/content/modules/" + module + ".js", context);
}

function KeySnailLoader() {}

KeySnailLoader.prototype = {
    observe: function (aSubject, aTopic, aData) {
        switch (aTopic)
        {
        case STARTUP_TOPIC:
            // watch all newly opened window from now on
            Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher).registerNotification(this);
            break;
        case 'domwindowopened':
            // overlay at the "load" event (not at this time)
            aSubject.addEventListener('load', this, false);
            break;
        }
    },

    handleEvent: function (ev) {
        const doc = ev.target;
        const win = doc.defaultView;

        let loadIt = false;

        doc.removeEventListener('load', this, false);

        switch (doc.documentURI)
        {
            // white list
        case 'chrome://browser/content/browser.xul':
            loadIt = true;
            break;
            // black list
        case 'chrome://keysnail/content/rcwizard.xul':
        case 'chrome://keysnail/content/extviewer.xul':
        case 'chrome://keysnail/content/builtinviewer.xul':
        case 'chrome://keysnail/content/keyGrabber.xul':
        case 'chrome://keysnail/content/installplugindialog.xul':
        case 'chrome://keysnail/content/update-plugin-dialog.xul':
            // some
        case 'chrome://global/content/alerts/alert.xul':
        case 'chrome://browser/content/aboutDialog.xul':
        case 'chrome://mozapps/content/downloads/unknownContentType.xul':
            break;
        case 'chrome://global/content/commonDialog.xul':
            if (this.hasInput(doc))
                loadIt = true;
            break;
        }

        // when keysail is enabled globally
        if (prefService.getBoolPref('extensions.keysnail.keyhandler.global_enabled'))
            loadIt = true;

        if (loadIt)
            this.load(win);
    },

    load: function (win) {
        loadScript('chrome://keysnail/content/keysnail.js', win);
        this.loadModules(win);
        win.KeySnail.init();
    },

    loadModules: function (win) {
        const modules = [
            "util",
            "html",
            "display",
            "command",
            "style",
            "key",
            "hook",
            "macro",
            "plugins",
            "userscript",
            "prompt",
            "ext",
            "shell"
        ];

        let context = win.KeySnail.modules;

        for (let [, module] in Iterator(modules))
            loadModule(module, context);
    },

    hasInput: function (aDocument) {
        const ids = ["loginContainer",
                     "password1Container",
                     "password2Container"];

        for (let [, id] in Iterator(ids))
        {
            let elem = aDocument.getElementById(id);
            if (elem && !elem.hidden)
                return true;
        }

        return false;
    },

    // list all the properties of the aObject
    // @param aObject
    // listProperty: function (aObject) {
    //     if (!aObject) {
    //         this.message("listProperty: undefined object passed");
    //     } else {
    //         try {
    //         for (var property in aObject) {
    //             this.message("[" + property + "] = "
    //                          + aObject[property]
    //                         );
    //         }
    //         } catch (x) {
    //             this.message(x);
    //     }
    //     }
    // },

    // message: function (aMsg) {
    //     var logs = Components.classes["@mozilla.org/consoleservice;1"]
    //         .getService(Components.interfaces.nsIConsoleService);
    //     try {
    //         logs.logStringMessage(aMsg);
    //     } catch (x) {
    //         log.logStringMessage(x);
    //     }
    // },

    QueryInterface: function (aIID) {
        if (!aIID.equals(Components.interfaces.nsIDOMEventListener) &&
            !aIID.equals(Components.interfaces.nsIObserver) &&
            !aIID.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
    },

    classDescription: CLASS_NAME,
    contractID: CONTRACT_ID,
    classID: CID
};

var module = {
    registerSelf: function (aCompMgr, aFileSpec, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.registerFactoryLocation(CID,
                                         CLASS_NAME,
                                         CONTRACT_ID,
                                         aFileSpec,
                                         aLocation,
                                         aType);
        var catMgr = Components.classes['@mozilla.org/categorymanager;1']
            .getService(Components.interfaces.nsICategoryManager);
        catMgr.addCategoryEntry(STARTUP_TOPIC, CLASS_NAME, CONTRACT_ID, true, true, null);
    },

    unregisterSelf: function (aCompMgr, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
    },

    getClassObject: function (aCompMgr, aCID, aIID) {
        if (!aIID.equals(Components.interfaces.nsIFactory)) {
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        }

        if (!aCID.equals(CID)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }

        return this.factory;
    },

    canUnload: function (aCompMgr) {
        return true;
    },

    factory: {
        createInstance: function (aOuter, aIID) {
            if (aOuter != null) {
                throw Components.results.NS_ERROR_NO_AGGREGATION;
            }
            return (new KeySnailLoader()).QueryInterface(aIID);
        }
    }
};

// function NSGetModule(aCompMgr, aFileSpec) {
//     return module;
// }

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([KeySnailLoader]);
else
    var NSGetModule = function (aCompMgr, aFileSpec) { return module; };
