var ksInstallPluginDialog = function () {
    var modules;

    var elementContainer;
    var pluginPath;

    function setInfo() {
        var pluginInfo = window.arguments[0].pluginInfo;

        if (!pluginInfo)
            return;

        elementContainer["plugin-info-name"].setAttribute("value", pluginInfo.name);
        elementContainer["plugin-info-description"].setAttribute("value", pluginInfo.description);
        elementContainer["plugin-info-version"].setAttribute("value", pluginInfo.version);
        elementContainer["plugin-info-icon"].setAttribute("src", pluginInfo.iconURL);
    }

    function createScriptItem(aURL) {
        var item = document.createElement("richlistitem");

        var vbox = document.createElement("vbox");
        var hbox = document.createElement("hbox");

        var scriptName = document.createElement("description");
        scriptName.setAttribute("value", modules.util.getLeafNameFromURL(aURL));
        scriptName.setAttribute("class", "script-name");
        hbox.appendChild(scriptName);

        vbox.appendChild(hbox);

        var scriptURL = document.createElement("description");
        scriptURL.setAttribute("value", aURL);
        scriptURL.setAttribute("class", "script-url");

        vbox.appendChild(scriptURL);
        item.appendChild(vbox);

        return item;
    }

    function setScriptList() {
        var pluginInfo = window.arguments[0].pluginInfo;
        var pluginURL  = window.arguments[0].pluginURL;

        if (!pluginInfo)
            return;

        var item;

        elementContainer["plugin-script-list"].appendChild(createScriptItem(pluginURL));

        pluginInfo.requiredScripts.forEach(function (scriptURL) {
            elementContainer["plugin-script-list"].appendChild(createScriptItem(scriptURL));
        });
    }

    var self = {
        set modules(aModules) {
            modules = aModules;
        },

        onLoad: function () {
            var ids = ["plugin-info-icon",
                       "plugin-info-name",
                       "plugin-info-description",
                       "plugin-script-list",
                       "plugin-info-version"];
            elementContainer = new Object();

            ids.forEach(function (id) {
                elementContainer[id] = document.getElementById(id);
            });

            pluginPath = window.arguments[0].pluginPath;
            setInfo();
            setScriptList();
        },

        onAccept: function () {
            window.arguments[0].type = "install";

            return true;
        },

        onCancel: function () {
            return true;
        },

        onViewSource: function () {
            window.arguments[0].type = "viewsource";

            document.getElementById("keysnail-install-plugin-dialog").cancelDialog();

            return true;
        }
    };

    return self;
}();

(function () {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
    var browserWindow = wm.getMostRecentWindow("navigator:browser");
    ksInstallPluginDialog.modules = browserWindow.KeySnail.modules;
})();
