/**
 * @fileOverview
 * @name preference.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var ksPreference = {
    initFileKey: "extensions.keysnail.userscript.location",
    editorKey: "extensions.keysnail.userscript.editor",

    digitArgumentList        : null,
    digitArgumentDescription : null,
    prefixArgumentCheckBox   : null,

    keybindTreeBox      : null,
    keybindTextarea     : null,
    dropMarker          : null,
    editButton          : null,
    deleteButton        : null,

    keybindEditBox      : null,
    descriptionTextarea : null,
    functionTextarea    : null,
    norepeatCheckbox    : null,
    modeMenuList        : null,

    beautifyCode: function (aCode) {
        return js_beautify(aCode, {space_after_anon_function: true});
    },

    onGeneralPaneLoad: function () {
        this.digitArgumentList        = document.getElementById("digit-argument-list");
        this.digitArgumentDescription = document.getElementById("digit-argument-description");
        this.prefixArgumentCheckBox   = document.getElementById("use-prefix-argument-checkbox");

        if (!this.modules.util.getUnicharPref(this.editorKey)) {
            this.modules.userscript.syncEditorWithGM();
        }
        this.updateAllFileFields();

        var usePrefixArgument = nsPreferences.getBoolPref("extensions.keysnail.keyhandler.use_prefix_argument", false);
        this.setDigitArgumentFieldState(usePrefixArgument);

        switch (this.modules.util.getUnicharPref("extensions.keysnail.keyhandler.digit_prefix_argument_type")) {
        case "C":
            this.digitArgumentList.selectedIndex = 1;
            break;
        case "M":
            this.digitArgumentList.selectedIndex = 2;
            break;
        case "C-M":
            this.digitArgumentList.selectedIndex = 3;
            break;
        default:
            this.digitArgumentList.selectedIndex = 0;
            break;
        }
    },

    setDigitArgumentFieldState: function (aEnabled) {
        this.digitArgumentList.disabled = !aEnabled;
        this.digitArgumentDescription.disabled = !aEnabled;
    },

    toggleEmacsLikePrefixArgument: function (aEvent) {
        var enabled = this.prefixArgumentCheckBox.checked;
        this.setDigitArgumentFieldState(!enabled);
    },

    // showElapsedTime: function (aMsg) {
    //     var b = new Date();

    //     Application.console.log(aMsg + " :: " + (b - this._old));

    //     this._old = b;
    // },

    onKeyPaneLoad: function () {
        // this._old = new Date();

        // init key-binds tree
        ksKeybindTreeView.init();
        document.getElementById("keybind-tree").view = ksKeybindTreeView;

        this.keybindTreeBox  = document.getElementById("keybind-tree-box");
        this.keybindTextarea = document.getElementById("keybind-textarea");
        this.editButton      = document.getElementById("keybind-button-edit");
        this.deleteButton    = document.getElementById("keybind-button-delete");

        /**
         * We need to add event listener to window not to the keybindTextarea.
         * Because the default Firefox behaviour e.g. C-w to close the window
         * can't be canceled by the event listener of local elements.
         */
        window.addEventListener("keypress",
                                function (aEvent) {
                                    if (aEvent.target == ksPreference.keybindTextarea) {
                                        aEvent.preventDefault();
                                        aEvent.stopPropagation();

                                        // ignore separator
                                        if (ksKeybindTreeView.isNotConfigurable(ksKeybindTreeView.currentIndex))
                                            return;

                                        var row = ksKeybindTreeView.data[ksKeybindTreeView.currentIndex];

                                        if (aEvent.keyCode == aEvent.DOM_VK_BACK_SPACE) {
                                            if (row[KS_KEY_STRING]) {
                                                var tmp = row[KS_KEY_STRING].split(' ');
                                                tmp.pop();
                                                var after = tmp.join(' ');
                                                ksPreference.keybindTextarea.value = after;
                                                row[KS_KEY_STRING] = after;
                                                ksKeybindTreeView.update();

                                                ksPreference.needsApply = true;
                                            }
                                            return;
                                        }

                                        var key = ksPreference.modules.key.keyEventToString(aEvent);
                                        if (!key)
                                            return;

                                        ksPreference.insertKey(key);
                                    }
                                }, true);

        this.keybindEditBox      = document.getElementById("keybind-edit-box");
        this.descriptionTextarea = document.getElementById("keybind-function-description");
        this.functionTextarea    = document.getElementById("keybind-function-body");
        this.norepeatCheckbox    = document.getElementById("keybind-function-norepeat");
        this.modeMenuList        = document.getElementById("keybind-function-mode");

        this.preservedEditBox    = document.getElementById("preserved-code");
        this.preservedEditBox.value = this.modules.userscript.preserve ? this.modules.userscript.preserve.code : "";

        this.insertKeyMenu = document.getElementById("insert-key-menu");
        this.dropMarker    = document.getElementById("keybind-button-insert");

        var keys = [
            "<backspace>",
            "C-<backspace>",
            "M-<backspace>",
            "S-<backspace>"
        ];
        keys.forEach(
            function (key) {
                var item = document.createElement("menuitem");
                item.setAttribute("label", key);
                item.onmouseup = function () {
                    if (!ksKeybindTreeView.isNotConfigurable(ksKeybindTreeView.currentIndex) &&
                        ksKeybindTreeView.currentIndex >= 0) {
                        ksPreference.insertKey(key);
                    }
                };
                this.insertKeyMenu.appendChild(item);
            } ,this);

        // init special key pane
        keyCustomizer.initPane();

        // init black list pane
        this.initBlackList();
    },

    onInitFileCreate: function () {
        var error;
        if ((error = ksKeybindTreeView.checkSyntax())) {
            this.modules.util.alert(null, "Syntax error",
                                    this.modules.util.getLocaleString("syntaxErrorFoundInFunction"));
            return false;
        }

        var createButton = document.getElementById("create-button");
        createButton.disabled = true;

        var output = this.generateInitFile();

        if (!output) {
            createButton.disabled = false;
            return false;
        }

        try {
            this.modules.util.writeText(output, this.modules.userscript.initFilePath, false, "preference.ask_when_overwrite");
            this.modules.userscript.reload();

            this.needsApply = ksKeybindTreeView.changed = keyCustomizer.changed = false;
        } catch (x) {
        }

        createButton.disabled = false;

        return true;
    },

    onFinish: function () {
        if (this.digitArgumentList.selectedItem) {
            this.modules.util.setUnicharPref("extensions.keysnail.keyhandler.digit_prefix_argument_type",
                                             this.digitArgumentList.selectedItem.value);
        }

        if (this.preservedEditBox.value != this.modules.userscript.preserve.code)
            this.needsApply = true;

        if ((this.needsApply || ksKeybindTreeView.changed || keyCustomizer.changed) &&
            this.modules.util.confirm(this.modules.util.getLocaleString("settingsChanged"),
                                      this.modules.util.getLocaleString("settingsChangedApplyChange"))) {
            return this.onInitFileCreate();
        }

        return true;
    },

    // ============================== Event Handlers ============================== //

    handleTreeEvent: function (aEvent) {
        aEvent.preventDefault();

        switch (aEvent.type) {
        case "dblclick":
            if (ksKeybindTreeView.currentIndex >= 0 && aEvent.target.localName == "treechildren") {
                this.toggleEditView();
            }
            break;
        case "click":
            if (ksKeybindTreeView.currentIndex >= 0 &&
                !ksKeybindTreeView.isNotConfigurable(ksKeybindTreeView.currentIndex)) {
                ksPreference.keybindTextarea.focus();
            }
            break;
        case "keypress":
            switch (aEvent.keyCode) {
            case aEvent.DOM_VK_RETURN:
            case aEvent.DOM_VK_ENTER:
                if (aEvent.target.localName == "treechildren") {
                    this.toggleEditView();
                }
                break;
            case aEvent.DOM_VK_DELETE:
                if (ksKeybindTreeView.deleteSelectedItem() >= 0) {
                    this.updateKeyBindTextarea();
                    this.needsApply = true;
                }
                break;
            }
            break;
        case "select":
            if (ksKeybindTreeView.currentIndex >= 0) {
                this.updateKeyBindButtons();
                this.updateKeyBindTextarea();
                this.updateKeyBindEditBox();
            }
            break;
        }
    },

    handleKeyBindTextareaEvent: function (aEvent) {
        switch (aEvent.type) {
        case "mousedown":
            // aEvent.preventDefault();
            // this.keybindTextarea.focus();
            // go down
            aEvent.stopPropagation();
            aEvent.preventDefault();
        case "focus":
            // move caret to end of the line
            var textarea = this.keybindTextarea;
            var end = textarea.value.length;
            textarea.selectionStart = textarea.selectionEnd = end;
            // if keysnail is enabled, suspend
            if (typeof(KeySnail) != 'undefined' && KeySnail.Key.status) {
                this.savedKeySnailState = KeySnail.Key.status;
                KeySnail.Key.stop();
            }
            break;
        case "blur":
            if (typeof(KeySnail) != 'undefined') {
                if (this.savedKeySnailState)
                    KeySnail.Key.run();
            }
            break;
        }
    },

    insertKey: function (aKey) {
        var row = ksKeybindTreeView.data[ksKeybindTreeView.currentIndex];

        row[KS_KEY_STRING] += ((row[KS_KEY_STRING] ? " " : "") + aKey);
        this.keybindTextarea.value = row[KS_KEY_STRING];

        ksKeybindTreeView.update();
        this.needsApply = true;
    },

    updateFunctionData: function () {
        var i = ksKeybindTreeView.currentIndex;
        if (i < 0)
            return;

        var row = ksKeybindTreeView.data[i];
        if (row[KS_FUNCTION] != this.functionTextarea.value) {
            row[KS_FUNCTION] = this.functionTextarea.value;
            this.needsApply = true;
        }
    },

    updateDescriptionData: function () {
        var i = ksKeybindTreeView.currentIndex;
        if (i < 0)
            return;

        var row = ksKeybindTreeView.data[i];
        if (row[KS_DESC] != this.descriptionTextarea.value) {
            row[KS_DESC] = this.descriptionTextarea.value;
            this.needsApply = true;
        }
    },

    handleFunctionTextarea: function (aEvent) {
        switch (aEvent.type) {
        case "blur":
            this.updateFunctionData();
            break;
        case "keypress":
            if (aEvent.keyCode == aEvent.DOM_VK_ESCAPE) {
                aEvent.preventDefault();
            }
            break;
        }
    },

    handleDescriptionTextarea: function (aEvent) {
        switch (aEvent.type) {
        case "blur":
            this.updateDescriptionData();
            break;
        case "keypress":
            if (aEvent.keyCode == aEvent.DOM_VK_RETURN ||
                aEvent.keyCode == aEvent.DOM_VK_ENTER) {
                aEvent.preventDefault();
                this.toggleEditView();
            }
            break;
        }
    },

    handleModeMenuList: function (aEvent) {
        switch (aEvent.type) {
        case "command":
            var i = this.keybindEditBox.ksSelectedIndex;
            var row = ksKeybindTreeView.data[i];
            row[KS_MODE] = this.modeMenuList.selectedIndex;

            this.needsApply = true;
            break;
        }
    },

    // ============================== Update Form ============================== //

    /**
     * Apply ksNoRepeat checkbox value to the data
     */
    noRepeatToggled: function () {
        var i = this.keybindEditBox.ksSelectedIndex;
        var row = ksKeybindTreeView.data[i];
        row[KS_ARGUMENT] = !row[KS_ARGUMENT];

        this.needsApply = true;
    },

    toggleEditView: function () {
        if (ksKeybindTreeView.currentIndex < 0 ||
            ksKeybindTreeView.isNotConfigurable(ksKeybindTreeView.currentIndex))
            return;

        var editBoxCollapsed = this.keybindEditBox.collapsed;
        var destination;

        if (editBoxCollapsed) {
            // editbox will be displayed
            this.keybindEditBox.ksSelectedIndex = ksKeybindTreeView.currentIndex;
            destination = this.descriptionTextarea;
        } else {
            // treeview will be displayed

            var error;
            if ((error = ksKeybindTreeView.checkSyntax())) {
                this.modules.util.alert(null, "Syntax error",
                                        this.modules.util.getLocaleString("syntaxErrorFoundInFunction"));
                this.functionTextarea.focus();
                return;
            }

            destination = this.keybindTextarea;
        }

        this.keybindEditBox.collapsed = !editBoxCollapsed;
        this.keybindTreeBox.collapsed = editBoxCollapsed;

        if (destination)
            destination.focus();
    },

    updateKeyBindButtons: function () {
        var index = ksKeybindTreeView.currentIndex;
        if (index < 0) return;

        this.editButton.disabled   = ksKeybindTreeView.isNotConfigurable(index);
        this.deleteButton.disabled = this.editButton.disabled;
        this.dropMarker.setAttribute("disabled", this.editButton.disabled);
    },

    updateKeyBindTextarea: function () {
        var index = ksKeybindTreeView.currentIndex;
        if (index < 0) return;

        if (ksKeybindTreeView.isNotConfigurable(index)) {
            this.keybindTextarea.readOnly = true;
            this.keybindTextarea.value = "";
        } else {
            this.keybindTextarea.readOnly = false;
            this.keybindTextarea.value = ksKeybindTreeView.data[index][KS_KEY_STRING];
        }
    },

    updateKeyBindEditBox: function () {
        var index = ksKeybindTreeView.currentIndex;
        if (index < 0) return;

        if (ksKeybindTreeView.isNotConfigurable(index)) {
            this.modeMenuList.selectedIndex = 0;
            this.descriptionTextarea.value = "";
            this.functionTextarea.value = "";
            this.norepeatCheckbox.checked = false;
        } else {
            var row = ksKeybindTreeView.data[index];
            this.modeMenuList.selectedIndex = row[KS_MODE];
            this.descriptionTextarea.value = row[KS_DESC] || "";
            this.functionTextarea.value = row[KS_FUNCTION];
            this.norepeatCheckbox.checked = row[KS_ARGUMENT];
        }
    },

    beautify: function() {
        var code = this.functionTextarea.value;
        var beauty = ksPreference.beautifyCode(code);
        this.functionTextarea.value = beauty;
    },

    // ============================== General Pane ============================== //

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
            this.updateFileField(this.editorKey, "keysnail.preference.userscript.editor");
            break;
        }
    },

    // ============================== Black List ============================== //

    blackListBox: null,
    blackListURL: null,
    blackList: null,
    needsApply: false,

    initBlackList: function () {
        if (!this.modules.key.blackList) {
            this.blackList = [];
        } else {
            this.blackList = this.modules.key.blackList.slice(0);
        }

        var blackListBox = document.getElementById("blacklist-listbox");
        this.blackListBox = blackListBox;
        this.removeAllChilds(blackListBox);

        if (this.blackList.length) {
            for (var i = 0; i < this.blackList.length; ++i) {
                this.blackListBox.appendItem(this.blackList[i]);
            }
        }

        this.blackListURL = document.getElementById("blacklist-url");
    },

    removeAllChilds: function (aElement) {
        while (aElement.hasChildNodes()) {
            aElement.removeChild(aElement.firstChild);
        }
    },

    addBlackList: function () {
        var URL = this.blackListURL.value;
        if (!URL)
            return;

        if (this.blackList.every(function (str) { return URL != str; })) {
            this.blackList.push(URL);
            this.blackListBox.appendItem(URL);
            this.blackListURL.value = "";

            this.needsApply = true;
        } else {
            this.modules.util.alert(null, "Notice", "Item already exists in the list");
            // this.notify("Item already exists in the list", 1000);
        }
    },

    deleteBlackList: function () {
        var i = this.blackListBox.selectedIndex;
        if (i >= 0) {
            this.blackListBox.removeItemAt(i);
            this.blackList.splice(i, 1);

            this.needsApply = true;
        }
    },

    handleBlackListBoxEvent: function (aEvent) {
        switch (aEvent.type) {
        case 'select':
            if (this.blackListBox.selectedItem) {
                this.blackListURL.value = this.blackListBox.selectedItem.label;
                document.getElementById("blacklist-button-delete").disabled = false;
            } else {
                this.blackListURL.value = "";
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

    // ============================== Generate init file ============================== //

    formatDescription: function (desc) {
        desc = desc.replace(/\(.*\)/g, "");
        desc = desc.replace(/\//g, "");
        desc = desc.replace(/\s+$/g, "");
        desc = desc.replace(/\s+/g, "_");
        desc = desc.replace(/[,-]/g, "_");
        desc = desc.toLowerCase();

        return desc;
    },

    generateStringBundle: function () {
        var contentHolder = [];

        var duplicateChecker = new Object();
        var row;
        var data = ksKeybindTreeView.data;
        var mode = 0;

        for (var i = 0; i < data.length; ++i) {
            row = data[i];

            // ignore separator
            if (row[0] == null)
                continue;

            if (row[KS_MODE] != mode) {
                contentHolder.push("\n## =========================================================================== ##\n");
                mode = row[KS_MODE];
            }

            var desc = this.formatDescription(row[KS_DESC]);

            if (typeof(duplicateChecker[desc]) == "object") {
                if (duplicateChecker[desc][row[KS_MODE]]) {
                    // ignore
                    duplicateChecker[desc][row[KS_MODE]]++;
                    continue;
                }
                duplicateChecker[desc][row[KS_MODE]] = 1;
            } else {
                duplicateChecker[desc] = new Object();
                duplicateChecker[desc][row[KS_MODE]] = 1;
            }

            var src = "=" + row[KS_DESC];
            // var src = desc + "=" + row[KS_DESC];
            contentHolder.push(src);
        }

        return this.modules.util
            .convertCharCodeFrom(contentHolder.join('\n'), "UTF-8");
    },

    generateCommands: function () {
        var contentHolder = [];

        var duplicateChecker = new Object();
        var row;
        var data = ksKeybindTreeView.data;
        var mode = 0;

        for (var i = 0; i < data.length; ++i) {
            row = data[i];

            // ignore separator
            if (row[0] == null)
                continue;

            if (row[KS_MODE] != mode) {
                contentHolder.push("// =========================================================================== //");
                mode = row[KS_MODE];
            }

            var desc = this.formatDescription(row[KS_DESC]);

            if (typeof(duplicateChecker[desc]) == "object") {
                if (duplicateChecker[desc][row[KS_MODE]]) {
                    // ignore
                    duplicateChecker[desc][row[KS_MODE]]++;
                    continue;
                }
                duplicateChecker[desc][row[KS_MODE]] = 1;
            } else {
                duplicateChecker[desc] = new Object();
                duplicateChecker[desc][row[KS_MODE]] = 1;
            }

            var ksNoRepeatString = row[KS_ARGUMENT] ? ", true" : ", false";
            var src = desc + ": [\n" + row[KS_FUNCTION] + ksNoRepeatString + "],\n";
            contentHolder.push(src);
        }

        return this.modules.util
            .convertCharCodeFrom(contentHolder.join('\n'), "UTF-8");
    },

    generateInitFile: function () {
        var contentHolder = ["// ================ KeySnail Init File ================ //"];

        // 0. Preserved code
        var preserve = this.modules.userscript.preserve;

        contentHolder.push("");
        contentHolder.push("// " + this.modules.util.getLocaleString("preserveDescription1"));
        contentHolder.push("// " + this.modules.util.getLocaleString("preserveDescription2"));
        contentHolder.push(preserve.beginSign);
        if (this.preservedEditBox.value) {
            contentHolder.push(this.preservedEditBox.value);
            this.modules.userscript.preserve.code = this.preservedEditBox.value;
        }
        contentHolder.push(preserve.endSign);

        // 1. Special keys
        contentHolder.push("");
        contentHolder.push("// ================ Special Keys ====================== //");
        this.generateSpecialKeySettings(contentHolder);
        contentHolder.push("");

        // 2. Hooks

        contentHolder.push("// ================ Hooks ============================= //");
        this.generateHookSettings(contentHolder);
        contentHolder.push("");

        // 3. Black List Settings

        this.generateBlackListSettings(contentHolder);

        // 4. KeyBindings

        contentHolder.push("// ================ Key Bindings ====================== //");
        contentHolder.push("");

        var crushingIndexList = this.generateKeyBindSettings(contentHolder);
        if (crushingIndexList) {
            var message = [];
            var data = ksKeybindTreeView.data;
            var row;

            message.push(this.modules.util.getLocaleString("prefixKeyCrushedByOtherKey"));
            message.push("");

            for (var i = 0; i < crushingIndexList.length; ++i) {
                row = data[crushingIndexList[i]];

                message.push("   * " + row[KS_KEY_STRING] + " " + row[KS_DESC] +
                             " (" + ksKeybindTreeView.modes[row[KS_MODE]] + ")");
            }

            this.modules.util.alert(null, "Notice!", message.join("\n"));

            return null;
        }

        // now process it
        var output = this.modules.util
            .convertCharCodeFrom(contentHolder.join('\n'), "UTF-8");

        return output;
    },

    /**
     * String => 'String'
     * @param {string} aStr
     * @returns {string}
     */
    toStringForm: function (aStr) {
        return aStr ? "'" + aStr.replace("\\", "\\\\").replace("'", "\\'") + "'" : "";
    },

    generateSpecialKeySettings: function (aContentHolder) {
        aContentHolder.push("");

        var keys = keyCustomizer.getSpecialKeys();

        var maxLen = Math.max.apply(null, [str.length for each (str in
                                                                (function (obj) {
                                                                     for (var key in obj) yield key;
                                                                 })(keys))]);
        for (var key in keys) {
            var padding = Math.max(maxLen - key.length, 0) + 2;
            aContentHolder.push('key.' + key +
                                new Array(padding).join(" ") +
                                '= "' + keys[key] + '";');
        }
    },

    generateHookSettings: function (aContentHolder) {
        for (var hookName in this.modules.hook.hookList) {
            aContentHolder.push("");

            var hook = this.modules.hook.hookList[hookName];

            for (var i = 0; i < hook.length; ++i) {
                if (hook[i].ksDefinedInExternalFile) {
                    Application.console.log("Function set to hook in external file found." + hook[i]);
                    continue;
                }

                var funcStr = ksPreference.beautifyCode(hook[i].toString());

                // ignore blacklist hook (will be added in generateBlackListSettings)
                if (hookName == "LocationChange" &&
                    funcStr.indexOf("key.suspendWhenMatched") != -1) {
                    continue;
                }

                var method = (i == 0) ? "set" : "addTo";
                aContentHolder.push("hook." + method + "Hook(" +
                                    this.toStringForm(hookName) + ", " +
                                    funcStr + ");");
            }
        }
    },

    generateBlackListSettings: function (aContentHolder) {
        if (this.blackList.length) {
            aContentHolder.push("// ================ Black List ======================== //");
            aContentHolder.push("");
            aContentHolder.push(ksPreference.beautifyCode(['hook.addToHook("LocationChange",',
                                             'function (aNsURI) {',
                                             'var URL = aNsURI ? aNsURI.spec : null;',
                                             'key.suspendWhenMatched(URL, key.blackList);});'].join("\n")));
            aContentHolder.push("");

            aContentHolder.push("key.blackList = [");
            for (var i = 0; i < this.blackList.length; ++i) {
                var commma = (i == this.blackList.length - 1) ? "" : ",";
                aContentHolder.push("    " + this.toStringForm(this.blackList[i]) + commma);
            }
            aContentHolder.push("];");
            aContentHolder.push("");
        }
    },

    generateKeyBindSettings: function (aContentHolder) {
        var row;
        var data = ksKeybindTreeView.data;
        var useBeautifier = nsPreferences.getBoolPref("extensions.keysnail.preference.indent_all_function", false);

        var prefixKeys = {};

        var doneIndexList = [];
        for (var i = 0; i < data.length; ++i) {
            if (data[i][KS_EXTERNAL] || doneIndexList.some(function (aIndex) {return aIndex == i;})) {
                continue;
            }

            row = data[i];

            // ignore separator
            if (row[0] == null)
                continue;

            var sequence, keySetting;
            var func = row[KS_FUNCTION];
            var sameCommandKeys = [];

            // seek for same command
            for (var j = i + 1; j < data.length; ++j) {
                if (row[KS_MODE]     == data[j][KS_MODE]     &&
                    row[KS_FUNCTION] == data[j][KS_FUNCTION] &&
                    row[KS_ARGUMENT] == data[j][KS_ARGUMENT] &&
                    row[KS_DESC]     == data[j][KS_DESC]     &&
                    !row[KS_EXTERNAL]                        &&
                    doneIndexList.every(function (aIndex) {return aIndex != j;})) {
                    //
                    sameCommandKeys.push(data[j][KS_KEY_STRING]);
                    doneIndexList.push(j);
                }
            }

            if (sameCommandKeys.length) {
                // multiple definition
                sameCommandKeys.unshift(row[KS_KEY_STRING]);
                var multiKeySetting = [];
                sameCommandKeys.forEach(function (aKey) {
                                            var sequence = aKey.split(" ");
                                            multiKeySetting.push('[' + sequence.map(this.toStringForm).join(", ") + ']');
                                        }, this);
                keySetting = "[" + multiKeySetting.join(", ") + "]";
            } else {
                // normal
                if (row[KS_KEY_STRING].length) {
                    sequence = row[KS_KEY_STRING].split(" ");
                    if (sequence.length > 1) {
                        keySetting = '[' + sequence.map(this.toStringForm).join(", ") + ']';
                    } else {
                        keySetting = this.toStringForm(row[KS_KEY_STRING]);
                    }
                } else {
                    keySetting = "''";
                }
            }

            var ksNoRepeatString = row[KS_ARGUMENT] ? ", true" : "";

            var src = "key.set" + ksKeybindTreeView.modes[row[KS_MODE]] + "Key(" +
                keySetting +
                ", " + (useBeautifier ? this.beautifyCode(row[KS_FUNCTION]) : row[KS_FUNCTION]) +
                (row[KS_DESC] ? ", " + this.toStringForm(row[KS_DESC]) : "") +
                ksNoRepeatString + ");\n";

            // push all prefix key
            if (row[KS_KEY_STRING].length) {
                sequence = row[KS_KEY_STRING].split(" ");
                if (sequence.length > 1) {
                    sequence.pop();
                    if (!prefixKeys[row[KS_MODE]])
                        prefixKeys[row[KS_MODE]] = {};
                    prefixKeys[row[KS_MODE]][sequence.join(" ")] = true;
                }
            }

            aContentHolder.push(src);
        }

        var crushingIndexList = [];

        // check whether commands overwrite other prefix key
        for (i = 0; i < data.length; ++i) {
            row = data[i];

            if (row[0] == null)
                continue;

            if (prefixKeys[row[KS_MODE]][row[KS_KEY_STRING]]) {
                crushingIndexList.push(i);
            }
        }

        return crushingIndexList.length ? crushingIndexList : null;
    },

    // ============================== Add builtin command ============================== //

    addBuiltinCommand: function () {
        var params = {
            out: null
        };

        var features = "chrome,modal,all,resizable";
	document.documentElement.openSubDialog("chrome://keysnail/content/builtinviewer.xul",
                                               features, params);

        if (!params.out)
            return;

        ksKeybindTreeView.appendItem(params.out);
    },

    msgTimeOut: null,
    notify: function (aMsg, aTime) {
        var messageBox = document.getElementById("notification-area");
        var createButtonArea = document.getElementById("create-button-area");

        if (this.msgTimeOut) {
            clearTimeout(this.msgTimeOut);
            this.msgTimeOut = null;
        }

        messageBox.value = aMsg;

        messageBox.collapsed       = !aMsg;
        createButtonArea.collapsed = !messageBox.collapsed;

        let self = this;
        if (aTime) {
            this.msgTimeOut = setTimeout(
                function () {
                    self.notify("", 0);
                }, aTime);
        }
    }
};

const KS_MODE         = 0;
const KS_KEY_STRING   = 1;
const KS_DESC         = 2;
const KS_FUNCTION     = 3;
const KS_ARGUMENT     = 4;
const KS_EXTERNAL     = 5;
const KS_TREE_COUNT   = 6;

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

        this.currentModeIndex = 1;
        this.initKeyBindingData(this.data, this.modules.key.keyMapHolder[this.modules.key.modes.VIEW]);
        this.data.push([null, null, null, null]);

        this.currentModeIndex = 2;
        this.initKeyBindingData(this.data, this.modules.key.keyMapHolder[this.modules.key.modes.EDIT]);
        this.data.push([null, null, null, null]);

        this.currentModeIndex = 3;
        this.initKeyBindingData(this.data, this.modules.key.keyMapHolder[this.modules.key.modes.CARET]);

        this.currentModeIndex = 0;

        this.repeatYes = this.modules.util.getLocaleString("repeatWhenPrefixArgumentGivenYes");
        this.repeatNo = this.modules.util.getLocaleString("repeatWhenPrefixArgumentGivenNo");
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

                row[KS_MODE]       = this.currentModeIndex;
                row[KS_KEY_STRING] = keyString;
                row[KS_DESC]       = func.ksDescription;
                row[KS_ARGUMENT]   = func.ksNoRepeat;
                row[KS_EXTERNAL]   = func.ksDefinedInExternalFile;

                // special case (method of the modules)
                var found = false;
                ["command", "my"].forEach(
                    function (moduleName) {
                        if (found)
                            return;

                        var property = this.isMemberOf(func, this.modules[moduleName]);
                        if (property) {
                            row[KS_FUNCTION] = moduleName + "." + property;
                            found = true;
                        }
                    }, this);
                if (!found)
                    row[KS_FUNCTION] = func.toString();

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

    checkSyntax: function () {
        var i = this.currentIndex;
        if (i < 0)
            return null;

        var src = this.data[i][KS_FUNCTION];

        try {
            with (this.modules) {
                eval("(function(f){})(" + src + ")");
            }
        } catch (x) {
            return x.message;
        }
        return null;
    },

    deleteItemAt: function (aIndex) {
        if (!this.isNotConfigurable(aIndex)) {
            this.data.splice(aIndex, 1);
            this._treeBoxObject.rowCountChanged(aIndex, -1);
            this.selection.select(aIndex < this.data.length ? aIndex : this.data.length - 1);
            this.update();

            return aIndex;
        }

        return -1;
    },

    deleteSelectedItem: function () {
        return this.deleteItemAt(this.currentIndex);
    },

    appendItem: function (aInit) {
        var newItem = new Array(4);

        newItem[KS_KEY_STRING] = "";
        if (aInit) {
            newItem[KS_DESC]     = aInit.desc;
            newItem[KS_ARGUMENT] = aInit.arg;
            newItem[KS_FUNCTION] = ksPreference.beautifyCode(aInit.func);
            newItem[KS_MODE]     = aInit.mode;
        } else {
            newItem[KS_DESC]     = "";
            newItem[KS_ARGUMENT] = false;
            newItem[KS_FUNCTION] =
                "function (ev, arg) {\n" +
                "    // " + ksPreference.modules.util.getLocaleString("putYourCodesHere") +
                "\n" +
                "\n}";
            newItem[KS_MODE]     = 0;
        }

        this.data.push(newItem);
        var newIdx = this.rowCount - 1;
        this._treeBoxObject.rowCountChanged(newIdx, 1);
        this.selection.select(newIdx);
        this._treeBoxObject.ensureRowIsVisible(newIdx);
        ksPreference.keybindTextarea.focus();

        if (!aInit)
            ksPreference.toggleEditView();

        this.changed = true;
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

    isNotConfigurable: function (index) {
        if (index < 0)
            return true;
        return this.isSeparator(index) || this.data[index][KS_EXTERNAL];
    },

    get currentIndex()  {
        return (this.selection.count) ? this.selection.currentIndex : -1;
    },

    // Tree view interfaces
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
        return (this.data[index][KS_KEY_STRING] == null);
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
            return this.data[row][KS_DESC];
            case KS_FUNCTION:
            return this.data[row][KS_FUNCTION];
            case KS_ARGUMENT:
            return this.data[row][KS_ARGUMENT] ? this.repeatNo : this.repeatYes;
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
    isSelectable: function (row, col) {
        return !this.isNotConfigurable(row);
    },
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
     ksKeybindTreeView.browserWindow = browserWindow;
 })();
