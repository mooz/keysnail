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
        this.sandboxForSafeEval = new Components.utils.Sandbox("about:blank");

        this.userLocale = this.getUnicharPref("general.useragent.locale");
        this.userLocale = {
            // ja
            "ja"        : "ja",
            "ja-JP"     : "ja",
            "ja-JP-mac" : "ja",
            "ja_JP"     : "ja",
            "JP"        : "ja",
            // en
            "en-US"     : "en"
        }[this.userLocale] || "en";
    },

    get focusedElement () {
        return document.commandDispatcher.focusedElement;
    },

    // ==================== Utils  ==================== //

    // File IO {{ =============================================================== //

    /**
     * Open file specified by <aPath> and returns it.
     * @param {string} aPath file path to be opened
     * @returns {nsILocalFile} opened file
     */
    openFile: function (aPath) {
        var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance(Components.interfaces.nsILocalFile);
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
        // Create the file instance
        var file = this.openFile(aPath);

        if (!file.exists())
            throw aPath + " not found";

        // Create stream for reading text
        var fileStream = Components
            .classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
        fileStream.init(file, 1, 0, false);
        // Convert char-code
        var converterStream = Components
            .classes["@mozilla.org/intl/converter-input-stream;1"]
            .createInstance(Components.interfaces.nsIConverterInputStream);
        if (!aCharset)
            aCharset = 'UTF-8';
        converterStream.init(fileStream, aCharset, fileStream.available(),
                             converterStream.DEFAULT_REPLACEMENT_CHARACTER);
        // Output
        var out = new Object();
        converterStream.readString(fileStream.available(), out);

        converterStream.close();
        fileStream.close();

        return out.value;
    },

    /**
     * read file contained in the package (jar)
     * original code by Torisugari
     * http://forums.mozillazine.org/viewtopic.php?p=921150
     * @param {string} aURL location of the file
     * @returns {string} content of the file
     */
    readTextFileFromPackage: function (aURL) {
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
            // this.message("readTextFileFromPackage: " + e);
            return null;
        }

        scriptableStream.close();
        input.close();

        return str;
    },

    /**
     * Write <aString> to the local file specified by <aPath>.
     * Overwrite confirmation will be ommitted if <aForce> is true.
     * "Don't show me again" checkbox value managed by <aCheckID>.
     * @param {string} aString
     * @param {string} aPath
     * @param {boolean} aForce
     * @param {string} aCheckID
     * @throws {}
     */
    writeTextFile: function (aString, aPath, aForce, aCheckID) {
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
        fileStream.init(file, 0x02 | 0x08 | 0x20, 0644, false);

        var wrote = fileStream.write(aString, aString.length);
        if (wrote != aString.length) {
            throw "Failed to write whole string";
        }

        fileStream.close();
    },

    // }} ======================================================================= //

    // Prompt wrapper {{ ======================================================== //

    /**
     * window.alert alternative.
     * This method can specify the window title while window.alert can't.
     * @param {string} aTitle
     * @param {string} aMessage
     * @param {window} aWindow
     */
    alert: function (aTitle, aMessage, aWindow) {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
        prompts.alert(aWindow || window, aTitle, aMessage);
    },

    /**
     * window.confirm alternative.
     * This method can specify the window title while window.confirm can't.
     * @param {} aTitle
     * @param {} aMessage
     * @returns {}
     */
    confirm: function (aTitle, aMessage, aWindow) {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);

        return prompts.confirm(aWindow || window, aTitle, aMessage);
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
        if (result)
            nsPreferences.setBoolPref(key, check.value);

        return result;
    },

    // }} ======================================================================= //

    // Misc utils {{ ============================================================ //

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

    // }} ======================================================================= //

    // Predicatives {{ ========================================================== //

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

    // }} ======================================================================= //

    // nsI {{ =================================================================== //

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

    // }} ======================================================================= //

    // Event {{ ================================================================= //

    /**
     * stop event propagation and prevent browser default behavior
     * @param {event} aEvent event to stop
     */
    stopEventPropagation: function (aEvent) {
        aEvent.stopPropagation();
        aEvent.preventDefault();
    },

    // }} ======================================================================= //

    // Preference {{ ============================================================ //

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

    // }} ======================================================================= //

    // Localization {{ ========================================================== //

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

    // }} ======================================================================= //

    // Directory {{ ============================================================= //

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
     * Original code from liberator
     * Returns the list of files in <aDirectory>.
     * @param {nsIFile|string} aDirectory The directory to read, either a full
     *     pathname or an instance of nsIFile.
     * @param {boolean} sort Whether to sort the returned directory
     *     entries.
     * @returns {nsIFile[]}
     * @throws exception when no file found in aDirectory
     */
    readDirectory: function (aDirectory, aSort) {
        if (typeof aDirectory == "string")
            aDirectory = this.openFile(aDirectory);

        if (aDirectory.isDirectory()) {
            var entries = aDirectory.directoryEntries;
            var array = [];

            while (entries.hasMoreElements()) {
                var entry = entries.getNext();
                array.push(entry.QueryInterface(Components.interfaces.nsIFile));
            }

            if (aSort)
                array.sort(function (a, b) b.isDirectory() - a.isDirectory() ||  String.localeCompare(a.path, b.path));

            return array;
        } else {
            return [];
        }
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

    // }} ======================================================================= //

    // Charactor code {{ ======================================================== //

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

    // }} ======================================================================= //

    // Misc information {{ ====================================================== //

    /**
     * get system information service
     * @returns {}
     */
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

    // }} ======================================================================= //


    // DB {{ ==================================================================== //

    /**
     * get places db, works correctly under any version of Firefox I hope.
     * @returns {dbconnection} places db
     */
    getPlacesDB: function () {
        try {
            return Components.classes['@mozilla.org/browser/nav-history-service;1']
                .getService(Ci.nsPIPlacesDatabase).DBConnection;
        } catch (x) {
            var places = Components.classes["@mozilla.org/file/directory_service;1"].
                getService(Components.interfaces.nsIProperties).
                get("ProfD", Components.interfaces.nsIFile);
            places.append("places.sqlite");

            return Components.classes["@mozilla.org/storage/service;1"].
                getService(Components.interfaces.mozIStorageService).openDatabase(places);
        }
    },

    // }} ======================================================================= //

    // Path / URL {{ ============================================================ //

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

    /**
     * return favicon path of the page specified by <aUrl>
     * @param {string} aURL url of the page
     * @param {string} aDefault default favicon path
     * @returns {string} favicon path
     */
    getFaviconPath: function (aURL, aDefault) {
        if (!this.IOService) {
            this.IOService = Components.classes['@mozilla.org/network/io-service;1']
            .getService(Components.interfaces.nsIIOService);
        }

        var iconURL;

        try {
            var icon = PlacesUtils.favicons
                .getFaviconForPage(this.IOService.newURI(aURL, null, null));
            iconURL = icon.spec;
        } catch (x) {
            iconURL = aDefault || "chrome://mozapps/skin/places/defaultFavicon.png";
        }

        return iconURL;
    },

    getLeafNameFromURL: function (aURL) {
        return aURL.slice(aURL.lastIndexOf("/") + 1);
    },

    // }} ======================================================================= //

    // Eval / Voodoo {{ ========================================================= //

    safeEval: function (aText) {
        return Components.utils.evalInSandbox(aText, this.sandboxForSafeEval);
    },

    evalInSandbox: function (aContent, aURI) {
        var sandbox = new Components.utils.Sandbox(aURI || content.document.location.href);
        sandbox.window   = content.window;
        sandbox.document = content.document;
        return Components.utils.evalInSandbox(aContent, sandbox);
    },

    // }} ======================================================================= //

    // Network {{ =============================================================== //

    /**
     * Original code from liberator
     * Sends a synchronous HTTP request to <aUrl> and returns the
     * XMLHttpRequest object. If <aCallback> is specified the request is
     * asynchronous and the <aCallback> is invoked with the object as its
     * argument.
     * @param {string} aUrl
     * @param {boolean} aRaw
     * @param {function} aCallback
     * @returns {XMLHttpRequest}
     */
    httpGet: function (aUrl, aRaw, aCallback)
    {
        try {
            var req = new XMLHttpRequest();
            req.mozBackgroundRequest = true;

            if (aCallback) {
                req.onreadystatechange = function () {
                    if (req.readyState == 4)
                        aCallback(req);
                };
            }

            req.open("GET", aUrl, !!aCallback);
            if (aRaw)
                req.overrideMimeType('text/plain; charset=x-user-defined');
            req.send(null);

            return req;
        } catch (e) {
            this.modules.display.notify("Error opening " + aUrl + " :: " + e);

            return null;
        }
    },

    // }} ======================================================================= //

    // Thread {{ ================================================================ //

    /**
     * sleep current thread for <aWait> [msec] time.
     * from http://d.hatena.ne.jp/fls/20090224/p1
     * @param {Integer} aWait sleep time in mili-second
     */
    sleep: function (aWait) {
        var timer = {
            timeup: false
        };

        var thread = Components.classes["@mozilla.org/thread-manager;1"]
            .getService().mainThread;

        var interval = window.setInterval(function () { timer.timeup = true; }, aWait);
        while (!timer.timeup) {
            thread.processNextEvent(true);
        }
        window.clearInterval(interval);
    },

    // from liberator.js
    threadYield: function (flush, interruptable) {
        let mainThread = Components.classes["@mozilla.org/thread-manager;1"]
            .getService().mainThread;
        this.interrupted = false;

        do {
            mainThread.processNextEvent(!flush);
            if (this.interrupted)
                throw new Error("Interrupted");
        } while (flush === true && mainThread.hasPendingEvents());
    },

    // }} ======================================================================= //

    // XML {{ =================================================================== //

    /**
     * Get locale specific string from given node.
     * @param {XML} aNodes E4X type XML object
     * @returns {string} locale specific string of the <aNodes>
     */
    xmlGetLocaleString: function (aNodes) {
        if (typeof aNodes == "string")
            return aNodes;

        var length = aNodes.length();

        if (length == 0)
            return "";

        for (var i = 0; i < length; ++i) {
            if (aNodes[i].@lang.toString() == this.userLocale)
                return aNodes[i].text();
        }

        return aNodes[0].text();
    },

    // }} ======================================================================= //

    message: KeySnail.message
};
