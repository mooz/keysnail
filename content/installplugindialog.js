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

        setAttributeFromXml(dom["plugin-info-icon"]        , "src",   xml.iconURL || defaultIconURL);
        setAttributeFromXml(dom["plugin-info-name"]        , "value", xml.name);
        setAttributeFromXml(dom["plugin-info-description"] , "value", xml.description);
        setAttributeFromXml(dom["plugin-info-author"]      , "value", xml.author);
        setAttributeFromXml(dom["plugin-info-version"]     , "value", xml.version);
    }

    var self = {
        set modules(aModules) {
            modules = aModules;
        },

        onLoad: function () {
            var ids = ["plugin-info-icon",
                       "plugin-info-name",
                       "plugin-info-description",
                       "plugin-info-author",
                       "plugin-info-version"];
            dom = new Object();

            ids.forEach(
                function (id) {
                    dom[id] = document.getElementById(id);
                }
            );

            pluginPath = window.arguments[0].pluginPath;
            setInfo();
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
