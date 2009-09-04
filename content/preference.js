/**
 * @fileOverview
 * @name preference.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var ksPreference = {
    initFileKey: "extensions.keysnail.userscript.location",
    editorKey: "extensions.keysnail.userscript.editor",

    onLoad: function () {
        if (!this.modules.util.getUnicharPref(this.editorKey)) {
            this.modules.userscript.syncEditorWithGM();
        }
        this.updateAllFileFields();
    },

    updateFileField: function (aPrefKey, aID) {
        var location = this.modules.util.getUnicharPref(aPrefKey);
        var fileField = document.getElementById(aID);

        var file = this.openFile(location);
        if (file) {
            fileField.file = file;
            fileField.label = file.path;
        } else {
            fileField.file = null;
            fileField.label = "No path specified";
        }
    },

    updateAllFileFields: function () {
        this.updateFileField(this.initFileKey, "keysnail.preference.userscript.location");
        this.updateFileField(this.editorKey, "keysnail.preference.userscript.editor");
    },

    openFile: function (aPath) {
        var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance();
        var localFile = file
            .QueryInterface(Components.interfaces.nsILocalFile);

        try {
            localFile.initWithPath(aPath);
        } catch (e) {
            return null;
        }

        return localFile;
    },

    changePathClicked: function (aType) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);
        var response;
        var prefKey;

        switch (aType) {
        case 'INITFILE':
            var initFileLocation = nsPreferences.getLocalizedUnicharPref(this.initFileKey)
                || nsPreferences.copyUnicharPref(this.initFileKey);

            fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
            fp.displayDirectory = this.openFile(initFileLocation);
            prefKey = this.initFileKey;
            break;
        case 'EDITOR':
            fp.init(window, "Select Editor", nsIFilePicker.modeOpen);
            fp.appendFilters(Components.interfaces.nsIFilePicker.filterApps);
            fp.appendFilters(nsIFilePicker.filterAll);
            prefKey = this.editorKey;
            break;
        }

        response = fp.show();
        if (response != nsIFilePicker.returnOK)
            return;

        switch (aType) {
        case 'INITFILE':
            with (this.modules) {
                if (!util.isDirHasFiles(fp.file.path,
                                        userscript.directoryDelimiter,
                                        userscript.defaultInitFileNames)) {
                    // directory has no rc file.
                    util.alert(window, "keysnail:dialog",
                               util.getLocaleString("selectDirectoryContainsInitFile", [fp.file.path]));
                    return;
                }
            }
            nsPreferences.setUnicharPref(prefKey, fp.file.path);
            this.updateFileField(this.initFileKey, "keysnail.preference.userscript.location");
            break;
        case 'EDITOR':
            if (!fp.file.exists() || !fp.file.isExecutable()) {
                alert("Please select the valid editor");
                return;
            }
            Application.console.log("fp.file.path : " + fp.file.path);
            nsPreferences.setUnicharPref(prefKey, fp.file.path);
            var editorPath = this.modules.util
                .getUnicharPref("extensions.keysnail.userscript.editor");
            Application.console.log("getUnicharPref : " + editorPath);
            this.updateFileField(this.editorKey, "keysnail.preference.userscript.editor");                
            break;
        }
    }
};

(function () {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);
     var browserWindow = wm.getMostRecentWindow("navigator:browser");
     ksPreference.modules = browserWindow.KeySnail.modules;
 })();
