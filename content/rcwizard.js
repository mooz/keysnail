var rcWizard = {
    util: null,

    prefDirectory: null,
    configFileNames: null,
    directoryDelimiter: null,

    rcFilePath: null,
    rcFileObject: null,

    onLoad: function () {
        // to access the utility
        this.util = window.arguments[0].inn.util;

        this.prefDirectory = window.arguments[0].inn.prefDirectory;
        this.configFileNames = window.arguments[0].inn.configFileNames;
        this.directoryDelimiter = window.arguments[0].inn.directoryDelimiter;

        this.rcFilePath = this.prefDirectory;
        this.rcFileObject = this.pathToLocalFile(this.prefDirectory);
    },

    selectMethod: function () {
        var menuList
            = document.getElementById("keysnail-rcwizard-selectmethod");
        var startPage
            = document.getElementById("keysnail-rcwizard-startpage");

        switch (menuList.selectedIndex) {
        case 0:
            startPage.next = "create-rcfile";
            break;
        case 1:
            startPage.next = "select-rcfile";
            break;
        }

        return true;
    },

    updatePageCreate: function () {
        var fileField = document.getElementById("keysnail-userscript-destination");

        // Note: 順番を逆にするとラベルが表示されない
        fileField.file = this.rcFileObject;
        fileField.label = this.rcFilePath;
    },

    updatePageSelect: function () {
        var fileField = document.getElementById("keysnail-userscript-place");

        fileField.file = this.rcFileObject;
        fileField.label = this.rcFilePath;
    },

    // ==================== util ==================== //

    pathToLocalFile: function (aPath) {
        var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance();
        var localFile = file
            .QueryInterface(Components.interfaces.nsILocalFile);
        if (!localFile) return false;

        localFile.initWithPath(aPath);

        return localFile;
    },

    changePathClicked: function (aUpdateFunction) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);

        fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
        // set default directory
        fp.displayDirectory = this.pathToLocalFile(this.prefDirectory);

        var response = fp.show();
        if (response == nsIFilePicker.returnOK) {
            this.rcFileObject = fp.file;
            this.rcFilePath = fp.file.path;
            // aUpdateFunction() does not works well
            // because the 'this' value becomes 'button' widget
            aUpdateFunction.apply(rcWizard);
        }
    },

    // ==================== termination ==================== //

    onFinish: function () {
        if (!this.rcFilePath || !this.rcFileObject) {
            return false;
        }

        var selectedMethod = document.getElementById("keysnail-rcwizard-startpage").next;

        if (selectedMethod == "select-rcfile"
            && !this.util.isDirHasFiles(this.rcFilePath,
                                        this.directoryDelimiter,
                                        this.configFileNames)) {
            // directory has no rc file.
            this.util.alert(window, "KeySnail",
                            this.util.getLocaleString("noUserScriptFound",
                                                      [this.rcFilePath]));
            return false;
        }

        // 変更した引数を返す
        window.arguments[0].out = {};

        window.arguments[0].out.rcFilePath
            = this.rcFilePath;

        window.arguments[0].out.configFileNameIndex
            = document.getElementById("keysnail-userscript-filename-candidates")
            .selectedIndex;

        window.arguments[0].out.selectedMethod = selectedMethod;

        return true;
    },

    onCancel: function () {
        // ユーザが cancel をクリックした時は、window.arguments[0].out は null のまま
        // window.arguments[0].out is null

        return true;
    }
};
