var rcWizard = {
    modules: null,

    prefDirectory: null,
    defaultInitFileNames: null,
    directoryDelimiter: null,

    rcFilePath: null,
    rcFileObject: null,

    onLoad: function () {
        // to access the utility
        this.modules = window.arguments[0].inn.modules;

        this.prefDirectory = this.modules.userscript.prefDirectory;
        this.defaultInitFileNames = this.modules.userscript.defaultInitFileNames;
        this.directoryDelimiter = this.modules.userscript.directoryDelimiter;

        this.rcFilePath = this.prefDirectory;
        this.rcFileObject = this.modules.util.openFile(this.prefDirectory);

        window.document.documentElement.setAttribute("windowtype", window.name);
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
        fp.displayDirectory = this.modules.util.openFile(this.prefDirectory);

        var response = fp.show();
        if (response == nsIFilePicker.returnOK) {
            if (aUpdateFunction == this.updatePageSelect &&
                !this.modules.util.isDirHasFiles(fp.file.path,
                                                 this.directoryDelimiter,
                                                 this.defaultInitFileNames)) {
                // directory has no rc file.
                this.modules.util.alert(window, "KeySnail",
                                        this.modules.util.getLocaleString("noUserScriptFound",
                                                                          [fp.file.path]));
                return;
            }

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

        // return changed arguments
        window.arguments[0].out = {};

        window.arguments[0].out.rcFilePath = this.rcFilePath;

        window.arguments[0].out.configFileNameIndex
            = document.getElementById("keysnail-userscript-filename-candidates").selectedIndex;

        window.arguments[0].out.selectedMethod = selectedMethod;

        // set special keys
        window.arguments[0].keys = {};

        return true;
    },

    onCancel: function () {
        // When user clicked "cancel" button, window.arguments[0].out is left to null.
        window.arguments[0].out = null;

        return true;
    }
};

var keyCustomizer = {
    prefPrefix: 'keysnail-userscript-key-',
    keys: ['quit',
           'help',
           'escape',
           'macroStart',
           'macroEnd'],

    initPane: function () {
        var self = this;
        this.KEYS.forEach(function (aKey) {
                              let k = document.getElementById(self.prefPrefix + aKey);
                              k.keyData = parseShortcut(k.value);
                              self.keys[aKey] = k;
                          });
    },

    set: function (aNode) {
        let keyData = {};

        window.openDialog(
            'chrome://keysnail/content/keyDetector.xul',
            '_blank',
            'chrome,modal,resizable=no,titlebar=no,centerscreen',
            keyData,
            keyCustomizer.modules.util.getLocaleString('setKey'),
            keyCustomizer.modules.util.getLocaleString('cancel')
        );

        if (keyData.modified) {
            aNode.value = keyData.string;
            var event = document.createEvent('UIEvents');
            event.initUIEvent('input', true, false, window, 0);
            aNode.dispatchEvent(event);
        }
    },

    clear: function (aNode) {
        aNode.value = '';
        aNode.keyData = parseShortcut(aNode.value);
        aNode.keyData.modified = true;

        fireInputEvent(aNode);
    }
};

function fireInputEvent(aNode)
{
    var event = document.createEvent('UIEvents');
    event.initUIEvent('input', true, false, window, 0);
    aNode.dispatchEvent(event);
}

(function () {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);
     var browserWindow = wm.getMostRecentWindow("navigator:browser");
     rcWizard.modules = keyCustomizer.modules = browserWindow.KeySnail.modules;
 })();
