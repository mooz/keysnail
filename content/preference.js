var ksPreference = {
    updateRcFileLocation: function () {
        var location = nsPreferences
            .getLocalizedUnicharPref("extensions.keysnail.userscript.location")
            || nsPreferences
            .copyUnicharPref("extensions.keysnail.userscript.location");
        var fileField =
            document.getElementById("keysnail.preference.userscript.location");

        Application.console.log(location);

        var file = this.openFile(location);

        if (file) {
            fileField.file = file;
            fileField.label = file.path;
        } else {
            fileField.file = null;
            fileField.label = "No path specified";
        }
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

    changePathClicked: function () {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);
        var location = nsPreferences
            .getLocalizedUnicharPref("extensions.keysnail.userscript.location");

        fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
        fp.displayDirectory = this.openFile(location);

        var response = fp.show();
        if (response == nsIFilePicker.returnOK) {
            nsPreferences
                .setUnicharPref("extensions.keysnail.userscript.location", fp.file.path);
            this.updateRcFileLocation();
        }
    }
};