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
        // var windowType = aEvent.target.documentElement.getAttribute("windowtype");

        // if (!windowType) {
        //     // this.message(windowType);
        //     // this.listProperty(aEvent.target);
        // }
        // this.message(aEvent.target.name);
        // this.message(windowType);

        // this.message(aEvent.target.documentURI);

        // var elem = aEvent.target.defaultView
        //     .QueryInterface(Components.interfaces.nsIDOMNSEditableElement);
        // if (elem) {
        //     this.message("Editable found [" + aEvent.target.documentURI + "]");
        // }

        switch (aEvent.target.documentURI) {
            // white list
        case 'chrome://browser/content/browser.xul':
            aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
            return;
            break;
            // black list
        case 'chrome://keysnail/content/rcwizard.xul':
        case 'chrome://keysnail/content/preference.xul':
        case 'chrome://keysnail/content/keyGrabber.xul':
        case 'chrome://browser/content/aboutDialog.xul':
            return;
            break;
            // special case
        // case 'chrome://global/content/commonDialog.xul':
        //     // this.listProperty(aEvent.target.defaultView.document);
        //     // this.listProperty(aEvent.target);
        //     // this.listProperty(aEvent.target.document);
        //     if (this.hasInput(aEvent.target.defaultView.window)) {
        //         aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
        //     }
        //     return;
        //     break;
        }

        // when keysail is enabled globally
        if (prefService.getBoolPref('extensions.keysnail.keyhandler.global_enabled')) {
            aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
            // this.message(aEvent.target.documentURI + " => Enabled");
        }

        // windowType == "navigator:browser"
        // this.browserWindow = aEvent.target;
        // this.listProperty(this.browserWindow);
        // this.listProperty(this.browserWindow.defaultView);
        // aEvent.target.defaultView.KeySnail = this.browserWindow.defaultView.KeySnail;
        // aEvent.target.defaultView.addEventListener("keypress", aEvent.target.defaultView.KeySnail.Key, true);
    },

    // hasInput: function (aDocument) {
    //     var xPathExp = '//textbox';
    //     var xPathResults = aDocument.evaluate(xPathExp, aDocument,
    //                                           null,
    //                                           7,
    //                                           null);
        
    //     this.message((xPathResults || []).length);

    //     return (xPathResults.snapshotLength > 0);
    // },

    // list all the properties of the aObject
    // @param aObject
    // listProperty: function (aObject) {
    //     if (!aObject) {
    //         this.message("listProperty: undefined object passed");
    //     } else {
    //         for (var property in aObject) {
    //             // this.message(property);
    //             try {
    //                 this.message("[" + property + "] = "
    //                              + aObject[property]
    //                             );
    //             } catch (x) {
    //                 this.message(x);
    //             }
    //         }
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
