/**
 * @fileOverview
 * @name util.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Util = {
    // ==== common ====
    modules: null,

    autoCompleteController: null,

    init: function () {
    },

    // ==================== Utils  ==================== //

    alert: function (aWindow, aTitle, aMessage) {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
        prompts.alert(aWindow, aTitle, aMessage);
    },

    // ==================== I / O ==================== //

    openFile: function (aPath) {
        var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(aPath);
        return file;
    },

    // @return Object which contains text as the 'value' property
    readTextFile: function (aPath, aCharset) {
        // Create the file instance
        var file = this.openFile(aPath);

        if (!file.exists()) {
            throw aPath + " not found";
        }

        // Create stream for reading text
        var fileStream = Components
            .classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
        fileStream.init(file, 1, 0, false);
        // Convert char-code
        var converterStream = Components
            .classes["@mozilla.org/intl/converter-input-stream;1"]
            .createInstance(Components.interfaces.nsIConverterInputStream);
        if (!aCharset) {
            aCharset = 'UTF-8';
        }
        converterStream.init(fileStream, aCharset, fileStream.available(),
                             converterStream.DEFAULT_REPLACEMENT_CHARACTER);
        // Output
        var out = new Object();
        converterStream.readString(fileStream.available(), out);

        converterStream.close();
        fileStream.close();

        return out;
    },

    writeText: function (aString, aPath, aForce, aCheckID) {
        var file = this.openFile(aPath);

        if (file.exists() &&
            !aForce &&
            (aCheckID ?
             !this.confirmCheck(this.getLocaleString("overWriteConfirmationTitle"),
                                this.getLocaleString("overWriteConfirmation", [aPath]),
                                this.getLocaleString("overWriteConfirmationCheck"),
                                aCheckID) :
             !this.confirm(this.getLocaleString("overWriteConfirmationTitle"),
                           this.getLocaleString("overWriteConfirmation", [aPath]))))
        {
            throw "Canceled by user";
        }

        var fileStream = Components
            .classes["@mozilla.org/network/file-output-stream;1"]
            .createInstance(Components.interfaces.nsIFileOutputStream);
        fileStream.init(file, 0x02 | 0x08 | 0x20, 0755, false);

        var wrote = fileStream.write(aString, aString.length);
        if (wrote != aString.length) {
            throw "Failed to write whole string";
        }

        fileStream.close();
    },

    confirm: function (aTitle, aMessage) {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);

        return prompts.confirm(null, aTitle, aMessage);
    },

    /**
     * Confirm dialog with the "don't ask me again" checkbox
     * @param {string} aTitle title of the dialog
     * @param {string} aMessage message of the dialog
     * @param {string} aCheckMessage message displayed near the checkbox 
     * @param {string} aId preference key to save the "don't ask me again" value
     * @returns {boolean} true when user pressed OK, and false when Canceled
     */
    confirmCheck: function (aTitle, aMessage, aCheckMessage, aId) {
        var key = "extensions.keysnail." + aId;

        if (nsPreferences.getBoolPref(key, false))
            return true;

        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);

        var check = {value: false};
        var result = prompts.confirmCheck(null,
                                          aTitle,
                                          aMessage,
                                          aCheckMessage,
                                          check);
        nsPreferences.setBoolPref(key, check.value);

        return result;
    },

    /**
     * read file contained in the package (jar)
     * original code by Torisugari
     * http://forums.mozillazine.org/viewtopic.php?p=921150
     * @param {string} aURL location of the file
     * @returns {string} content of the file
     */
    getContents: function (aURL) {
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
        var scriptableStream = Components
            .classes["@mozilla.org/scriptableinputstream;1"]
            .getService(Components.interfaces.nsIScriptableInputStream);

        try {
            var channel = ioService.newChannel(aURL, null, null);
            var input = channel.open();

            scriptableStream.init(input);
            var str = scriptableStream.read(input.available());
        } catch (e) {
            // this.message("getContents: " + e);
            return null;
        }

        scriptableStream.close();
        input.close();

        return str;
    },

    /**
     * list all properties of the object
     * @param {object} aObject target object
     */
    listProperty: function (aObject) {
        if (!aObject) {
            this.message("listProperty: undefined object passed");
        } else {
            for (var property in aObject) {
                this.message(aObject.toString()
                             + "[" + property + "] = "
                             + aObject[property]);
            }
        }
    },

    /**
     * check if the command is usable
     * @param {string} aCommand command name
     * @returns {boolean} true if aCommand is usable in current situation
     */
    isCommandUsable: function (aCommand) {
        var controller = document.commandDispatcher
            .getControllerForCommand(aCommand);
        return (controller && controller.isCommandEnabled(aCommand));
    },

    // ==================== Predicatives ====================

    /**
     * check if user can input any text in current situation
     * original code from Firemacs
     * http://www.mew.org/~kazu/proj/firemacs/
     * @param {event} aEvent keypress (or any) event with property originalTarget
     * @returns {boolean} true if text is insertable
     */
    isWritable: function (aEvent) {
        var insertTextController= document.commandDispatcher
            .getControllerForCommand("cmd_insertText");

        try {
            return (insertTextController &&
                    insertTextController.isCommandEnabled("cmd_insertText"));            
        } catch (x) {
            var localName = aEvent.originalTarget.localName.toLowerCase();
            return (localName == 'input' || localName == 'textarea');
        }
    },

    /**
     * check if cursor is in the autocomplete menu or not
     * original code from Firemacs
     * http://www.mew.org/~kazu/proj/firemacs/
     * @returns {boolean} true if cursor is in the autocomplete menu
     */
    isMenu: function () {
        var autoCompleteController =
            Components.classes['@mozilla.org/autocomplete/controller;1']
            .getService(Components.interfaces.nsIAutoCompleteController);

        if (autoCompleteController.matchCount !== 0) {
            var open = false;
            var actpps = document.getElementsByAttribute('autocompletepopup', '*');
            var len = actpps.length;
            for (var i = 0; i < len; i++) {
                open = open || document.getElementById(actpps[i].getAttribute('autocompletepopup'))
                    .QueryInterface(Components.interfaces.nsIAutoCompletePopup).popupOpen;
            }
            return open;
        }
        return false;
    },

    /**
     * check if the caret is visible or not
     * @returns {boolean} true if caret is visible
     */
    isCaretEnabled: function () {
        return this.getSelectionController().getCaretEnabled();
    },

    /**
     * check if the current document is consist of frameset or not
     * @param {window} aFrameWindow
     * @returns {boolean} true if current document is consist of frameset
     */
    isFrameSetWindow: function (aFrameWindow) {
        if (!aFrameWindow) {
            return false;
        }

        var listElem = aFrameWindow.document.documentElement
            .getElementsByTagName('frameset');

        return (listElem && listElem.length > 0);
    },

    // ==================== nsI ==================== //

    getEventStateManager: function () {
        this.listProperty(esm);
        // var docShell = document.commandDispatcher.focusedWindow
        //     .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        //     .getInterface(Components.interfaces.nsIWebNavigation)
        //     .QueryInterface(Components.interfaces.nsIDocShell);

        // return docShell
        //     .QueryInterface(Components.interfaces.nsIEventStateManager);
    },

    getSelectionController: function () {
        var docShell = document.commandDispatcher.focusedWindow
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShell);

        return docShell
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsISelectionDisplay)
            .QueryInterface(Components.interfaces.nsISelectionController);        
    },

    // ==================== event ==================== //

    /**
     * stop event propagation and prevent browser default behavior
     * @param {event} aEvent event to stop
     */
    stopEventPropagation: function (aEvent) {
        aEvent.stopPropagation();
        aEvent.preventDefault();
    },

    // ==================== pref ==================== //

    /**
     * set preference value at a stroke
     * @param {object} aPrefList {key : value} pair
     */
    setPrefs: function (aPrefList) {
        var value;
        for (var prefKey in aPrefList) {
            value = aPrefList[prefKey];
            switch (typeof(value)) {
                case 'string':
                nsPreferences.setUnicharPref(prefKey, value);
                break;
                case 'number':
                nsPreferences.setIntPref(prefKey, value);
                break;
                case 'boolean':
                nsPreferences.setBoolPref(prefKey, value);
                break;
            }
        }
    },

    /**
     * get unicode string preference value. when localized version is available,
     * that one is used.
     * @param {string} aStringKey key of the preference
     * @returns {string} fetched preference value specified by <aStringKey>
     */
    getUnicharPref: function (aStringKey) {
        return nsPreferences.getLocalizedUnicharPref(aStringKey)
            || nsPreferences.copyUnicharPref(aStringKey);
    },

    /**
     * set unicode string preference value
     * @param {string} aStringKey key of the preference
     * @param {string} aValue value of the preference specified by <aStringKey>
     */
    setUnicharPref: function (aStringKey, aValue) {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
            getService(Components.interfaces.nsIPrefBranch);
        var str = Components.classes["@mozilla.org/supports-string;1"]
            .createInstance(Components.interfaces.nsISupportsString);
        str.data = aValue;
        prefs.setComplexValue(aStringKey,
                              Components.interfaces.nsISupportsString,
                              str);
    },

    /**
     * get localized string
     * original code from Firegestures
     * http://www.xuldev.org/firegestures/
     * @param {string} aStringKey string bundle key
     * @param {[string]} aReplacements arguments be to replace the %S in format
     * @returns {string} localized key on success and string key on failure
     */
    getLocaleString: function (aStringKey, aReplacements) {
        if (!this._stringBundle) {
            const kBundleURI = "chrome://keysnail/locale/keysnail.properties";
            var bundleSvc = Components.classes["@mozilla.org/intl/stringbundle;1"]
                .getService(Components.interfaces.nsIStringBundleService);
            this._stringBundle = bundleSvc.createBundle(kBundleURI);
        }
        try {
            if (!aReplacements)
                return this._stringBundle.GetStringFromName(aStringKey);
            else
                return this._stringBundle
                .formatStringFromName(aStringKey, aReplacements, aReplacements.length);
        }
        catch (ex) {
            this.message(ex);
            return aStringKey;
        }
    },

    /**
     * check if the directory has certain files
     * @param {string} aPath
     * @param {string} aDirectoryDelimiter
     * @param {[string]} aFileNames
     * @returns {boolean} true if the directory specified <aPath> has any file contained in <aFileNames>.
     */
    isDirHasFiles: function (aPath, aDirectoryDelimiter, aFileNames) {
        var file;

        for (var i in aFileNames) {
            file = this.openFile(aPath + aDirectoryDelimiter
                                 + aFileNames[i]);
            if (file.exists()) {
                return true;
            }
        }

        return false;
    },

    /**
     * get extension's special directory
     * original function from sage
     * @param {string} aProp special directory type
     * @returns {file} special directory
     */
    getSpecialDir: function (aProp) {
        var dirService = Components.classes['@mozilla.org/file/directory_service;1']
            .getService(Components.interfaces.nsIProperties);

        return dirService.get(aProp, Components.interfaces.nsILocalFile);
    },

    /**
     * convert given string's char code
     * original function from sage
     * @param {string} aString target string
     * @param {string} aCharCode aimed charcode
     * @returns {string} charcode converted string
     */
    convertCharCodeFrom: function (aString, aCharCode) {
        var UConvID = "@mozilla.org/intl/scriptableunicodeconverter";
        var UConvIF  = Components.interfaces.nsIScriptableUnicodeConverter;
        var UConv = Components.classes[UConvID].getService(UConvIF);

        var tmpString = "";
        try {
            UConv.charset = aCharCode;
            tmpString = UConv.ConvertFromUnicode(aString);
        } catch(e) {
            tmpString = null;
        }
        return tmpString;
    },

    getSystemInfo: function () {
        return Components.classes['@mozilla.org/system-info;1'].
            getService(Components.interfaces.nsIPropertyBag2);
    },

    /**
     * get system environment value
     * @param {string} aName name of the environment value
     * @returns {string} environment value or null when not found
     */
    getEnv: function (aName) {
        var env = Components.classes['@mozilla.org/process/environment;1']
            .getService(Components.interfaces.nsIEnvironment);

        return env.exists(aName) ? env.get(aName) : null;
    },

    // ==================== Path / URL ====================

    /**
     * convert local file path to the URL expression
     * @param {string} aPath local file path
     * @returns {string} URL expression of aPath
     */
    pathToURL: function (aPath) {
        var file = this.openFile(aPath);
        var ioService = Components
            .classes['@mozilla.org/network/io-service;1']
            .getService(Components.interfaces.nsIIOService);
        var url = ioService.newFileURI(file);
        var fileURL = url.spec;

        return fileURL;
    },

    /**
     * convert URL to the local file path 
     * @param {string} aUrl URL of the file
     * @returns {string} Local path expression of chrome URL
     */
    urlToPath: function (aUrl) {
        var ioService = Components
            .classes['@mozilla.org/network/io-service;1']
            .getService(Components.interfaces.nsIIOService);
        var fileHandler = ioService.getProtocolHandler('file')
            .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        var file = fileHandler.getFileFromURLSpec(aUrl);
        var path = file.path;

        return path;
    },

    /**
     * convert chrome://hoge => /foo/bar/.../hoge
     * original code by Jfingland
     * http://forums.mozillazine.org/viewtopic.php?p=921150
     * @param {string} aUrl chrome url to the local file path
     * @returns {string} local file path
     */
    chromeToPath: function (aUrl) {
        if (!aUrl || !(/^chrome:/.test(aUrl)))
            return null;

        var rv;
        var ios = Components.classes['@mozilla.org/network/io-service;1']
            .getService(Components.interfaces["nsIIOService"]);
        var uri = ios.newURI(aUrl, "UTF-8", null);
        var cr = Components.classes['@mozilla.org/chrome/chrome-registry;1']
            .getService(Components.interfaces["nsIChromeRegistry"]);
        rv = cr.convertChromeURL(uri).spec;

        if (/^file:/.test(rv))
            rv = this.urlToPath(rv);
        else
            rv = this.urlToPath("file://"+rv);

        return rv;
    },

    message: KeySnail.message
};
