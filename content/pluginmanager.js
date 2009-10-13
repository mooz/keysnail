var ksPluginManager = function () {
    var modules;

    var parserContext;

    // ==== holder ==== //

    // you can access each plugin's E4X XML object by xmlHolder[pluginFileName]
    var xmlHolder;
    var infoHolder;

    // ==== iframe dom objects ==== //

    var iframeDoc;
    var container;
    var infoBox;
    var detailBox;

    // ==== XUL DOM objects ==== //

    var pluginDescriptionFrame;
    var pluginListbox;
    var pluginStatusCheckbox;

    // ==== other values ==== //

    var defaultIconURL = "chrome://keysnail/skin/script.png";
    var disabledIconURL = "chrome://keysnail/skin/script-disabled.png";

    function createElementWithText(aElemName, aText) {
        var elem = iframeDoc.createElement(aElemName);
        elem.appendChild(iframeDoc.createTextNode(aText));

        return elem;
    }

    function removeAllChilds(aElement) {
        while (aElement.hasChildNodes()) {
            aElement.removeChild(aElement.firstChild);
        }
    }

    function initPluginList() {
        removeAllChilds(pluginListbox);

        xmlHolder  = new Object;
        infoHolder = new Object;

        var tags = ["name", "description", "version", "author", "updateURL",
                    "iconURL", "license", "minVersion", "maxVersion", "detail"];

        for (var pluginPath in modules.plugins.context) {
            var plugin = modules.plugins.context[pluginPath];

            // for disabled (not loaded) plugin
            // open script and read it's PLUGIN_INFO value
            if (!plugin.__ksLoaded__) {
                try {
                    var script = modules.util.readTextFile(pluginPath);
                    var xml = modules.userscript.getPluginInformation(script.value);
                    plugin.PLUGIN_INFO = xml;
                } catch (x) {
                    continue;
                }
            }

            var pluginInfo = plugin.PLUGIN_INFO;
            xmlHolder[pluginPath] = pluginInfo;

            var pluginName;

            var item = content.document.createElement("listitem");
            item.setAttribute("class", "listitem-iconic");

            infoHolder[pluginPath] = new Object();

            // get common info
            if (pluginInfo) {
                var infoXML = (typeof pluginInfo == "xml") ? pluginInfo
                    : new XML(modules.L((typeof pluginInfo == "string") ? pluginInfo : ""));

                tags.forEach(
                    function (tag) {
                        infoHolder[pluginPath][tag] = modules.L(modules.util.xmlGetLocaleString(infoXML[tag]));
                    });
            }

            // set name
            pluginName = infoHolder[pluginPath].name;
            if (!pluginName) {
                pluginName = plugin.__ksFileName__;
                infoHolder[pluginPath].name = pluginName;
            }
            item.setAttribute("label", pluginName);

            // set icon
            item.setAttribute("image", infoHolder[pluginPath].iconURL || defaultIconURL);

            // key value
            item.value = pluginPath;

            item.setAttribute("disabled", !plugin.__ksLoaded__);
            infoHolder[pluginPath].status = plugin.__ksLoaded__;

            pluginListbox.appendChild(item);
        }
    }

    function updateInfoBox(aPluginPath) {
        var h2 = createElementWithText("h2", infoHolder[aPluginPath].name);
        var description = createElementWithText("p", infoHolder[aPluginPath].description || "");

        var dl = iframeDoc.createElement("dl");
        var tags = ["version", "author", "license"];
        var h3 = createElementWithText("h3", modules.util.getLocaleString("info"));

        tags.forEach(
            function (tag) {
                if (infoHolder[aPluginPath][tag]) {
                    var dt = createElementWithText("dt", tag);
                    var dd = createElementWithText("dd", infoHolder[aPluginPath][tag]);
                    dl.appendChild(dt);
                    dl.appendChild(dd);
                }
            }, this);

        removeAllChilds(infoBox);

        infoBox.appendChild(h2);
        infoBox.appendChild(description);

        infoBox.appendChild(h3);
        infoBox.appendChild(dl);

        var xml = xmlHolder[aPluginPath];
        var table, tr, th, td;

        // ext

        if (xml.provides.ext.length()) {
            h3 = createElementWithText("h3", modules.util.getLocaleString("ext"));
            table = iframeDoc.createElement("table");

            tr = iframeDoc.createElement("tr");
            tr.appendChild(createElementWithText("th", "Name"));
            tr.appendChild(createElementWithText("th", "Description"));
            table.appendChild(tr);

            for each (var ext in xml.provides.ext) {
                var extName        = ext.text();
                var extDescription = modules.ext.description(extName);

                tr = iframeDoc.createElement("tr");
                tr.appendChild(createElementWithText("td", extName));
                tr.appendChild(createElementWithText("td", extDescription));

                table.appendChild(tr);
            }

            infoBox.appendChild(h3);
            infoBox.appendChild(table);
        }

        // option

        if (xml.options.option.length()) {
            h3 = createElementWithText("h3", modules.util.getLocaleString("option"));
            table = iframeDoc.createElement("table");

            tr = iframeDoc.createElement("tr");
            tr.appendChild(createElementWithText("th", "Name"));
            tr.appendChild(createElementWithText("th", "Type"));
            tr.appendChild(createElementWithText("th", "Description"));
            table.appendChild(tr);

            for each (var option in xml.options.option) {
                var optionName        = option.name.text();
                var optionType        = option.type.text();
                var optionDescription = modules.L(modules.util.xmlGetLocaleString(option.description));

                tr = iframeDoc.createElement("tr");
                tr.appendChild(createElementWithText("td", optionName));
                tr.appendChild(createElementWithText("td", optionType));
                tr.appendChild(createElementWithText("td", optionDescription));

                table.appendChild(tr);
            }

            infoBox.appendChild(h3);
            infoBox.appendChild(table);
        }
    }

    function updateDetailBox(aPluginPath) {
        if (infoHolder[aPluginPath].detail) {
            var xml;

            if (infoHolder[aPluginPath].xmlCache) {
                xml = infoHolder[aPluginPath].xmlCache;
            } else {
                var parser = new parserContext.WikiParser(infoHolder[aPluginPath].detail);
                xml = parser.parse();
                infoHolder[aPluginPath].xmlCache = xml;
            }

            detailBox.innerHTML = xml;
        } else {
            detailBox.innerHTML = "<p>Not documented.</p>";
        }
    }

    function updateDisabledPluginList() {
        var disabledPlugins = [];

        for (pluginPath in infoHolder) {
            if (!infoHolder[pluginPath].status) {
                disabledPlugins.push(pluginPath);
            }
        }

        modules.util.setUnicharPref("extensions.keysnail.plugin.disabled_plugins",
                                    disabledPlugins.join(","));
        modules.userscript.disabledPlugins = disabledPlugins;
    }

    var self = {
        onLoad: function () {
            pluginStatusCheckbox = document.getElementById("plugin-status-checkbox");

            pluginDescriptionFrame = content.document.getElementById("plugin-description");
            pluginListbox          = content.document.getElementById("plugin-listbox");

            iframeDoc = pluginDescriptionFrame.contentDocument;
            container = iframeDoc.getElementById("container");
            infoBox   = iframeDoc.getElementById("info-box");
            detailBox = iframeDoc.getElementById("detail-box");

            parserContext = {};

            // load Wiki parser
            try {
                Components.utils.import("resource://keysnail-share/WikiParser.js", parserContext);
            } catch (x) {
                modules.message(x);
            }

            initPluginList();
        },

        pluginListboxOnSelect: function (aEvent) {
            // detail
            var item       = aEvent.target;
            var pluginPath = item.value;

            pluginStatusCheckbox.setAttribute("checked", infoHolder[pluginPath].status);

            updateInfoBox(pluginPath);
            updateDetailBox(pluginPath);
        },

        togglePluginStatus: function (aEvent) {
            // detail
            var item = pluginListbox.selectedItem;
            if (!item)
                return;

            var pluginPath = item.value;
            var status = !infoHolder[pluginPath].status;

            infoHolder[pluginPath].status = status;
            item.setAttribute("disabled", !status);

            if (status) {
                if (!modules.plugins.context[pluginPath].__ksLoaded__) {
                    // to prevent this plugin considered as the "disabled"
                    updateDisabledPluginList();

                    // load plugin now
                    modules.userscript.loadPlugin(modules.util.openFile(pluginPath));

                    if (!modules.plugins.context[pluginPath].__ksLoaded__) {
                        // failed to load plugin
                        modules.util.alert(window, "Failed to load plugin",
                                           'Failed to load plugin "' + pluginPath + '"');

                        infoHolder[pluginPath].status = false;
                        item.setAttribute("disabled", true);

                        // FIXME: how awful ...
                        setTimeout(function () {
                                       pluginStatusCheckbox.setAttribute("checked", false);
                                   }, 0);
                    }
                }
            } else {
                modules.plugins.context[pluginPath].__ksLoaded__ = false;
            }

            updateDisabledPluginList();
        },

        reloadPlugin: function () {
            modules.plugins.context = {};
            modules.userscript.loadPlugins();
            initPluginList();
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


