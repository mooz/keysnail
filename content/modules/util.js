/**
 * @fileOverview Collection of utilities
 * @name util.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var util = function () {
    /**
     * @private
     */

    const Cc = Components.classes;
    const Ci = Components.interfaces;

    let self = {
        autoCompleteController : null,

        init: function () {
            this.sandboxForSafeEval = new Components.utils.Sandbox("about:blank");
            this.userContext = {
                __proto__: modules
            };

            // ============================================================ //

            const responseType = "application/x-suggestions+json";

            let ss = Cc["@mozilla.org/browser/search-service;1"].getService(Ci.nsIBrowserSearchService);

            this.suggest = {
                ss            : ss,
                responseType  : responseType,
                getEngines    : function () { return ss.getVisibleEngines({}); },

                // partially borrowed from bookmarks.js of liberator
                ensureAliases : function (aEngines) {
                    for (let engine of aEngines)
                    {
                        if (!engine.alias)
                        {
                            let alias = engine.alias;
                            if (!alias || !/^[a-z0-9_-]+$/.test(alias))
                                alias = engine.name.replace(/^\W*([a-zA-Z_-]+).*/, "$1").toLowerCase();
                            if (!alias)
                                alias = "search";

                            let newAlias = alias;
                            for (let j = 1; j <= 10; j++)
                            {
                                if (!aEngines.some(function (item) item[0] == newAlias))
                                    break;

                                newAlias = alias + j;
                            }

                            if (engine.alias !== newAlias)
                                engine.alias = newAlias;
                        }
                    }

                    return aEngines;
                },

                filterEngines  : function (aEngines) {
                    return aEngines.filter(function (engine) engine.supportsResponseType(responseType));
                },

                getSuggestions : function (aEngine, query, callback) {
                    let queryURI;
                    let engine = aEngine;

                    if (engine && engine.supportsResponseType(responseType))
                        queryURI = engine.getSubmission(query, responseType).uri.spec;

                    if (queryURI)
                    {
                        if (callback)
                        {
                            util.requestGet(queryURI, {
                                callback: function (xhr) {
                                    let results = JSON.parse(xhr.responseText) || {1:[]};
                                    callback(results[1]);
                                }
                            });

                            return null;
                        }
                        else
                        {
                            let xhr = util.requestGet(queryURI);
                            let results = JSON.parse(xhr.responseText) || {1:[]};
                            return results[1];
                        }
                    }

                    return [];
                },

                searchWithSuggest: function (aSearchEngine, aSuggestEngines, aOpenStyle) {
                    prompt.reader(
                        {
                            message    : util.format("Search [%s]:", aSearchEngine.name),
                            group      : "web-search",
                            flags      : [0, 0],
                            style      : ["", style.prompt.url],
                            completer  : completer.fetch.suggest(aSuggestEngines, true),
                            callback   : function (query) {
                                if (query)
                                {
                                    let uri = aSearchEngine.getSubmission(query, null).uri.spec;
                                    openUILinkIn(uri, aOpenStyle || "tab");
                                }
                            }
                        }
                    );
                },

                google: function google(word, domain) {
                    domain = domain || "com";
                    const base = "http://www.google.%s/complete/search?output=toolbar&q=%s";

                    let ep  = util.format(base, domain, encodeURIComponent(word));
                    let res = util.requestGet(ep);

                    let matched = res.responseText.match("(<toplevel>.*</toplevel>)");

                    if (!matched)
                        return null;

                    let xml = util.xmlToDom(matched[1], util.XHTML);

                    return Array.slice(xml.querySelectorAll("suggestion[data]"))
                        .map(function (suggestion) suggestion.getAttribute("data"));
                }
            };
        },

        get userLocale() {
            var locale = this.getUnicharPref("general.useragent.locale");

            return {
                // ja
                "ja"        : "ja",
                "ja-JP"     : "ja",
                "ja-JP-mac" : "ja",
                "ja_JP"     : "ja",
                "JP"        : "ja",
                // en
                "en-US"     : "en"
            }[locale] || "en";
        },

        get mPrefService() {
            return Cc["@mozilla.org/preferences-service;1"]
                .getService(Ci.nsIPrefBranch);
        },

        get focusedElement() {
            return document.commandDispatcher.focusedElement;
        },

        // File IO {{ =============================================================== //

        /**
         * Open file specified by <b>aPath</b> and returns it.
         * @param {string} aPath file path to be opened
         * @returns {nsILocalFile} opened file
         */
        openFile: function (aPath) {
            var file = Cc["@mozilla.org/file/local;1"]
                .createInstance(Ci.nsILocalFile);
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
                .createInstance(Ci.nsIFileInputStream);
            fileStream.init(file, 1, 0, false);

            // Convert char-code
            var converterStream = Components
                .classes["@mozilla.org/intl/converter-input-stream;1"]
                .createInstance(Ci.nsIConverterInputStream);
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
            var ioService = Cc["@mozilla.org/network/io-service;1"]
                .getService(Ci.nsIIOService);
            var scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"]
                .getService(Ci.nsIScriptableInputStream);

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
         * Write <b>aString</b> to the local file specified by <b>aPath</b>.
         * Overwrite confirmation will be ommitted if <b>aForce</b> is true.
         * "Don't show me again" checkbox value managed by <b>aCheckID</b>.
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
                .createInstance(Ci.nsIFileOutputStream);
            fileStream.init(file, 0x02 | 0x08 | 0x20, 0644, false);

            var wrote = fileStream.write(aString, aString.length);
            if (wrote != aString.length) {
                throw "Failed to write whole string";
            }

            fileStream.close();
        },

        // }} ======================================================================= //

        // File {{ ================================================================== //

        hashFile: function (aFile, aType, aBinary) {
            let preferAscii = !aBinary;

            let istream = Cc["@mozilla.org/network/file-input-stream;1"]
                .createInstance(Ci.nsIFileInputStream);
            istream.init(aFile, 0x01, 0444, 0);

            let ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
            ch.init(aType || ch.MD5);

            const PR_UINT32_MAX = 0xffffffff;
            ch.updateFromStream(istream, PR_UINT32_MAX);

            istream.close();

            // if false is given, binary data will be returend
            let hash = ch.finish(preferAscii);

            if (!preferAscii)
            {
                // returns pair of hex code for given 1 byte
                function toHexString(charCode) ("0" + charCode.toString(16)).slice(-2);

                return [for (i of Object.keys(hash)) toHexString(hash.charCodeAt(i))].join("");
            }

            return hash;
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
            var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Ci.nsIPromptService);
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
            var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Ci.nsIPromptService);

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

            if (this.getBoolPref(key, false))
                return true;

            var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Ci.nsIPromptService);

            var check = {value: false};
            var result = prompts.confirmCheck(null,
                                              aTitle,
                                              aMessage,
                                              aCheckMessage,
                                              check);
            if (result)
                this.setBoolPref(key, check.value);

            return result;
        },

        // }} ======================================================================= //

        // Misc utils {{ ============================================================ //

        get browserWindow() {
            return Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator)
                .getMostRecentWindow("navigator:browser");
        },

        get browserDocument() {
            return this.browserWindow.document;
        },

        get gBrowser() {
            if (typeof gBrowser !== "undefined")
                return gBrowser;
            else
                return util.browserWindow.gBrowser;
        },

        getBrowserWindows:
        function getBrowserWindows() {
            let windows = [];

            const wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator);
            const enumerator = wm.getEnumerator("navigator:browser");

            while (enumerator.hasMoreElements())
                windows.push(enumerator.getNext());

            return windows;
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
         * List all properties of the object
         * @param {object} aObject target object
         */
        dir: function (obj) {
            if (!obj)
            {
                this.message("dir: undefined object passed");
            }
            else
            {
                function getV(v) {
                    try {
                        return v.toString();
                    } catch (x) {
                        return "";
                    }
                }

                let buffer = [for (kv of util.keyValues(obj)) kv];
                let max    = Math.max.apply(null, buffer.map(function ([k]) (k || "").length));
                let util   = this;
                this.message(buffer.map(function ([k, v]) k + util.repeatString(" ", max - k.length) + " : " + getV(v)).join("\n"));
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

        /**
         * check if the child is really a child node of the parent
         * @param {Node} parent a DOM node
         * @param {Node} child a DOM node
         * @returns {boolean} true if child is really a child node of
         * the parent
         */
        nodeContains: function (parent, child) {
            var node = child.parentNode;
            while (node !== null) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        },

        // }} ======================================================================= //

        // Predicatives {{ ========================================================== //

        isPlainTextEditor: function (aElement) {
            if (!aElement) return false;
            var elementName = (aElement.localName || "").toLowerCase();
            return elementName === "input" || elementName === "textarea";
        },

        /**
         * check if user can input any text in current situation
         * original code from Firemacs
         * http://www.mew.org/~kazu/proj/firemacs/
         * @param {event} aEvent keypress (or any) event with property originalTarget
         * @returns {boolean} true if text is insertable
         */
        isWritable: function (ev) {
            var localName = ev.originalTarget ? (ev.originalTarget.localName || "").toLowerCase() : "";

            // in select or option, we shold ignore the alphabet key
            if (localName === 'select' || localName === 'option')
                return true;

            var insertTextController= document.commandDispatcher
                .getControllerForCommand("cmd_insertText");

            try {
                return (insertTextController &&
                        insertTextController.isCommandEnabled("cmd_insertText"));
            } catch (x) {
                return this.isPlainTextEditor(ev.originalTarget);
            }
        },

        /**
         * check if cursor is in the autocomplete menu
         * original code from Firemacs
         * http://www.mew.org/~kazu/proj/firemacs/
         * @returns {boolean} true if cursor is in the autocomplete menu
         */
        isMenu: function () {
            var autoCompleteController =
                Cc['@mozilla.org/autocomplete/controller;1']
                .getService(Ci.nsIAutoCompleteController);

            if (autoCompleteController.matchCount !== 0)
            {
                var open = false;
                var actpps = document.getElementsByAttribute('autocompletepopup', '*');
                var len = actpps.length;
                for (var i = 0; i < len; i++)
                {
                    open = open || document.getElementById(actpps[i].getAttribute('autocompletepopup'))
                        .QueryInterface(Ci.nsIAutoCompletePopup).popupOpen;
                }
                return open;
            }
            return false;
        },

        /**
         * check if the caret is visible
         * @returns {boolean} true if caret is visible
         */
        isCaretEnabled: function () {
            try {
                return this.getSelectionController().getCaretEnabled();
            } catch (x) {
                return false;
            }
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

        /**
         * Returns selection controller, which has lot of commands like scroll.
         * @returns {nsISelectionController} selection controller
         */
        getSelectionController: function () {
            var docShell = document.commandDispatcher.focusedWindow
                .QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIWebNavigation)
                .QueryInterface(Ci.nsIDocShell);

            return docShell
                .QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsISelectionDisplay)
                .QueryInterface(Ci.nsISelectionController);
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
        // some method's are borrowed from chrome://global/content/nsUserSettings.js

        /**
         * set preference value
         */
        setPref:
        function setPref(key, value) {
            switch (typeof value)
            {
            case 'string':
                this.setUnicharPref(key, value);
                break;
            case 'number':
                this.setIntPref(key, value);
                break;
            case 'boolean':
                this.setBoolPref(key, value);
                break;
            }
        },

        /**
         * set preference value at a stroke
         * @param {object} aPrefList {key : value} pair
         */
        setPrefs:
        function setPrefs(aPrefList) {
            for (let [key, value] of util.keyValues(aPrefList))
                this.setPref(key, value);
        },

        setBoolPref: function (aPrefName, aPrefValue) {
            try
            {
                this.mPrefService.setBoolPref(aPrefName, aPrefValue);
            }
            catch (e) {}
        },

        getBoolPref: function (aPrefName, aDefVal) {
            try
            {
                return this.mPrefService.getBoolPref(aPrefName);
            }
            catch (e)
            {
                return typeof aDefVal === "undefined" ? null : aDefVal;
            }

            return null;
        },

        /**
         * set unicode string preference value
         * @param {string} aStringKey key of the preference
         * @param {string} aValue value of the preference specified by <b>aStringKey</b>
         */
        setUnicharPref: function (aPrefName, aPrefValue) {
            try
            {
                var str = Cc["@mozilla.org/supports-string;1"]
                    .createInstance(Ci.nsISupportsString);
                str.data = aPrefValue;
                this.mPrefService.setComplexValue(aPrefName,
                                                  Ci.nsISupportsString, str);
            }
            catch (e) {}
        },

        /**
         * get unicode string preference value. when localized version is available,
         * that one is used.
         * @param {string} aStringKey key of the preference
         * @returns {string} fetched preference value specified by <b>aStringKey</b>
         */
        getUnicharPref: function (aStringKey) {
            return this.getLocalizedUnicharPref(aStringKey)
                || this.copyUnicharPref(aStringKey);
        },

        copyUnicharPref: function (aPrefName, aDefVal)
        {
            try
            {
                return this.mPrefService.getComplexValue(aPrefName,
                                                         Ci.nsISupportsString).data;
            }
            catch (e)
            {
                return typeof aDefVal === "undefined" ? null : aDefVal;
            }
            return null;        // quiet warnings
        },

        setIntPref: function (aPrefName, aPrefValue)
        {
            try
            {
                this.mPrefService.setIntPref(aPrefName, aPrefValue);
            }
            catch (e) {}
        },

        getIntPref: function (aPrefName, aDefVal)
        {
            try
            {
                return this.mPrefService.getIntPref(aPrefName);
            }
            catch (e)
            {
                return typeof aDefVal === "undefined" ? null : aDefVal;
            }

            return null;        // quiet warnings
        },

        getLocalizedUnicharPref: function (aPrefName, aDefVal)
        {
            try
            {
                return this.mPrefService.getComplexValue(aPrefName,
                                                         Ci.nsIPrefLocalizedString).data;
            }
            catch (e)
            {
                return typeof aDefVal === "undefined" ? null : aDefVal;
            }

            return null;        // quiet warnings
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
            if (!this._stringBundle)
            {
                const kBundleURI = "chrome://keysnail/locale/keysnail.properties";
                var bundleSvc = Cc["@mozilla.org/intl/stringbundle;1"]
                    .getService(Ci.nsIStringBundleService);
                this._stringBundle = bundleSvc.createBundle(kBundleURI);
            }

            try
            {
                if (!aReplacements)
                    return this._stringBundle.GetStringFromName(aStringKey);
                else
                    return this._stringBundle
                    .formatStringFromName(aStringKey, aReplacements, aReplacements.length);
            }
            catch (e)
            {
                return aStringKey;
            }
        },

        // }} ======================================================================= //

        // Directory {{ ============================================================= //

        changeDirectory: function (path) {
            let dest;

            if (path === "-")
            {
                if (!share.oldpwd)
                    share.oldpwd = share.pwd;
                dest = share.oldpwd;
            }
            else
                dest = completer.utils.normalizePath(path);

            let dir = util.openFile(dest);
            if (!dir)
            {
                display.echoStatusBar("Failed to change current directory");
                return;
            }

            if (!dir.exists())
            {
                display.echoStatusBar("No such directory " + dest);
                return;
            }

            if (!dir.isDirectory())
            {
                display.echoStatusBar(dest + " is not a directory");
                return;
            }

            share.oldpwd = share.pwd;
            share.pwd    = dir.path;

            return dir;
        },

        /**
         * check if the directory has certain files
         * @param {string} aPath
         * @param {[string]} aFileNames
         * @returns {boolean} true if the directory specified <b>aPath</b> has any file contained in <b>aFileNames</b>.
         */
        isDirHasFiles: function (aPath, aFileNames) {
            return aFileNames.some(function (name) {
                let file = util.openFile(aPath);
                file.append(name);
                return file.exists();
            });
        },

        /**
         * Original code by liberator
         * Returns the list of files in <b>aDirectory</b>.
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

            if (aDirectory.isDirectory())
            {
                var entries = aDirectory.directoryEntries;
                var array = [];

                while (entries.hasMoreElements())
                {
                    var entry = entries.getNext();
                    array.push(entry.QueryInterface(Ci.nsIFile));
                }

                if (aSort)
                    array.sort(function (a, b) b.isDirectory() - a.isDirectory() ||  String.localeCompare(a.path, b.path));

                return array;
            }
            else
            {
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
            var dirService = Cc['@mozilla.org/file/directory_service;1']
                .getService(Ci.nsIProperties);

            return dirService.get(aProp, Ci.nsILocalFile);
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
            var UConvIF  = Ci.nsIScriptableUnicodeConverter;
            var UConv = Cc[UConvID].getService(UConvIF);

            var tmpString = "";
            try {
                UConv.charset = aCharCode;
                tmpString = UConv.ConvertFromUnicode(aString);
            } catch (e) {
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
            return Cc['@mozilla.org/system-info;1'].
                getService(Ci.nsIPropertyBag2);
        },

        /**
         * get system environment value
         * @param {string} aName name of the environment value
         * @returns {string} environment value or null when not found
         */
        getEnv: function (aName) {
            var env = Cc['@mozilla.org/process/environment;1']
                .getService(Ci.nsIEnvironment);

            return env.exists(aName) ? env.get(aName) : null;
        },

        // }} ======================================================================= //


        // DB {{ ==================================================================== //

        /**
         * get places db, works correctly under any version of Firefox I hope.
         * @returns {dbconnection} places db
         */
        getPlacesDB: function () {
            try
            {
                return Cc['@mozilla.org/browser/nav-history-service;1']
                    .getService(Ci.nsPIPlacesDatabase).DBConnection;
            }
            catch (x)
            {
                var places = Cc["@mozilla.org/file/directory_service;1"].
                    getService(Ci.nsIProperties).
                    get("ProfD", Ci.nsIFile);
                places.append("places.sqlite");

                return Cc["@mozilla.org/storage/service;1"].
                    getService(Ci.mozIStorageService).openDatabase(places);
            }
        },

        // }} ======================================================================= //

        // Path / URL {{ ============================================================ //

        createDirectory: function (aLocalFile) {
            if (aLocalFile.exists() && !aLocalFile.isDirectory())
                aLocalFile.remove(false);

            if (!aLocalFile.exists())
                aLocalFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);

            return aLocalFile;
        },

        getExtensionLocalDirectoryRoot: function () {
            const extName = "keysnail";

            var extDir  = this.getSpecialDir("ProfD");
            extDir.append(extName);

            return this.createDirectory(extDir);
        },

        getExtensionLocalDirectory: function (aDirName) {
            var localDir = this.getExtensionLocalDirectoryRoot();
            localDir.append(aDirName);

            return this.createDirectory(localDir);
        },

        /**
         * convert local file path to the URL expression
         * @param {string} aPath local file path
         * @returns {string} URL expression of aPath
         */
        pathToURL: function (aPath) {
            var file = this.openFile(aPath);
            var ioService = Components
                .classes['@mozilla.org/network/io-service;1']
                .getService(Ci.nsIIOService);
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
                .getService(Ci.nsIIOService);
            var fileHandler = ioService.getProtocolHandler('file')
                .QueryInterface(Ci.nsIFileProtocolHandler);
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
            var ios = Cc['@mozilla.org/network/io-service;1']
                .getService(Ci["nsIIOService"]);
            var uri = ios.newURI(aUrl, "UTF-8", null);
            var cr = Cc['@mozilla.org/chrome/chrome-registry;1']
                .getService(Ci["nsIChromeRegistry"]);
            rv = cr.convertChromeURL(uri).spec;

            if (/^file:/.test(rv))
                rv = this.urlToPath(rv);
            else
                rv = this.urlToPath("file://"+rv);

            return rv;
        },

        /**
         * return favicon path of the page specified by <b>aUrl</b>
         * @param {string} aURL url of the page
         * @param {string} aDefault default favicon path
         * @returns {string} favicon path
         */
        getFaviconPath: function (aURL, aDefault) {
            if (!this.IOService)
            {
                this.IOService = Cc['@mozilla.org/network/io-service;1']
                    .getService(Ci.nsIIOService);
            }

            var iconURL;

            try
            {
                var blocking = true;
                var icon;
                PlacesUtils.favicons
                    .getFaviconURLForPage(this.IOService.newURI(aURL, null, null), {
                        onComplete: function(aURI, aDataLen, aData, aMimeType) {
                            icon = aURI;
                            blocking = false;
                        }
                    });
                var thread = Cc["@mozilla.org/thread-manager;1"].getService().mainThread;
                while (blocking)
                    thread.processNextEvent(true);
                iconURL = icon.spec;
            }
            catch (x)
            {
                iconURL = aDefault || "chrome://mozapps/skin/places/defaultFavicon.png";
            }

            return iconURL;
        },

        /**
         * Get leaf name from URL path.
         * @param {string} aURL a URL.
         * @returns {string} leaf name
         */
        getLeafNameFromURL: function (aURL) {
            return aURL.slice(aURL.lastIndexOf("/") + 1);
        },

        // }} ======================================================================= //

        // Eval / Voodoo {{ ========================================================= //

        // Inspired by liberator.js
        evalInContext: function (aCode, aContext) {
            const EVAL_ERROR  = "__ks_eval_error";
            const EVAL_RESULT = "__ks_eval_result";
            const EVAL_STRING = "__ks_eval_string";

            try
            {
                if (!aContext)
                    aContext = this.userContext;

                aContext[EVAL_ERROR]  = null;
                aContext[EVAL_STRING] = aCode;
                aContext[EVAL_RESULT] = null;

                userscript.loadSubScript("chrome://keysnail/content/eval.js", aContext);

                if (aContext[EVAL_ERROR])
                    throw aContext[EVAL_ERROR];

                return aContext[EVAL_RESULT];
            }
            finally
            {
                delete aContext[EVAL_ERROR];
                delete aContext[EVAL_RESULT];
                delete aContext[EVAL_STRING];
            }
        },

        /**
         * Eval in sandbox. This method is useful to parse JSON object.
         * @param {} aText
         * @returns {object} result of evaluation
         */
        safeEval: function (aText, aOptions) {
            aOptions = aOptions || {};
            return Components.utils.evalInSandbox(aText,
                                                  this.sandboxForSafeEval,
                                                  aOptions.version    || "1.8",
                                                  aOptions.fileName   || "",
                                                  aOptions.lineNumber || 0);
        },

        /**
         * Eval in sandbox
         * @param {} aContent
         * @param {} aURI
         * @returns {}
         */
        evalInSandbox: function (aContent, aURI) {
            var sandbox = new Components.utils.Sandbox(aURI || content.document.location.href);
            sandbox.window   = content.window;
            sandbox.document = content.document;
            return Components.utils.evalInSandbox(aContent, sandbox);
        },

        // }} ======================================================================= //

        // XPath {{ ================================================================= //

        // http://piro.sakura.ne.jp/xul/tips/x0032.html
        getNodesFromXPath: function (aXPath, aContextNode) {
            const XULNS   = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
            const XHTMLNS = 'http://www.w3.org/1999/xhtml';
            const XLinkNS = 'http://www.w3.org/1999/xlink';

            const xmlDoc   = aContextNode ? aContextNode.ownerDocument || aContextNode :
                util.focusedElement.ownerDocument.ownerDocument;
            const context  = aContextNode || xmlDoc.documentElement;
            const type     = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;

            const resolver = {
                lookupNamespaceURI: function (prefix) {
                    switch (prefix) {
                    case 'xul':
                        return XULNS;
                    case 'html':
                    case 'xhtml':
                        return XHTMLNS;
                    case 'xlink':
                        return XLinkNS;
                    default:
                        return '';
                    }
                }
            };

            try {
                return xmlDoc.evaluate(aXPath, context, resolver, type, null);
            } catch (x) {
                util.error(x, "util.getNodesFromXPath");
                return {
                    snapshotLength : 0,
                    snapshotItem   : function () {
                        return null;
                    }
                };
            }

            return result;
        },

        // }} ======================================================================= //

        // Network {{ =============================================================== //

        paramsToString:
        function paramsToString(prm) {
            let pt = typeof prm;

            if (prm && pt === "object")
                prm = [for (k of util.keyValues(prm)) k + "=" + v].join("&");
            else if (pt !== "string")
                prm = "";

            return prm;
        },

        request:
        function request(method, url, opts) {
            opts = opts || {};

            let { callback, params, timeout } = opts;

            // synchronous (not block UI)
            let block = typeof callback !== "function";

            if (block) {
                var thread = Cc["@mozilla.org/thread-manager;1"].getService().mainThread;
                var blocking = true;
            }

            let req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
            req.QueryInterface(Ci.nsIXMLHttpRequest);

            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    if (block) {
                        blocking = false;
                    } else {
                        callback(req);
                    }
                }
            };

            let timer = null;
            if (typeof timeout === "number") {
                timer = setTimeout(function () {
                    timer = null;
                    req.abort();
                    blocking = false;
                }, timeout);
            }

            req.open(method, url, true, opts.username, opts.password);

            if (opts.mimeType)
                req.overrideMimeType(opts.mimeType);

            for (let [name, value] of util.keyValue(opts.header || {}))
                req.setRequestHeader(name, value);

            req.send(util.paramsToString(params) || null);

            if (block) {
                while (blocking)
                    thread.processNextEvent(true);
            }

            if (timer)
                clearTimeout(timer);

            return req;
        },

        requestGet:
        function (url, opts) {
            opts = opts || {};

            if (opts.params) {
                opts.params = util.paramsToString(opts.params);
                url += "?" + opts.params;
            }

            return util.request("GET", url, opts);
        },

        requestPost:
        function (url, opts) {
            opts = opts || {};

            if (opts.params) {
                opts.params = util.paramsToString(opts.params);
                url += "?" + opts.params;
            }

            opts.header = opts.header || {};
            opts.header["Content-type"] = "application/x-www-form-urlencoded";
            opts.header["Content-length"] = opts.params.length;
            opts.header["Connection"] = "close";

            return util.request("POST", url, opts);
        },

        /**
         * @deprecated Use util.requestGet() instead
         * Original code by liberator
         * Sends a synchronous HTTP request to <b>aUrl</b> and returns the
         * XMLHttpRequest object. If <b>aCallback</b> is specified the request is
         * asynchronous and the <b>aCallback</b> is invoked with the object as its
         * argument.
         * @param {string} aUrl
         * @param {boolean} aRaw
         * @param {function} aCallback
         * @returns {XMLHttpRequest}
         */
        httpGet: function (aUrl, aRaw, aCallback, aTimeOut) {
            try
            {
                let req = new XMLHttpRequest();
                req.mozBackgroundRequest = true;
                let timer;
                let async = typeof aCallback === "function";

                let self = this;

                if (typeof aTimeOut === "number")
                {
                    timer = setTimeout(function () {
                                           self.message("Aborted");
                                           req.abort();
                                       }, aTimeOut);
                }

                if (async)
                {
                    req.onreadystatechange = function () {
                        if (req.readyState == 4)
                        {
                            if (timer)
                                clearTimeout(timer);
                            aCallback(req);
                        }
                    };
                }

                req.open("GET", aUrl, async);
                if (aRaw)
                    req.overrideMimeType('text/plain; charset=x-user-defined');
                req.send(null);

                if (timer && !async)
                    clearTimeout(timer);

                return req;
            }
            catch (e)
            {
                self.message("Error opening " + aUrl + " :: " + e);

                return null;
            }
        },

        /**
         * @deprecated Use util.requestPost() instead
         * @param {} aUrl
         * @param {} aRaw
         * @param {} aCallback
         * @param {} aTimeOut
         * @returns {}
         */
        httpPost: function (url, params, callback) {
            let xhr = new XMLHttpRequest();

            switch (typeof params)
            {
            case "string":
                // nothing
                break;
            case "object":
                params = [for (kv of util.keyValues(params)) kv[0] + "=" + kv[1]].join("&");
                break;
            default:
                params = "";
                break;
            }

            let async = typeof callback === "function";

            if (async)
            {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4)
                        callback(xhr);
                };
            }

            xhr.open("POST", url, async);

            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Content-length", params.length);
            xhr.setRequestHeader("Connection", "close");

            xhr.send(params);

            return xhr;
        },

        // }} ======================================================================= //

        // Thread {{ ================================================================ //

        /**
         * sleep current thread for <b>aWait</b> [msec] time.
         * from http://d.hatena.ne.jp/fls/20090224/p1
         * @param {Integer} aWait sleep time in mili-second
         */
        sleep: function (aWait) {
            var timer = {
                timeup: false
            };

            var thread = Cc["@mozilla.org/thread-manager;1"]
                .getService().mainThread;

            var interval = window.setInterval(function () { timer.timeup = true; }, aWait);
            while (!timer.timeup)
            {
                thread.processNextEvent(true);
            }
            window.clearInterval(interval);
        },

        // }} ======================================================================= //

        // XML {{ =================================================================== //

        get XHTML() {
            return "http://www.w3.org/1999/xhtml";
        },

        get XUL() {
            return "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        },

        // Original code by piro (http://d.hatena.ne.jp/teramako/20081113/p1#c1226602807)
        /**
         * Convert E4X to DOM object
         * @param {} xml
         * @param {} xmlns
         * @returns {}
         */
        xmlToDom: function (xmlString, xmlns, doc) {
            if (!xmlns)
                xmlns = this.XUL;

            if (typeof xmlString === "xml")
                xmlString = xmlString.toXMLString();

            doc = doc || document;

            var docElem = (new DOMParser).parseFromString(
                '<root xmlns="' + xmlns + '">' + xmlString + "</root>", "application/xml"
            ).documentElement;
            var imported = document.importNode(docElem, true);
            var range = document.createRange();
            range.selectNodeContents(imported);
            var fragment = range.extractContents();
            range.detach();
            return fragment.childNodes.length > 1 ? fragment : fragment.firstChild;
        },

        // }} ======================================================================= //

        // Bookmarks / Places {{ ==================================================== //

        filterBookmarks: function (aItemId, aFilter, aContainer)
        {
            var parentNode = PlacesUtils.getFolderContents(aItemId).root;

            if (!aContainer)
                aContainer = [];

            for (var i = 0; i < parentNode.childCount; i++)
            {
                var childNode = parentNode.getChild(i);

                if (PlacesUtils.nodeIsBookmark(childNode))
                {
                    let item = aFilter(childNode, parentNode);
                    if (item)
                        aContainer.push(item);
                }
                else if (PlacesUtils.nodeIsFolder(childNode))
                {
                    arguments.callee(childNode.itemId, aFilter, aContainer);
                }
            }

            return aContainer;
        },

        // }} ======================================================================= //

        // Suggestion {{ ============================================================ //

        suggest: null,

        // }} ======================================================================= //

        // Misc {{ ================================================================== //

        // http://subtech.g.hatena.ne.jp/cho45/20090513/1242199703
        toUnicodeExpression: function (re) {
            return re.replace(/[\s\S]/g, function (c) {
                return '\\u' + (0x10000 + c.charCodeAt(0)).toString(16).slice(1);
            });
        },

        getAllPropertyNames: function (obj) {
            let wrapped = obj.wrappedJSObject;

            if (wrapped)
                obj = wrapped;

            try
            {
                if ("getOwnPropertyNames" in Object) {
                    let encountered = { __proto__ : null };

                    for (let k of Object.getOwnPropertyNames(obj))
                        try {
                            encountered[k] = true;
                            yield k;
                        } catch (_) {}

                    for (let k in obj)
                        try {
                            if (!(k in encountered))
                                yield k;
                        } catch (_) {}
                } else {
                    for (let k in obj)
                        try {
                            yield k;
                        } catch (_) {}
                }
            }
            catch (x)
            {
                return;
            }

            if (wrapped)
                yield "wrappedJSObject";
        },

        sortMultiple: function ([a], [b]) { return (a < b) ? -1 : (a > b) ? 1 : 0; },

        find: function (array, pred) {
            for (let [i, v] of util.keyValues(array)) {
                if (pred(v, i))
                    return v;
            }
            return undefined;
        },

        findAll: function (array, pred) {
            let res = [];

            for (let [i, v] of util.keyValues(array)) {
                if (pred(v, i))
                  res.push(v);
            }

            return res.length ? res : null;
        },

        // callback is a function (err, topic, data) which will be
        // called when process finished successfully or failed
        launchProcess: function (exeFile, args, callback) {
            if (!args) args = [];

            if (typeof exeFile === "string") {
                exeFile = util.openFile(exeFile);
            }
            if (!(exeFile instanceof Ci.nsIFile) ||
                !exeFile.exists()) {
                throw exeFile + " is no a valid exe file";
            }

            var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
            process.init(exeFile);

            if (typeof callback === "function") {
                // handler waits for process termination
                process.runAsync(args, args.length, function (subject, topic, data) {
                    switch (topic) {
                    case "process-finished":
                        callback(null, topic, data);
                        break;
                    case "process-failed":
                        callback(new Error("Process failed"), subject, data);
                        break;
                    default:
                    }
                });
            } else {
                // launch and run
                process.run(false, args, args.length);
            }
            return process;
        },

        // }} ======================================================================= //

        // Range / Iterator {{ ====================================================== //

        range:
        function range(from, to, step) {
            step = Math.max(step || 0, 1);
            for (let i = from; i < to; i += step) yield i;
        },

        interruptibleRange:
        function interruptibleRange(from, to, step) {
            let range = this.range(from, to, step);
            this.rangeInterrupted = false;

            for (let i in range)
            {
                if (this.rangeInterrupted)
                {
                    this.message("Interrupted");
                    return;
                }
                yield i;
            }
        },

        coro:
        function coro(process) {
            var g = process(function resume(v) { g.send(v); }, g);
            g.next();
        },

        keyValues:
        function keyValues(obj) {
            for (let k of Object.keys(obj)) {
                yield [k, obj[k]];
            }
        },

        values:
        function values(obj) {
            for (let k of Object.keys(obj)) {
                yield obj[k];
            }
        },

        // }} ======================================================================= //

        // String {{ ================================================================ //

        repeatString: function (str, len) {
            return [for (i of this.range(0, len)) str].join("");
        },

        createSeparator: function (label) {
            var separator = [];
            const SEPARATOR_LENGTH = 74;

            separator.push("// ");

            if (label)
            {
                var hunkLen = Math.round((SEPARATOR_LENGTH - label.length) / 2) - 1;

                separator.push(new Array(hunkLen).join("="));
                separator.push(" " + label + " ");
                separator.push(new Array(hunkLen + (label.length % 2 == 0 ? 1 : 0)).join("="));
            }
            else
            {
                separator.push(new Array(SEPARATOR_LENGTH).join("="));
            }

            separator.push(" //");

            return separator.join("");
        },

        getTypeName: function (object) {
            return Object.prototype.toString.call(object);
        },

        /**
         * String => 'String'
         * @param {string} aStr
         * @returns {string}
         */
        toStringForm: function (aStr) {
            return (typeof aStr === "string") ? "'" + aStr.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'" : "''"; // '
        },

        // }} ======================================================================= //

        format  : KeySnail.format,
        message : KeySnail.message,
        error   : KeySnail.error
    };

    return self;
}();
