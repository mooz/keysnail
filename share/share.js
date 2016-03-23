const EXPORTED_SYMBOLS = ["share", "persist", "Cc", "Ci"];

const Cc = Components.classes;
const Ci = Components.interfaces;

const extensionName = "keysnail";

let util = {
    log: function util_log(aMsg) {
        let logs = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

        try
        {
            logs.logStringMessage(aMsg);
        }
        catch (x)
        {
            logs.logStringMessage(x);
        }
    },

    // Char code {{ ============================================================= //

    /**
     * convert given string's char code
     * original function from sage
     * @param {string} aString target string
     * @param {string} aCharCode aimed charcode
     * @returns {string} charcode converted string
     */
    convertCharCodeFrom: function (aString, aCharCode) {
        let UConvID = "@mozilla.org/intl/scriptableunicodeconverter";
        let UConvIF = Ci.nsIScriptableUnicodeConverter;
        let UConv   = Cc[UConvID].getService(UConvIF);

        let tmpString = "";
        try
        {
            UConv.charset = aCharCode;
            tmpString = UConv.ConvertFromUnicode(aString);
        }
        catch (e)
        {
            tmpString = null;
        }

        return tmpString;
    },

    // }} ======================================================================= //

    // IO {{ ==================================================================== //

    /**
     * get extension's special directory
     * original function from sage
     * @param {string} aProp special directory type
     * @returns {file} special directory
     */
    getSpecialDir: function (aProp) {
        return Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties)
            .get(aProp, Ci.nsILocalFile);
    },

    /**
     * Open file specified by <b>aPath</b> and returns it.
     * @param {string} aPath file path to be opened
     * @returns {nsILocalFile} opened file
     */
    openFile: function (aPath) {
        let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        file.initWithPath(aPath);

        return file;
    },

    /**
     * Open text file, read its content, and returns it.
     * @param {string} aPath file path to be read
     * @param {string} aCharset specify text charset
     * @returns {string} text content of the file
     * @throws {}
     */
    readTextFile: function (aPath, aCharset) {
        let file = util.openFile(aPath);

        if (!file.exists())
            throw new Exception(aPath + " not found");

        let fileStream = Cc["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Ci.nsIFileInputStream);
        fileStream.init(file, 1, 0, false);

        let converterStream = Cc["@mozilla.org/intl/converter-input-stream;1"]
            .createInstance(Ci.nsIConverterInputStream);

        if (!aCharset)
            aCharset = 'UTF-8';
        converterStream.init(fileStream, aCharset, fileStream.available(),
                             converterStream.DEFAULT_REPLACEMENT_CHARACTER);

        let out = {};
        converterStream.readString(fileStream.available(), out);

        converterStream.close();
        fileStream.close();

        return out.value;
    },

    /**
     * Write <b>aString</b> to the local file specified by <b>aPath</b>.
     * Overwrite confirmation will be ommitted if <b>aForce</b> is true.
     * "Don't show me again" checkbox value managed by <b>aCheckID</b>.
     * @param {string} aString
     * @param {string} aPath
     * @param {boolean} aForce
     * @param {string} aCheckID
     * @throws {}
     */
    writeTextFile: function (aString, aPath, aForce) {
        let file = util.openFile(aPath);

        if (file.exists() && !aForce &&
            util.confirm(util.getLocaleString("overWriteConfirmationTitle"),
                         util.getLocaleString("overWriteConfirmation", [aPath])))
        {
            throw new Exception("Canceled by user");
        }

        let fileStream = Cc["@mozilla.org/network/file-output-stream;1"]
            .createInstance(Ci.nsIFileOutputStream);
        fileStream.init(file, 0x02 | 0x08 | 0x20, 0644, false);

        let wrote = fileStream.write(aString, aString.length);
        if (wrote != aString.length)
        {
            throw new Exception("Failed to write whole string");
        }

        fileStream.close();
    },

    createDirectory: function (aLocalFile) {
        if (aLocalFile.exists() && !aLocalFile.isDirectory())
            aLocalFile.remove(false);

        if (!aLocalFile.exists())
            aLocalFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);

        return aLocalFile;
    },

    getExtensionLocalDirectoryRoot: function () {
        const extName = extensionName;

        let extDir = util.getSpecialDir("ProfD");
        extDir.append(extName);

        return util.createDirectory(extDir);
    },

    getExtensionLocalDirectory: function (aDirName) {
        let localDir = util.getExtensionLocalDirectoryRoot();
        localDir.append(aDirName);

        return util.createDirectory(localDir);
    }

    // }} ======================================================================= //
};

let persist = {
    registeredObjects: {
        // name : obj
    },

    register: function (aObj, aName, aForce) {
        persist.registeredObjects[aName] = aObj;
    },

    getFile: function (aName) {
        let dir = util.getExtensionLocalDirectory('persistent');
        dir.append(aName.replace(/-/g, "_") + ".json");

        return dir;
    },

    preserve: function (aObj, aName) {
        let file = persist.getFile(aName);

        this.preserveTo(aObj, file);
    },

    preserveTo: function (aObj, aFile) {
        let encoded = JSON.stringify(aObj);

        util.writeTextFile(util.convertCharCodeFrom(encoded, "UTF-8"), aFile.path, true);
    },

    restore: function (aName) {
        let file = persist.getFile(aName);

        return this.restoreFrom(file);
    },

    restoreFrom: function (aFile) {
        let str;

        try {
            str = util.readTextFile(aFile.path);
        } catch (x) {
            return null;
        }

        try {
            return JSON.parse(str);
        } catch (x) {
            return null;
        }
    }
};

let share = {
    get WINDOWS() {
      let xr = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
      return /windows/i.test(xr.OS) || /winnt/i.test(xr.OS);
    },
    get MAC() {
      let xr = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
      return /darwin/i.test(xr.OS);
    }
};

// }} ======================================================================= //

function hookApplicationQuit() {
    const topicId = 'quit-application-granted';

    function quitObserver() {
        this.register();
    }

    quitObserver.prototype = {
        observe: function(subject, topic, data) {
            for (let [name, obj] of util.keyValues(persist.registeredObjects))
            {
                persist.preserve(obj, name);
            }

            this.unregister();
        },

        register: function() {
            let observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
            observerService.addObserver(this, topicId, false);
        },

        unregister: function() {
            let observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
            observerService.removeObserver(this, topicId);
        }
    };

    new quitObserver();
};

function init() {
    let promptHistory;

    try {
        promptHistory = persist.restore("prompt_history") || {};
    } catch (x) {
        util.log("Failed to restore prompt history : " + x);
        promptHistory = {};
    }

    persist.register(persist.promptHistory = promptHistory, "prompt_history");
}

init();
hookApplicationQuit();
