const CID = Components.ID('{ed3f874d-1b4d-40f2-a19a-e424156ac49b}');
const CLASS_NAME = 'KeySnail Service';
const CONTRACT_ID = '@github.com/mooz/keysnail;1';

const prefService = Components.classes['@mozilla.org/preferences;1']
    .getService(Components.interfaces.nsIPrefBranch);

function KeySnailLoader() {
}

KeySnailLoader.prototype = {
    observe: function (aSubject, aTopic, aData) {
        switch (aTopic) {
        case 'app-startup':
            // watch all opened window from now on
            Components.classes['@mozilla.org/embedcomp/window-watcher;1']
                .getService(Components.interfaces.nsIWindowWatcher)
                .registerNotification(this);
            break;
        case 'domwindowopened':
            aSubject.addEventListener('load', this, false);
            break;
        }
    },

    // list all the properties of the aObject
    // @param aObject
    // listProperty: function (aObject) {
    //     if (!aObject) {
    //         this.message("listProperty: undefined object passed");
    //     } else {
    //         for (var property in aObject) {
    //             this.message(aObject.toString()
    //                          + "[" + property + "] = "
    //                          + aObject[property]);
    //         }
    //     }
    // },

    // message: function (aMsg) {
    //     var logs = Components.classes["@mozilla.org/consoleservice;1"]
    //         .getService(Components.interfaces.nsIConsoleService);
    //     logs.logStringMessage(aMsg);
    // },

    handleEvent: function (aEvent) {
        aEvent.currentTarget.removeEventListener('load', this, false);
        // this.message(aEvent.target);
        // this.listProperty(aEvent.target);
        if (prefService.getBoolPref('extensions.keysnail.keyhandler.globalEnabled')
            || aEvent.target.getElementById('statusbar-display')) {
            aEvent.target.loadOverlay('chrome://keysnail/content/keysnail.xul', null);
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
        
        if (!aCID.equals(aCID)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }

        return this.factory;
    },
    
    canUnload: function (aCompMgr) {
        return true;
    },

    factory: {
        createInstance: function (aOuter, aIID) {
            if (aOuter !== null) {
                throw Components.results.NS_ERROR_NO_AGGREGATION;
            }
            return (new KeySnailLoader()).QueryInterface(aIID);
        }
    }
};


function NSGetModule(aCompMgr, aFileSpec) {
    return module;
}
