/**
 * @fileOverview
 * @name keysnail-loader.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const prefService = Cc['@mozilla.org/preferences;1']
    .getService(Ci.nsIPrefBranch);

const CID = Components.ID('{ed3f874d-1b4d-40f2-a19a-e424156ac49b}');
const CONTRACT_ID = '@github.com/mooz/keysnail/loader;1';
const CLASS_NAME = 'KeySnail Loader';

const STARTUP_TOPIC = 'app-startup';

function KeySnailLoader() {
}

KeySnailLoader.prototype = {
    // browserWindow: null,
    // blackList: [
    //     "chrome://keysnail/content/rcwizard.xul"
    // ],

    observe: function (aSubject, aTopic, aData) {
        switch (aTopic) {
        case STARTUP_TOPIC:
            // watch all newly opened window from now on
            Components.classes['@mozilla.org/embedcomp/window-watcher;1']
                .getService(Components.interfaces.nsIWindowWatcher)
                .registerNotification(this);
            break;
        case 'domwindowopened':
            // overlay at the "load" event (not at this time)
            aSubject.addEventListener('load', this, false);
            break;
        }
    },

    handleEvent: function (aEvent) {
        aEvent.currentTarget.removeEventListener('load', this, false);

        switch (aEvent.target.documentURI) {
            // white list
        case 'chrome://browser/content/browser.xul':
            aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
            return;
            break;
            // black list
        case 'chrome://keysnail/content/rcwizard.xul':
        // case 'chrome://keysnail/content/preference.xul':
        case 'chrome://keysnail/content/keyGrabber.xul':
        case 'chrome://browser/content/aboutDialog.xul':
        case 'chrome://mozapps/content/downloads/unknownContentType.xul':
            return;
            break;
        case 'chrome://global/content/commonDialog.xul':
            if (this.hasInput(aEvent.target)) {
                aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
            }
            return;
            break;
        }

        // when keysail is enabled globally
        if (prefService.getBoolPref('extensions.keysnail.keyhandler.global_enabled')) {
            aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
            // this.message(aEvent.target.documentURI + " => Enabled");
        }
    },

    hasInput: function (aDocument) {
        var ids = ["loginContainer",
                   "password1Container",
                   "password2Container"];

        var elem;
        for (var i = 0; i < ids.length; ++i) {
            elem = aDocument.getElementById(ids[i]);
            if (elem && !elem.hidden)
                return true;
        }

        return false;
        // var textboxes = aDocument.getElementsByTagName("textbox");
        // for (var i = 0; i < textboxes.length; ++i) {
        //     if (!textboxes[i].hidden)
        //         return true;
        // }
        // return false;
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
    }
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

function NSGetModule(aCompMgr, aFileSpec) {
    return module;
}
