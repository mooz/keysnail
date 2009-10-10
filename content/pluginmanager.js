var ksPluginManager = function () {
    var modules;

    var doc;
    var container;
    var pluginDescriptionFrame;

    var userLocale;

    function createElementWithText(aElemName, aText) {
        var elem = doc.createElement(aElemName);
        elem.appendChild(doc.createTextNode(aText));

        return elem;
    }

    function getLocalString(aNodes) {
        if (typeof aNodes == "string")
            return aNodes;

        modules.util.message(typeof aNodes);

        var length = aNodes.length();

        for (var i = 0; i < length; ++i) {
            if (aNodes[i].@lang.toString() == userLocale)
                return aNodes[i].text();
        }

        return aNodes[0].text();
    }

    function createDomObject() {
        container.appendChild(createElementWithText("h2", "プラグイン一覧"));

        var ul = doc.createElement("ul");

        for (var pluginFileName in modules.plugins) {
            var pluginInfo = modules.plugins[pluginFileName].PLUGIN_INFO;

            var li = doc.createElement("li");
            li.appendChild(doc.createTextNode(pluginFileName));

            if (pluginInfo) {
                var info = new XML(modules.L(pluginInfo));

                var dl = doc.createElement("dl");

                var tags = ["name", "description", "author"];

                tags.forEach(
                    function (tag) {
                        var dt = createElementWithText("dt", getLocalString(tag));
                        var dd = createElementWithText("dd", getLocalString(info[tag]));
                        dl.appendChild(dt);
                        dl.appendChild(dd);
                    });

                li.appendChild(dl);
            }

            ul.appendChild(li);
        }

        container.appendChild(ul);
    }

    var self = {
        onLoad: function () {
            userLocale = modules.util.getUnicharPref("general.useragent.locale");

            userLocale = {
                // ja
                "ja"        : "ja",
                "ja-JP"     : "ja",
                "ja-JP-mac" : "ja",
                "ja_JP"     : "ja",
                "JP"        : "ja",
                // en
                "en-US"     : "en"
            }[userLocale] || "en";

            pluginDescriptionFrame = document.getElementById("plugin-description");
            doc = pluginDescriptionFrame.contentDocument;
            container = doc.getElementById("container");
            createDomObject();
        },

        onFinish: function () {
            return true;
        },

        set modules(aModules) {
            modules = aModules;
        }
    };

    return self;
}();

(function () {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);
     var browserWindow = wm.getMostRecentWindow("navigator:browser");
     ksPluginManager.modules = browserWindow.KeySnail.modules;
 })();
