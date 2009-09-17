var ksBuiltinViewer = {
    onLoad: function () {
        this.categoryListBox = document.getElementById("category-listbox");
        this.functionTextBox = document.getElementById("function-textbox");
        this.commandsListBox = document.getElementById("commands-listbox");

        this.initCategoryListBox();

        // select first category
        this.categoryListBox.selectedIndex = 0;
        this.updateCommandsList(0);
    },

    onFinish: function () {
        if (this.commandsListBox.selectedItem) {
            var category, name;
            [category, name] = this.commandsListBox.selectedItem.value.split(",");

            window.arguments[0].out = {
                desc: this.commandsListBox.selectedItem.label,
                arg: ksBuiltin[category][name][1],
                func: ksBuiltin[category][name][0],
                mode: ksBuiltin[category].__mode__
            };
        }

        return true;
    },

    initCategoryListBox: function () {
        for (var category in ksBuiltin) {
            this.categoryListBox.appendItem(this.getLocaleStringNoArg(category), category);
        }
    },

    updateCommandsList: function (aIndex) {
        var category = this.categoryListBox.getItemAtIndex(aIndex).value;
        var commands = ksBuiltin[category];

        this.removeAllChilds(this.commandsListBox);

        for (var name in commands) {
            if (name == "__mode__")
                continue;

            this.commandsListBox.appendItem(this.getLocaleStringNoArg(name), category + "," + name);
        }
    },

    // ============================== event handlers ============================== //

    handleCategoryListBox: function (aEvent) {
        switch (aEvent.type) {
            case 'select':
            var i = this.categoryListBox.selectedIndex;
            this.updateCommandsList(i);
            break;
        }
    },

    handleCommandsListBox: function (aEvent) {
        switch (aEvent.type) {
        case 'select':
            var i = this.commandsListBox.selectedIndex;
            var item = this.commandsListBox.selectedItem;
            if (item) {
                var category, name;
                [category, name] = item.value.split(",");
                this.functionTextBox.value = ksBuiltin[category][name][0];
            } else {
                this.functionTextBox.value = "";
            }
            break;
        }
    },

    removeAllChilds: function (aElement) {
        while (aElement.hasChildNodes()) {
            aElement.removeChild(aElement.firstChild);
        }
    },

    stringBundle: null,
    getLocaleStringNoArg: function (aStringKey) {
        if (!this.stringBundle) {
            const kBundleURI = "chrome://keysnail/locale/functions.properties";
            var bundleSvc = Components.classes["@mozilla.org/intl/stringbundle;1"]
                .getService(Components.interfaces.nsIStringBundleService);
            this.stringBundle = bundleSvc.createBundle(kBundleURI);
        }
        try {
            return this.stringBundle.GetStringFromName(aStringKey);    
        } catch (x) {
            return aStringKey;
        }
    }
};
