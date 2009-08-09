const Cc = Components.classes;
const Ci = Components.interfaces;
const prefService = Cc['@mozilla.org/preferences;1']
    .getService(Ci.nsIPrefBranch);

const CID = Components.ID('{ed3f874d-1b4d-40f2-a19a-e424156ac49b}');
const CONTRACT_ID = '@github.com/mooz/keysnail/loader;1';
const CLASS_NAME = 'KeySnail Loader';

function KeySnailLoader() {
}

KeySnailLoader.prototype = {
    browserWindow: null,

    observe: function (aSubject, aTopic, aData) {
        switch (aTopic) {
        case 'app-startup':
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
        var windowType = aEvent.target.documentElement.getAttribute("windowtype");
        // if (!windowType) {
        //     this.listProperty(aEvent.target);
        // }
        // this.message(aEvent.target.name);
        // this.message(windowType);

        if (windowType == "navigator:browser") {
            aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
            this.browserWindow = aEvent.target;

            // this.listProperty(this.browserWindow);
            // this.listProperty(this.browserWindow.defaultView);
        } else {
            // aEvent.target.defaultView.KeySnail = this.browserWindow.defaultView.KeySnail;
            // aEvent.target.defaultView.addEventListener("keypress", aEvent.target.defaultView.KeySnail.Key, true);
            if (prefService.getBoolPref('extensions.keysnail.keyhandler.globalEnabled')
                && aEvent.target.documentURI != "chrome://keysnail/content/rcwizard.xul") {
                aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
            }
        }
    },

    // list all the properties of the aObject
    // @param aObject
    listProperty: function (aObject) {
        if (!aObject) {
            this.message("listProperty: undefined object passed");
        } else {
            for (var property in aObject) {
                // this.message(property);
                try {
                    this.message("[" + property + "] = "
                                 + aObject[property]
                                );
                } catch (x) {
                    this.message(x);
                }
            }
        }
    },

    message: function (aMsg) {
        var logs = Components.classes["@mozilla.org/consoleservice;1"]
            .getService(Components.interfaces.nsIConsoleService);
        try {
            logs.logStringMessage(aMsg);
        } catch (x) {
            log.logStringMessage(x);
        }
    },

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
        catMgr.addCategoryEntry('app-startup', CLASS_NAME, CONTRACT_ID, true, true, null);
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
