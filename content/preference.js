/**
 * @fileOverview
 * @name preference.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var ksPreference = {
    initFileKey: "extensions.keysnail.userscript.location",
    editorKey: "extensions.keysnail.userscript.editor",

    keybindTextarea: null,

    onGeneralPaneLoad: function () {
        if (!this.modules.util.getUnicharPref(this.editorKey)) {
            this.modules.userscript.syncEditorWithGM();
        }
        this.updateAllFileFields();
    },

    onKeyPaneLoad: function () {
        ksKeybindTreeView.init();
        // init special key
        keyCustomizer.initPane();
        document.getElementById("keybind-tree").view = ksKeybindTreeView;
        this.keybindTextarea = document.getElementById("keybind-textarea");
    },

    handleTreeEvent: function (aEvent) {
        aEvent.preventDefault();
        switch (aEvent.type) {
        case "dblclick":
            if (aEvent.target.localName == "treechildren")
                this.doCommand("cmd_edit_gesture");
            break;
        case "keypress":
            switch (aEvent.keyCode) {
            case aEvent.DOM_VK_RETURN: 
                break;
            case aEvent.DOM_VK_DELETE: 
                break;
            default: return;
            }
            break;
        }
    },

    handleKeyBindTextareaEvent: function (aEvent) {
        if (aEvent.type == "keypress") {
            var row = ksKeybindTreeView._data[ksKeybindTreeView.currentIndex];
            aEvent.preventDefault();

            if (aEvent.keyCode == aEvent.DOM_VK_BACK_SPACE) {
                if (row[KS_KEY_STRING]) {
                    var tmp = row[KS_KEY_STRING].split(' ');
                    tmp.pop();
                    var after = tmp.join(' ');
                    this.keybindTextarea.value = after;
                    row[KS_KEY_STRING] = after;
                    ksKeybindTreeView.update();
                }
                return;
            }

            var key = this.modules.key.keyEventToString(aEvent);
            row[KS_KEY_STRING] += ((row[KS_KEY_STRING] ? " " : "") + key);
            this.keybindTextarea.value = row[KS_KEY_STRING];

            ksKeybindTreeView.update();
        }
    },

    updateTreeView: function () {
        var index = ksKeybindTreeView.currentIndex;
        this.keybindTextarea.value = ksKeybindTreeView._data[index][KS_KEY_STRING];
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
            fileField.label = " Not specified ";
        }
    },

    updateAllFileFields: function () {
        this.updateFileField(this.initFileKey, "keysnail.preference.userscript.location");
        this.updateFileField(this.editorKey, "keysnail.preference.userscript.editor");
    },

    openFile: function (aPath) {
        var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance(Components.interfaces.nsILocalFile);

        try {
            file.initWithPath(aPath);
        } catch (e) {
            return null;
        }

        return file;
    },

    changePathClicked: function (aType) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);
        var response;
        var prefKey;

        switch (aType) {
        case 'INITFILE':
            var initFileLocation = this.modules.util.getUnicharPref(this.initFileKey);

            fp.init(window, "Select a directory", nsIFilePicker.modeGetFolder);
            fp.displayDirectory = this.openFile(initFileLocation);
            prefKey = this.initFileKey;
            break;
        case 'EDITOR':
            fp.init(window, "Select Editor", nsIFilePicker.modeOpen);
            fp.appendFilters(nsIFilePicker.filterApps);
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
            this.modules.util.setUnicharPref(prefKey, fp.file.path);
            this.updateFileField(this.initFileKey, "keysnail.preference.userscript.location");
            break;
        case 'EDITOR':
            if (!fp.file.exists() || !fp.file.isExecutable()) {
                alert("Please select the valid editor");
                return;
            }
            // set preference value
            this.modules.util.setUnicharPref(prefKey, fp.file.path);
            Application.console.log("fp.file.path : " + fp.file.path);
            this.updateFileField(this.editorKey, "keysnail.preference.userscript.editor");                
            break;
        }
    }
};

const KS_MODE         = 0;
const KS_KEY_STRING   = 1;
const KS_DESC         = 2;
const KS_FUNCTION     = 3;
const KS_TREE_COUNT   = 4;

var ksKeybindTreeView = {
    modules: null,
    _data: [],
    modes: [
        "Global",
        "View",
        "Edit",
        "Caret"
    ],
    currentModeIndex: null,

    /**
     * nsITreeBoxObject
     */
    _treeBoxObject: null,

    // misc
    init: function () {
        this.currentModeIndex = 0;
        this.initKeyBindingData(this._data, this.modules.key.keyMapHolder[this.modules.key.modes.GLOBAL]);
        this._data.push([null, null, null, null]);

        this.currentModeIndex++;
        this.initKeyBindingData(this._data, this.modules.key.keyMapHolder[this.modules.key.modes.VIEW]);
        this._data.push([null, null, null, null]);

        this.currentModeIndex++;
        this.initKeyBindingData(this._data, this.modules.key.keyMapHolder[this.modules.key.modes.EDIT]);
        this._data.push([null, null, null, null]);

        this.currentModeIndex++;
        this.initKeyBindingData(this._data, this.modules.key.keyMapHolder[this.modules.key.modes.CARET]);
        this.currentModeIndex = 0;
    },

    /**
     * Generate keymaps settings
     * @param {[string]} aContentHolder setting string stored to
     * @param {[string]} aKeyMap keymap to generate the setting
     * @param {[string]} aKeySequence current key sequence (with ' both side e.g. ['C-x', 'k'])
     */
    initKeyBindingData: function (aData, aKeyMap, aKeySequence) {
        if (!aKeyMap) {
            return;
        }

        if (!aKeySequence) {
            aKeySequence = [];
        }

        for (key in aKeyMap) {
            switch (typeof(aKeyMap[key])) {
            case "function":
                var func = aKeyMap[key];

                var keyString = aKeySequence.length ? aKeySequence.join(" ") + ' ' + key : key;

                var row = new Array(KS_TREE_COUNT);
                row[KS_MODE] = this.currentModeIndex;
                row[KS_KEY_STRING] = keyString;
                row[KS_DESC] = func.ksDescription;
                row[KS_FUNCTION] = func;
                aData.push(row);
                break;
            case "object":
                aKeySequence.push(key);
                this.initKeyBindingData(aData, aKeyMap[key], aKeySequence);
                aKeySequence.pop();
                break;
            }
        }
    },

    update: function() {
	this._treeBoxObject.invalidate();
    },

    get currentIndex()  {
        return this.selection.currentIndex;
    },

    // interfaces
    get rowCount() {
        return this._data.length;
    },
    selection: null,
    getRowProperties: function (index, properties) {},
    getCellProperties: function (row, col, properties) {},
    getColumnProperties: function (col, properties) {},
    isContainer: function (index) { return false; },
    isContainerOpen: function (index) { return false; },
    isContainerEmpty: function (index) { return false; },
    isSeparator: function (index) {
        return this._data[index][0] == null;
    },
    isSorted: function () { return false; },
    canDrop: function (targetIndex, orientation) { return false; },
    drop: function (targetIndex, orientation) {},
    getParentIndex: function (rowIndex) { return -1; },
    hasNextSibling: function (rowIndex, afterIndex) { return false; },
    getLevel: function (index) { return 0; },
    getImageSrc: function (row, col) {},
    getProgressMode: function (row, col) {},
    getCellValue: function (row, col) {},
    getCellText: function (row, col) {
        switch (col.index) {
            case KS_MODE:
            return this.modes[this._data[row][KS_MODE]];
            case KS_KEY_STRING:
            return this._data[row][KS_KEY_STRING];
            case KS_DESC:
            return this._data[row][KS_FUNCTION].ksDescription;
            case KS_FUNCTION:
            return this._data[row][KS_FUNCTION];
            default:
            return "";
        }
    },
    setTree: function (tree) {
        this._treeBoxObject = tree;
    },
    toggleOpenState: function (index) {},
    cycleHeader: function (col) {},
    selectionChanged: function () {},
    cycleCell: function (row, col) {},
    isEditable: function (row, col) { return false; },
    isSelectable: function (row, col) {},
    setCellValue: function (row, col, value) {},
    setCellText: function (row, col, value) {},
    performAction: function (action) {},
    performActionOnRow: function (action, row) {},
    performActionOnCell: function (action, row, col) {}
};

(function () {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);
     var browserWindow = wm.getMostRecentWindow("navigator:browser");
     ksPreference.modules = browserWindow.KeySnail.modules;
     ksKeybindTreeView.modules = browserWindow.KeySnail.modules;
 })();
