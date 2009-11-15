var ksPluginManager = function () {
    var modules;

    var parserContext;

    // ==== holder ==== //

    // you can access each plugin's E4X XML object by xmlHolder[pluginFileName]
    var xmlHolder;
    var infoHolder;
    var xulHolder;

    // ==== iframe dom objects ==== //

    var iframeDoc;
    var container;
    var helpBox;
    var infoBox;
    var detailBox;

    // ==== XUL DOM objects ==== //

    var pluginDescriptionFrame;
    var pluginListbox;

    // ==== other values ==== //

    var defaultIconURL = "chrome://keysnail/skin/script.png";

    const KS_PLUGIN_DISABLED      = 0;
    const KS_PLUGIN_ENABLED       = 1;
    const KS_PLUGIN_NOTCOMPATIBLE = 2;

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

    function xmlToDom(xml, xmlns) {
        var doc = (new DOMParser).parseFromString(
            '<root xmlns="' + xmlns + '">' + xml.toXMLString() + "</root>",
            "application/xml");
        var imported = document.importNode(doc.documentElement, true);
        var range = document.createRange();
        range.selectNodeContents(imported);
        var fragment = range.extractContents();
        range.detach();
        return fragment.childNodes.length > 1 ? fragment : fragment.firstChild;
    }

    function initPluginList() {
        removeAllChilds(pluginListbox);

        xmlHolder  = new Object;
        infoHolder = new Object;
        xulHolder  = new Object;

        var tags = ["name", "description", "version", "author", "updateURL",
                    "iconURL", "license", "minVersion", "maxVersion", "detail"];

        for (var pluginPath in modules.plugins.context) {
            var plugin = modules.plugins.context[pluginPath];

            var isDisabled      = modules.userscript.isDisabledPlugin(pluginPath);
            var isNotCompatible = plugin.__ksNotCompatible__;

            // for not loaded plugin
            // open script and read it's PLUGIN_INFO value
            if (!plugin.__ksLoaded__) {
                try {
                    var script = modules.util.readTextFile(pluginPath);
                    var xml = modules.userscript.getPluginInformation(script);
                    plugin.PLUGIN_INFO = xml;
                } catch (x) {
                    continue;
                }
            }

            var pluginInfo = plugin.PLUGIN_INFO;
            xmlHolder[pluginPath] = pluginInfo;

            var pluginName;

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

            // var pluginRichBoxItem =
            //    <pluginWhole>
            //        <pluginHeader>
            //            <imageContainer>
            //                <image />
            //            </imageContainer>
            //            <infoContainer>
            //                <hbox><description>名前</description><description>バージョン</description></hbox>
            //                <description>説明</description>
            //            </infoContainer>
            //        </pluginHeader>
            //
            //        <buttonsContainer>
            //            <button label="無効化" />
            //            <button label="削除" />
            //        </buttonsContainer>
            //    </pluginWhole>;

            // set name
            pluginName = infoHolder[pluginPath].name;
            if (!pluginName) {
                pluginName = plugin.__ksFileName__;
                infoHolder[pluginPath].name = pluginName;
            }

            // ======================================== //

            xulHolder[pluginPath] = new Object();

            var item = document.createElement("richlistitem");
            item.setAttribute("class", "plugin-listitem");
            xulHolder[pluginPath].item = item;

            var pluginWhole = document.createElement("vbox");
            pluginWhole.flex = 1;

            var buttonsContainer = document.createElement("hbox");
            buttonsContainer.flex = 1;

            var pluginHeader = document.createElement("hbox");
            pluginHeader.setAttribute("align", "center");
            pluginHeader.setAttribute("id", "center");

            var imageContainer = document.createElement("vbox");
            imageContainer.setAttribute("align", "center");

            var image = document.createElement("image");
            image.setAttribute("class", "plugin-icon");
            image.setAttribute("src", infoHolder[pluginPath].iconURL || defaultIconURL);
            imageContainer.appendChild(image);

            var description;
            var pluginNameContainer = document.createElement("hbox");

            description= document.createElement("description");
            description.setAttribute("value", pluginName);
            description.setAttribute("class", "plugin-name");
            pluginNameContainer.appendChild(description);

            description= document.createElement("description");
            description.setAttribute("value", infoHolder[pluginPath].version);
            description.setAttribute("class", "plugin-version");
            pluginNameContainer.appendChild(description);

            var infoContainer = document.createElement("vbox");
            infoContainer.appendChild(pluginNameContainer);

            // plugin description
            description = document.createElement("description");
            description.setAttribute("value", infoHolder[pluginPath].description);
            infoContainer.appendChild(description);

            // notification (for not compatible plugin)
            description = document.createElement("description");
            description.setAttribute("hidden", "true");
            description.setAttribute("style", "font-weight:bold;");
            infoContainer.appendChild(description);
            xulHolder[pluginPath].notification = description;

            pluginHeader.appendChild(imageContainer);
            pluginHeader.appendChild(infoContainer);

            var button;

            button = document.createElement("button");
            button.setAttribute("label", modules.util.getLocaleString("checkForUpdates"));
            button.setAttribute("accesskey", "c");
            button.onclick = checkForUpdatesButtonClicked;
            buttonsContainer.appendChild(button);
            xulHolder[pluginPath].checkForUpdatesButton = button;

            var spacer = document.createElement("spacer");
            spacer.flex = 1;
            buttonsContainer.appendChild(spacer);

            button = document.createElement("button");
            button.setAttribute("label", modules.util.getLocaleString("enable"));
            button.setAttribute("accesskey", "e");
            button.setAttribute("hidden", "true");
            button.onclick = enableButtonClicked;
            buttonsContainer.appendChild(button);
            xulHolder[pluginPath].enableButton = button;

            button = document.createElement("button");
            button.setAttribute("label", modules.util.getLocaleString("disable"));
            button.setAttribute("accesskey", "d");
            button.onclick = disableButtonClicked;
            buttonsContainer.appendChild(button);
            xulHolder[pluginPath].disableButton = button;

            button = document.createElement("button");
            button.setAttribute("label", modules.util.getLocaleString("delete"));
            button.setAttribute("accesskey", "u");
            button.onclick = deleteButtonClicked;
            buttonsContainer.appendChild(button);

            buttonsContainer.setAttribute("hidden", "true");

            pluginWhole.appendChild(pluginHeader);
            pluginWhole.appendChild(buttonsContainer);

            item.appendChild(pluginWhole);

            xulHolder[pluginPath].imageContainer   = imageContainer;
            xulHolder[pluginPath].infoContainer    = infoContainer;
            xulHolder[pluginPath].buttonsContainer = buttonsContainer;
            xulHolder[pluginPath].pluginHeader     = pluginHeader;

            // ======================================== //

            // key value
            item.value = pluginPath;

            var status =
                isNotCompatible ? KS_PLUGIN_NOTCOMPATIBLE :
                isDisabled      ? KS_PLUGIN_DISABLED : KS_PLUGIN_ENABLED;

            setPluginStatus(pluginPath, status);

            pluginListbox.appendChild(item);
        }
    }

    function setElementStatus(aElement, aStatus) {
        aElement.setAttribute("style", "opacity:" + (aStatus ? "1.0" : "0.45"));
    }

    function setPluginStatus(aPluginPath, aStatus) {
        infoHolder[aPluginPath].status = aStatus;

        var isEnabled = (aStatus == KS_PLUGIN_ENABLED);

        setElementStatus(xulHolder[aPluginPath].infoContainer, isEnabled);
        setElementStatus(xulHolder[aPluginPath].imageContainer, isEnabled);

        xulHolder[aPluginPath].enableButton.hidden = isEnabled;
        xulHolder[aPluginPath].disableButton.hidden = !isEnabled;

        if (aStatus == KS_PLUGIN_NOTCOMPATIBLE) {
            xulHolder[aPluginPath].enableButton.setAttribute("disabled", true);
        }
    }

    function updateInfoBox(aPluginPath) {
        var title = infoHolder[aPluginPath].name +
            (infoHolder[aPluginPath].version ? " " + infoHolder[aPluginPath].version : "");
        var h2 = createElementWithText("h2", title);

        var description = createElementWithText("p", infoHolder[aPluginPath].description || "");

        // ====================================================================== //

        var h3 = createElementWithText("h3", modules.util.getLocaleString("info"));

        var authorCell;
        if (xmlHolder[aPluginPath].author.length())
        {
            var authorMailAddress = xmlHolder[aPluginPath].author.@mail;
            var authorName = infoHolder[aPluginPath].author;
            if (authorMailAddress.length())
            {
                authorCell = <a href={'mailto:' + authorMailAddress}>{authorName}</a>;
            }
            else
            {
                authorCell = <>{authorName}</>;
            }

            var authorHomepage = xmlHolder[aPluginPath].author.@homepage;
            if (authorHomepage.length())
            {
                authorCell += <> [ <a href={authorHomepage} target="_blank">Home page</a> ]</>;
            }
        }

        // license
        var licenseCell;
        if (xmlHolder[aPluginPath].license.length())
        {

            var licenseDocumentURL = xmlHolder[aPluginPath].license.@document;
            if (licenseDocumentURL.length())
            {
                licenseCell = <a href={licenseDocumentURL} target="_blank">{infoHolder[aPluginPath].license}</a>;
            }
            else
            {
                licenseCell = <>{infoHolder[aPluginPath].license}</>;
            }
        }

        // compatible version

        var min     = infoHolder[aPluginPath].minVersion;
        var max     = infoHolder[aPluginPath].maxVersion;

        var versionMsg = "";
        if (min)
            versionMsg += modules.util.getLocaleString("compatibleMinVersion", [min]);
        if (max)
            versionMsg += (min ? " " : "") + modules.util.getLocaleString("compatibleMinVersion", [max]);

        // ====================================================================== //

        var table = xmlToDom(<table>
                             <tr>
                             <td>{modules.util.getLocaleString("author")}</td>
                             <td>{authorCell}</td>
                             </tr>
                             <tr>
                             <td>{modules.util.getLocaleString("license")}</td>
                             <td>{licenseCell}</td>
                             </tr>
                             <tr>
                             <td>{modules.util.getLocaleString("compatibleVersion")}</td>
                             <td>{versionMsg}</td>
                             </tr>
                             </table>
                             ,"http://www.w3.org/1999/xhtml");

        // ====================================================================== //

        // now append elements to infoBox
        removeAllChilds(infoBox);

        infoBox.appendChild(h2);
        infoBox.appendChild(description);

        infoBox.appendChild(h3);
        infoBox.appendChild(table);

        // ============================== ext / option ============================== //

        var xml = xmlHolder[aPluginPath];
        var tr, th, td;

        // ext
        if (xml.provides.ext.length()) {
            h3 = createElementWithText("h3", modules.util.getLocaleString("ext"));
            table = iframeDoc.createElement("table");

            tr = iframeDoc.createElement("tr");
            tr.appendChild(createElementWithText("th", modules.util.getLocaleString("name")));
            tr.appendChild(createElementWithText("th", modules.util.getLocaleString("description")));
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
            tr.appendChild(createElementWithText("th", modules.util.getLocaleString("name")));
            tr.appendChild(createElementWithText("th", modules.util.getLocaleString("type")));
            tr.appendChild(createElementWithText("th", modules.util.getLocaleString("description")));
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
    }

    function checkForUpdatesButtonClicked(aEvent) {
        var item = pluginListbox.selectedItem;
        if (!item)
            return;

        var pluginPath = item.value;

        try {
            var updated = modules.userscript.updatePlugin(pluginPath);
            if (updated)
                initPluginList();
        } catch (x) {
            modules.display.notify(x);
        }
    }

    function disableButtonClicked(aEvent) {
        var item = pluginListbox.selectedItem;
        if (!item)
            return;

        var pluginPath = item.value;
        var status = infoHolder[pluginPath].status;

        setPluginStatus(pluginPath, KS_PLUGIN_DISABLED);
        updateDisabledPluginList();

        modules.display.echoStatusBar(infoHolder[pluginPath].name + " disabled", 2000);
    }

    function enableButtonClicked(aEvent) {
        var item = pluginListbox.selectedItem;
        if (!item)
            return;

        var pluginPath = item.value;
        var status = infoHolder[pluginPath].status;

        if (status == KS_PLUGIN_NOTCOMPATIBLE) {
            return;
        }

        setPluginStatus(pluginPath, KS_PLUGIN_ENABLED);

        if (modules.plugins.context[pluginPath].__ksLoaded__) {
            modules.display.echoStatusBar(infoHolder[pluginPath].name + " enabled", 2000);
        } else {
            // plugin is not loaded

            // to prevent this plugin considered as the "disabled"
            updateDisabledPluginList();

            // load plugin now
            modules.userscript.loadPlugin(modules.util.openFile(pluginPath));

            if (!modules.plugins.context[pluginPath].__ksLoaded__) {
                // failed to load plugin
                setPluginStatus(pluginPath, modules.plugins.context[pluginPath].__ksNotCompatible__ ?
                                KS_PLUGIN_NOTCOMPATIBLE : KS_PLUGIN_DISABLED);

                var msg = modules.util.getLocaleString("failedToLoadPlugin");
                modules.util.alert(msg, msg + ' "' + pluginPath + '"');
            }
        }

        updateDisabledPluginList();
    }

    function deleteButtonClicked(aEvent) {
        var item = pluginListbox.selectedItem;
        if (!item)
            return;

        var pluginPath = item.value;

        var reallyDelete = modules.util.confirm(modules.util.getLocaleString("deletePluginTitle",
                                                                             [infoHolder[pluginPath].name]),
                                                modules.util.getLocaleString("deletePluginMessage",
                                                                             [infoHolder[pluginPath].name]));

        if (reallyDelete) {
            var file = modules.util.openFile(pluginPath);
            if (file && file.exists()) {
                try {
                    modules.userscript.uninstallPlugin(file);
                    delete modules.plugins.context[pluginPath];
                    pluginListbox.removeItemAt(pluginListbox.selectedIndex);
                    modules.display.notify(modules.util.getLocaleString("pluginDeleted"));
                } catch (x) {}
            }
        }
    }

    function selectNewlyInstalledPlugin() {
        var holder = xulHolder[modules.userscript.newlyInstalledPlugin];
        if (holder && holder.item) {
            pluginListbox.selectedItem = holder.item;
        }

        modules.display.notify(modules.util.getLocaleString("newPluginInstalled"));
    }

    function getNotCompatibleMessage(aPluginPath) {
        var current = modules.userscript.parent.version;

        return modules.util.getLocaleString("notCompatiblePlugin", [current]);
    }

    var self = {
        onLoad: function () {
            pluginDescriptionFrame = document.getElementById("plugin-description");
            pluginListbox          = document.getElementById("plugin-listbox");

            iframeDoc = pluginDescriptionFrame.contentDocument;
            container = iframeDoc.getElementById("container");
            helpBox   = iframeDoc.getElementById("help-box");
            infoBox   = iframeDoc.getElementById("info-box");
            detailBox = iframeDoc.getElementById("detail-box");

            parserContext = {};

            if (!modules || !modules.userscript) {
                // KeySnail not loaded

                var pluginArea = document.getElementById("plugin-area");
                pluginArea.setAttribute("hidden", true);


                removeAllChilds(container);
                container.appendChild(createElementWithText("h1", "Please reload this page"));
                container.appendChild(iframeDoc.createElement("hr"));
                container.appendChild(createElementWithText("p", "Plugin manager does not loaded propery. Plese refresh this page."));

                var form   = iframeDoc.createElement("form");
                form.setAttribute("style", "text-align:center;margin:auto;");
                var button = iframeDoc.createElement("input");
                button.setAttribute("style", "font-size:140%;");
                button.setAttribute("type", "button");
                button.setAttribute("value", "Refresh");
                button.setAttribute("onclick", "content.document.location.reload();");
                form.appendChild(button);
                container.appendChild(form);

                return;
            }

            // Check if plugin directory is specified
            if (!modules.userscript.pluginDir) {
                modules.userscript.setPluginPathViaDialog(true);
            }

            // load Wiki parser
            try {
                Components.utils.import("resource://keysnail-share/WikiParser.js", parserContext);
            } catch (x) {
                modules.message(x);
            }

            initPluginList();

            /**
             * When plugin manager is opened from userscript.loadPlugin(),
             */
            if (modules.userscript.newlyInstalledPlugin) {
                selectNewlyInstalledPlugin();
                modules.userscript.newlyInstalledPlugin = null;
            }
        },

        pluginListboxOnSelect: function (aEvent) {
            // detail
            var item       = aEvent.target;
            var pluginPath = item.value;

            helpBox.setAttribute("style", "display:none;");

            for (var path in xulHolder) {
                var buttonsContainer = xulHolder[path].buttonsContainer;
                var infoContainer = xulHolder[path].infoContainer;

                if (path == pluginPath) {
                    // selected item
                    buttonsContainer.setAttribute("hidden", false);
                    setElementStatus(infoContainer, true);
                    if (infoHolder[path].status == KS_PLUGIN_NOTCOMPATIBLE) {
                        xulHolder[path].notification.value = getNotCompatibleMessage(path);
                        xulHolder[path].notification.setAttribute("hidden", false);
                    }
                } else {
                    buttonsContainer.setAttribute("hidden", true);
                    setElementStatus(infoContainer, (infoHolder[path].status == KS_PLUGIN_ENABLED));
                    xulHolder[path].notification.setAttribute("hidden", true);
                }
            }

            updateInfoBox(pluginPath);
            updateDetailBox(pluginPath);
        },

        reloadPlugin: function () {
            modules.plugins.context = {};
            modules.userscript.loadPlugins();

            helpBox.removeAttribute("style");
            infoBox.innerHTML   = "";
            detailBox.innerHTML = "";

            initPluginList();
        },

        installPlugin: function () {
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

            fp.init(window, modules.util.getLocaleString("selectPluginFile"), nsIFilePicker.modeOpen);

            if (!modules.util.getSystemInfo().getProperty("name").match("mac")) {
                fp.appendFilter(modules.util.getLocaleString("keySnailPlugin"), "*.ks.js");
            }
            fp.appendFilter("JavaScript","*.js");

            var response = fp.show();
            if (response !== nsIFilePicker.returnOK) {
                return;
            }

            try {
                modules.userscript.installPluginFromURL(modules.util.pathToURL(fp.file.path));
                initPluginList();
                if (modules.userscript.newlyInstalledPlugin) {
                    selectNewlyInstalledPlugin();
                    modules.userscript.newlyInstalledPlugin = null;
                }
            } catch (x) {
                modules.display.notify(x);
            }
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
     ksPluginManager.modules = (browserWindow.KeySnail || {modules : null}).modules;
 })();
