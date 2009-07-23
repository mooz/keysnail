var ksPreference = {
    updateStatus: function () {
        var status = nsPreferences
            .getBoolPref("extensions.keysnail.keyhandler.status", false);
        var statusCheckbox = document.getElementById("keysnailStatus");
        statusCheckbox.checked = status;
    },

    updateRcFileLocation: function () {
        var location = nsPreferences
            .getLocalizedUnicharPref("extensions.keysnail.userscript.location");
        var fileField =
            document.getElementById("keysnail.preference.userscript.location");

        Application.console.log(location);

        var file = this.pathToLocalFile(location);

        fileField.file = file;
        fileField.label = file.path;
    },

    pathToLocalFile: function (aPath) {
        var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance();
        var localFile = file
            .QueryInterface(Components.interfaces.nsILocalFile);
        if (!localFile) return false;

        localFile.initWithPath(aPath);

        return localFile;
    },

    changePathClicked: function () {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);
        var location = nsPreferences
            .getLocalizedUnicharPref("extensions.keysnail.userscript.location");

        fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
        fp.displayDirectory = this.pathToLocalFile(location);

        var response = fp.show();
        if (response == nsIFilePicker.returnOK) {
            nsPreferences
                .setUnicharPref("extensions.keysnail.userscript.location", fp.file.path);
            this.updateRcFileLocation();
        }
    }
};