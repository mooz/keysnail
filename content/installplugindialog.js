var ksInstallPluginDialog = function () {
    var modules;

    var dom;
    var pluginPath;

    var defaultIconURL = "chrome://keysnail/skin/script.png";

    function setInfo() {
        var xml = window.arguments[0].xml;

        if (!xml)
            return;

        function setAttributeFromXml(destination, attribute, xml) {
            destination.setAttribute(attribute, modules.util.xmlGetLocaleString(xml));
        }

        setAttributeFromXml(dom["plugin-info-name"]        , "value", xml.name);
        setAttributeFromXml(dom["plugin-info-description"] , "value", xml.description);
        setAttributeFromXml(dom["plugin-info-version"]     , "value", xml.version);

        dom["plugin-info-icon"].setAttribute("src",
                                             modules.util.xmlGetLocaleString(xml.iconURL) ||
                                             defaultIconURL);
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
        var xml       = window.arguments[0].xml;
        var pluginURL = window.arguments[0].pluginURL;

        if (!xml)
            return;

        var item;

        dom["plugin-script-list"].appendChild(
            createScriptItem(pluginURL));

        for (let [, script] in Iterator(xml.require.script))
        {
            dom["plugin-script-list"].appendChild(
                createScriptItem(script.text()));
        }
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
            dom = new Object();

            ids.forEach(
                function (id) {
                    dom[id] = document.getElementById(id);
                }
            );

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
