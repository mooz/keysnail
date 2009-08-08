var ksPreference = {
    initFileKey: "extensions.keysnail.userscript.location",
    editorKey: "extensions.keysnail.userscript.editor",

    updateFileField: function (aPrefKey, aID) {
        var location = nsPreferences.getLocalizedUnicharPref(aPrefKey)
            || nsPreferences.copyUnicharPref(aPrefKey);
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
            var initFileLocation = nsPreferences
                .getLocalizedUnicharPref(this.initFileKey)
                || nsPreferences
                .copyUnicharPref(this.initFileKey);

            fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
            fp.displayDirectory = this.openFile(initFileLocation);
            prefKey = this.initFileKey;
            break;
        case 'EDITOR':
            fp.init(window, "Select Editor", nsIFilePicker.modeOpen);
            fp.appendFilters(Components.interfaces.nsIFilePicker.filterApps);
            prefKey = this.editorKey;
            break;
        }

        response = fp.show();
        if (response == nsIFilePicker.returnOK) {
            nsPreferences
                .setUnicharPref(prefKey, fp.file.path);
            this.updateAllFileFields();
        }
    }
};

