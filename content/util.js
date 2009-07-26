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
        // ファイルインスタンス作成
        var file = this.openFile(aPath);

        if (!file.exists()) {
            throw aPath + " not found";
        }

        // テキスト読み込み用にストリームをつくる
        var fileStream = Components
            .classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
        fileStream.init(file, 1, 0, false);
        // 文字コード変換して
        var converterStream = Components
            .classes["@mozilla.org/intl/converter-input-stream;1"]
            .createInstance(Components.interfaces.nsIConverterInputStream);
        if (!aCharset) {
            aCharset = 'UTF-8';
        }
        converterStream.init(fileStream, aCharset, fileStream.available(),
                             converterStream.DEFAULT_REPLACEMENT_CHARACTER);
        // 出力
        var out = new Object();
        converterStream.readString(fileStream.available(), out);

        converterStream.close();
        fileStream.close();

        return out;
    },

    writeText: function (aString, aPath, aForce) {
        // ファイルインスタンス作成
        var file = this.openFile(aPath);

        if (file.exists() && !aForce
            && !window.confirm(aPath + this.getLocaleString("overWriteConfirmation")))
            throw "Cancelled by user";

        // テキスト読み込み用にストリームをつくる
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

    // original code by Torisugari
    // http://forums.mozillazine.org/viewtopic.php?p=921150
    // read file contained in the package (jar)
    // @return String
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

    // list all the properties of the aObject
    // @param aObject
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

    // @param aCommand
    // @return true if aCommand is usable in current situation
    isCommandUsable: function (aCommand) {
        var controller = document.commandDispatcher
            .getControllerForCommand(aCommand);
        return (controller && controller.isCommandEnabled(aCommand));
    },

    // ==================== Predicatives ====================

    // original code from Firemacs
    // http://www.mew.org/~kazu/proj/firemacs/
    isWritable: function () {
        // return this.isCommandUsable("cmd_insertText");
        // for performance reason
        var insertTextController = document.commandDispatcher
            .getControllerForCommand("cmd_insertText");

        return (insertTextController
                && insertTextController.isCommandEnabled("cmd_insertText"));
    },

    // original code from Firemacs
    // http://www.mew.org/~kazu/proj/firemacs/
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

    isCaretEnabled: function () {
        return getBrowser().docShell
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsISelectionDisplay)
            .QueryInterface(Components.interfaces.nsISelectionController)
            .getCaretEnabled();
        // return this.selectionController.getCaretEnabled();
    },

    stirngRepeat: function (s, n) {
        var s, r = '';

        while (n > 0) {
            if (n & 1)
                r += s;
            s += s;
            n >>= 1;
        }

        return r;
    },

    // ==================== ==================== //

    stopEventPropagation: function (aEvent) {
        // event の伝搬をキャンセル
        aEvent.stopPropagation();
        aEvent.preventDefault();
    },

    // original code from Firegestures
    // http://www.xuldev.org/firegestures/
    getLocaleString: function(aStringKey, aReplacements) {
        if (!this._stringBundle) {
            const kBundleURI = "chrome://keysnail/locale/keysnail.properties";
            var bundleSvc = Cc["@mozilla.org/intl/stringbundle;1"]
                .getService(Ci.nsIStringBundleService);
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

    // @return true if the directory specified aPath has any file
    //         contained in aFileNames.
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

    // original function from sage
    getSpecialDir: function (aProp) {
        var dirService = Components.classes['@mozilla.org/file/directory_service;1']
            .getService(Components.interfaces.nsIProperties);

        return dirService.get(aProp, Components.interfaces.nsILocalFile);
    },

    // original function from sage
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

    getEnv: function (aName) {
        var env = Components.classes['@mozilla.org/process/environment;1']
            .getService(Components.interfaces.nsIEnvironment);

        return env.exists(aName) ? env.get(aName) : null;
    },

    // ==================== Path / URL ====================
    // original code by SHIMODA Hiroshi
    // http://www.clear-code.com/

    // @return URL expression of aPath
    pathToURL: function (aPath) {
        var file = this.openFile(aPath);
        var ioService = Components
            .classes['@mozilla.org/network/io-service;1']
            .getService(Components.interfaces.nsIIOService);
        var url = ioService.newFileURI(file);
        var fileURL = url.spec;

        return fileURL;
    },

    // @return Local path expression of chrome URL
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

    // original code by Jfingland
    // http://forums.mozillazine.org/viewtopic.php?p=921150
    // convert chrome://hoge => /foo/bar/.../hoge
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

    // ==================== debug ====================
    print: function (aVal) {
        if (aVal != undefined) {
            this.message(aVal.toString() + " : " + aVal);
        } else {
            this.message("print: undefined");
        }
    },

    message: KeySnail.message
};
