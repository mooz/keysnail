/**
 * @fileOverview
 * @name preference.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var ksPreference = {
    initFileKey: "extensions.keysnail.userscript.location",
    editorKey: "extensions.keysnail.userscript.editor",

    keybindTreeBox: null,
    keybindTextarea: null,
    editButton: null,
    deleteButton: null,

    keybindEditBox: null,
    descriptionTextarea: null,
    functionTextarea: null,
    norepeatCheckbox: null,
    modeMenuList: null,

    onGeneralPaneLoad: function () {
        if (!this.modules.util.getUnicharPref(this.editorKey)) {
            this.modules.userscript.syncEditorWithGM();
        }
        this.updateAllFileFields();
    },

    onKeyPaneLoad: function () {
        // init key-binds tree
        ksKeybindTreeView.init();
        document.getElementById("keybind-tree").view = ksKeybindTreeView;

        this.keybindTreeBox  = document.getElementById("keybind-tree-box");
        this.keybindTextarea = document.getElementById("keybind-textarea");
        this.editButton      = document.getElementById("keybind-button-edit");
        this.deleteButton    = document.getElementById("keybind-button-delete");

        this.keybindEditBox      = document.getElementById("keybind-edit-box");
        this.descriptionTextarea = document.getElementById("keybind-function-description");
        this.functionTextarea    = document.getElementById("keybind-function-body");
        this.norepeatCheckbox    = document.getElementById("keybind-function-norepeat");
        this.modeMenuList        = document.getElementById("keybind-function-mode");

        // init special key pane
        keyCustomizer.initPane();

        // init black list pane
        this.initBlackList();
    },

    onFinish: function () {
        // apply special key change
        keyCustomizer.apply();
        // apply keybindings change
        ksKeybindTreeView.applyToKeyMap();
        // blacklist's are automatically applied
    },

    handleTreeEvent: function (aEvent) {
        aEvent.preventDefault();
        switch (aEvent.type) {
        case "dblclick":
            if (aEvent.target.localName == "treechildren") {
                this.toggleEditView();
            }
            break;
        case "click":
            aEvent.preventDefault();
            if (!ksKeybindTreeView.isSeparator(ksKeybindTreeView.currentIndex))
                ksPreference.keybindTextarea.focus();
            break;
        case "keypress":
            switch (aEvent.keyCode) {
            case aEvent.DOM_VK_RETURN: 
                break;
            case aEvent.DOM_VK_DELETE: 
                ksKeybindTreeView.deleteSelectedItem();
                this.updateKeyBindTextarea();
                break;
            }
            break;
        case "select":
            if (ksKeybindTreeView.currentIndex >= 0) {
                this.updateKeyBindButtons();
                this.updateKeyBindTextarea();
                this.updateKeyBindEditBox();
            }
        }
    },

    handleKeyBindTextareaEvent: function (aEvent) {
        switch (aEvent.type) {
        case "mousedown":
            aEvent.preventDefault();
            // go down
        case "focus":
            // move caret to end of the line
            var textarea = aEvent.originalTarget;
            var end = textarea.value.length;
            textarea.selectionStart = textarea.selectionEnd = end;
            // if keysnail is enabled, suspend
            if (typeof(KeySnail) != 'undefined')
                KeySnail.Key.stop();
            break;
        case "blur":
            if (typeof(KeySnail) != 'undefined')
                KeySnail.Key.run();
            break;
        case "keypress":
            aEvent.preventDefault();

            // ignore separator
            if (ksKeybindTreeView.isSeparator(ksKeybindTreeView.currentIndex))
                return;

            var row = ksKeybindTreeView.data[ksKeybindTreeView.currentIndex];

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
            if (!key)
                return;

            row[KS_KEY_STRING] += ((row[KS_KEY_STRING] ? " " : "") + key);
            this.keybindTextarea.value = row[KS_KEY_STRING];

            ksKeybindTreeView.update();
            ksKeybindTreeView.changed = true;
            break;
        }
    },

    handleFunctionTextarea: function (aEvent) {
        switch (aEvent.type) {
        case "change":
            var i = this.keybindEditBox.ksSelectedIndex;
            var row = ksKeybindTreeView.data[i];
            row[KS_FUNCTION] = this.functionTextarea.value;
            break;
        }
    },

    handleDescriptionTextarea: function (aEvent) {
        switch (aEvent.type) {
        case "change":
            var i = this.keybindEditBox.ksSelectedIndex;
            var row = ksKeybindTreeView.data[i];
            row[KS_FUNCTION].ksDescription = this.descriptionTextarea.value;
            row[KS_DESC] = row[KS_FUNCTION].ksDescription;
            break;
        }
    },

    handleModeMenuList: function (aEvent) {
        switch (aEvent.type) {
        case "command":
            var i = this.keybindEditBox.ksSelectedIndex;
            var row = ksKeybindTreeView.data[i];
            row[KS_MODE] = this.modeMenuList.selectedIndex;
            break;
        }
    },

    toggleNoRepeat: function () {
        var i = this.keybindEditBox.ksSelectedIndex;
        var row = ksKeybindTreeView.data[i];
        row[KS_FUNCTION].ksNoRepeat = !row[KS_FUNCTION].ksNoRepeat;
    },

    toggleEditView: function () {
        if (ksKeybindTreeView.isSeparator(ksKeybindTreeView.currentIndex))
            return;

        var editBoxHidden = this.keybindEditBox.hidden;

        this.keybindEditBox.hidden = !editBoxHidden;
        this.keybindTreeBox.hidden = editBoxHidden;

        if (editBoxHidden) {
            // editbox will be displayed
            this.keybindEditBox.ksSelectedIndex = ksKeybindTreeView.currentIndex;
        } else {
            // treeview will be displayed
        }
    },

    updateKeyBindButtons: function () {
        var index = ksKeybindTreeView.currentIndex;

        this.editButton.disabled = ksKeybindTreeView.isSeparator(index);
        this.deleteButton.disabled = this.editButton.disabled;
    },

    updateKeyBindTextarea: function () {
        var index = ksKeybindTreeView.currentIndex;

        if (ksKeybindTreeView.isSeparator(index)) {
            this.keybindTextarea.readOnly = true;
            this.keybindTextarea.value = "";
        } else {
            this.keybindTextarea.readOnly = false;
            this.keybindTextarea.value = ksKeybindTreeView.data[index][KS_KEY_STRING];
        }
    },

    updateKeyBindEditBox: function () {
        var index = ksKeybindTreeView.currentIndex;

        if (ksKeybindTreeView.isSeparator(index)) {
            this.modeMenuList.selectedIndex = 0;
            this.descriptionTextarea.value = "";
            this.functionTextarea.value = "";
            this.norepeatCheckbox.checked = false;
        } else {
            var row = ksKeybindTreeView.data[index];
            this.modeMenuList.selectedIndex = row[KS_MODE];
            this.descriptionTextarea.value = row[KS_FUNCTION].ksDescription || "";
            this.functionTextarea.value = row[KS_FUNCTION];
            this.norepeatCheckbox.checked = row[KS_FUNCTION].ksNoRepeat;
        }
    },

    beautify: function() {
        var code = this.functionTextarea.value;
        var beauty = js_beautify(code);
        this.functionTextarea.value = beauty;
    },

    // ============================== general pane ============================== //

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
    },

    // ============================== Black List ============================== //

    /**
     * Blacklist Settings
     */
    blacklistbox: null,
    blacklisturl: null,
    blacklist: null,

    initBlackList: function () {
        if (typeof(this.modules.key.blacklist) == "undefined") {
            this.modules.key.blacklist = [];
        }

        this.blacklist = this.modules.key.blacklist;

        var blacklistbox = document.getElementById("blacklist-listbox");
        this.blacklistbox = blacklistbox;
        this.removeAllChilds(blacklistbox);

        if (this.blacklist.length) {
            for (var i = 0; i < this.blacklist.length; ++i) {
                this.blacklistbox.appendItem(this.blacklist[i]);
            }
        }
        
        this.blacklisturl = document.getElementById("blacklist-url");
    },

    removeAllChilds: function (aElement) {
        while (aElement.hasChildNodes()) {
            aElement.removeChild(aElement.firstChild);
        }
    },

    addBlackList: function () {
        var url = this.blacklisturl.value;
        if (!url)
            return;

        if (this.blacklist.every(function (str) { return url != str; })) {
            this.blacklist.push(url);
            this.blacklistbox.appendItem(url);
            this.blacklisturl.value = "";
        } else {
            this.notify("Item already exists in the list", 4000);
        }
    },

    deleteBlackList: function () {
        var i = this.blacklistbox.selectedIndex;
        if (i >= 0) {
            this.blacklistbox.removeItemAt(i);
            this.blacklist.splice(i, 1);
        }
    },

    handleBlackListBoxEvent: function (aEvent) {
        switch (aEvent.type) {
        case 'select':
            if (this.blacklistbox.selectedItem) {
                this.blacklisturl.value = this.blacklistbox.selectedItem.label;
                document.getElementById("blacklist-button-delete").disabled = false;
            } else {
                this.blacklisturl.value = "";
                document.getElementById("blacklist-button-delete").disabled = true;
            }
            break;
        case "keypress":
            switch (aEvent.keyCode) {
            case aEvent.DOM_VK_RETURN:
                aEvent.preventDefault();
                break;
            case aEvent.DOM_VK_DELETE: 
                this.deleteBlackList();
                break;
            }
            break;
        default:
            break;
        }
    },

    handleBlackListInputEvent: function (aEvent) {
        switch (aEvent.type) {
        case "keypress":
            switch (aEvent.keyCode) {
            case aEvent.DOM_VK_RETURN:
                aEvent.preventDefault();
                this.addBlackList();
                break;
            }
            break;
        default:
            break;
        }
    },

    msgTimeOut: null,
    notify: function (aMsg, aTime) {
        var messageBox = document.getElementById("notification-area");

        if (this.msgTimeOut) {
            clearTimeout(this.msgTimeOut);
            this.msgTimeOut = null;
        }

        var oldMsg = messageBox.value;

        messageBox.value = aMsg;
        let self = this;
        if (aTime) {
            this.msgTimeOut = setTimeout(function () { self.notify(oldMsg, 0); }, aTime);
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
    changed: false,
    data: [],
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

    
    /**
     * Generate array of keymap as data
     */
    init: function () {
        this.currentModeIndex = 0;
        this.initKeyBindingData(this.data, this.modules.key.keyMapHolder[this.modules.key.modes.GLOBAL]);
        this.data.push([null, null, null, null]);

        this.currentModeIndex++;
        this.initKeyBindingData(this.data, this.modules.key.keyMapHolder[this.modules.key.modes.VIEW]);
        this.data.push([null, null, null, null]);

        this.currentModeIndex++;
        this.initKeyBindingData(this.data, this.modules.key.keyMapHolder[this.modules.key.modes.EDIT]);
        this.data.push([null, null, null, null]);

        this.currentModeIndex++;
        this.initKeyBindingData(this.data, this.modules.key.keyMapHolder[this.modules.key.modes.CARET]);
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
                row[KS_DESC] = null;

                var property = this.isMemberOf(func, this.modules.command);
                if (property) {
                    row[KS_FUNCTION] = new String("command." + property);
                    row[KS_FUNCTION].ksNoRepeat = func.ksNoRepeat;
                    row[KS_FUNCTION].ksDescription = func.ksDescription;
                } else {
                    row[KS_FUNCTION] = func;                    
                }

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

    applyToKeyMap: function () {
        if (!this.changed)
            return;

        var begin = new Date();
        with (this.modules) {
            key.keyMapHolder = {};
            key.declareKeyMap(key.modes.GLOBAL);
            key.declareKeyMap(key.modes.VIEW);
            key.declareKeyMap(key.modes.EDIT);
            key.declareKeyMap(key.modes.CARET);
            key.currentKeyMap = key.keyMapHolder[key.modes.GLOBAL];

            var row;
            var sequence;
            var modes = [4];

            modes[0] = key.modes.GLOBAL;
            modes[1] = key.modes.VIEW;
            modes[2] = key.modes.EDIT;
            modes[3] = key.modes.CARET;
            for (var i = 0; i < this.data.length; ++i) {
                row = this.data[i];
                if (row[0] == null)
                    continue;
                sequence = row[KS_KEY_STRING].split(" ");
                if (sequence.length) {
                    key.defineKey(modes[row[KS_MODE]], sequence, row[KS_FUNCTION],
                                  row[KS_FUNCTION].ksDescription, row[KS_FUNCTION].ksNoRepeat);
                }
            }
        }

        this.changed = false;
        var end = new Date();
        Application.console.log((end - begin) + " msec");
    },

    deleteSelectedItem: function () {
        var i = this.currentIndex;
        if (!this.isSeparator(i)) {
            this.data.splice(i, 1);
            this._treeBoxObject.rowCountChanged(i, -1);
            this.update();
        }
    },

    /**
     * Check if <aMan> is the property of <aTeam>
     * @param {object} aMan
     * @param {object} aTeam
     * @returns {string} property name of <aMan> as the member of <aTeam>
     */
    isMemberOf: function (aMan, aTeam) {
        for (var member in aTeam) {
            if (aMan == aTeam[member])
                return member;
        }
        return null;
    },

    update: function() {
	this._treeBoxObject.invalidate();
    },

    get currentIndex()  {
        return this.selection.currentIndex;
    },

    // interfaces
    get rowCount() {
        return this.data.length;
    },
    selection: null,
    getRowProperties: function (index, properties) {},
    getCellProperties: function (row, col, properties) {},
    getColumnProperties: function (col, properties) {},
    isContainer: function (index) { return false; },
    isContainerOpen: function (index) { return false; },
    isContainerEmpty: function (index) { return false; },
    isSeparator: function (index) {
        if (index < 0)
            return true;
        return this.data[index][0] == null;
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
            return this.modes[this.data[row][KS_MODE]];
            case KS_KEY_STRING:
            return this.data[row][KS_KEY_STRING] || "";
            case KS_DESC:
            return this.data[row][KS_FUNCTION] ? this.data[row][KS_FUNCTION].ksDescription : ("row :: " + row);
            case KS_FUNCTION:
            return this.data[row][KS_FUNCTION].toString();
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
