/**
 * @fileOverview Collection of editor commands
 * @name command.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const plugins = {
    modules : null,
    context : {},
    options : {},
    lib     : {},

    init: function () {
    },

    setupOptions: function (prefix, defaults, pluginInfo) {
        let options = {};

        for (let [name, { preset, description, type, hidden }] in Iterator(defaults)) {
            let fullName = prefix + "." + name;

            // XXX: bind values
            let _preset = preset;
            let _name   = name;
            options.__defineGetter__(name, function () {
                return (fullName in plugins.options) ?
                    plugins.options[fullName] : _preset;
            });

            options.__defineSetter__(name, function (val) {
                plugins.options[fullName] = val;
            });

            if (pluginInfo && !hidden) {
                try {
                    pluginInfo.addOption({
                        name: fullName,
                        type: type || typeof preset,
                        description: description
                    });
                } catch (x) {
                    util.message("Failed to add an option: " + x);
                }
            }
        }

        return options;
    },

    withProvides: function (context, pluginInfo) {
        try {
            var pluginGlobal = Components.utils.getGlobalForObject(context);
        } catch (x) {}

        function provide(name, action, description) {
            ext.add.apply(ext, arguments);
            try {
                pluginInfo.addExt(name);
            } catch (x) {
                util.message("Failed to add an ext: " + x);
            }
        }

        context(provide);
    },

    pluginRepositoryURL: "https://github.com/mooz/keysnail/wiki/plugin",
    getRemotePluginList: function () {
        var xhr = util.requestGet(this.pluginRepositoryURL);
        var domParser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
        var doc = domParser.parseFromString(xhr.responseText, "text/html");

        function rowToPlugin(row) {
            if (row.children.length !== 4)
                return null;
            if (!/^td$/i.test(row.children[0].localName))
                return null;
            try {
                let info = {
                    iconURL     : row.children[0].querySelector("img").getAttribute("src"),
                    name        : row.children[1].textContent,
                    remoteURL   : row.children[1].querySelector("a").getAttribute("href"),
                    description : row.children[2].textContent,
                    authorName  : row.children[3].textContent
                };

                if (info.remoteURL) {
                    let match = /([^/]*\.ks\.js)$/.exec(info.remoteURL);
                    if (match)
                        info.leafName = match[1];
                }

                return info;
            } catch (x) {
                return null;
            }
        }

        var pluginList = Array.slice(doc.querySelectorAll("table#wiki-plugins tr"))
                .map(rowToPlugin)
                .filter(function (info) info);

        return pluginList;
    },

    getInstalledPlugins: function () {
        let pluginList = {};

        for (let [pluginPath, pluginContext] in Iterator(plugins.context)) {
            let isDisabled      = userscript.isDisabledPlugin(pluginPath);
            let isNotCompatible = pluginContext.__ksNotCompatible__;

            if (!pluginContext.__ksLoaded__) {
                try {
                    let pluginText = util.readTextFile(pluginPath);
                    pluginContext.__ksPluginInfo__ = userscript.getPluginInformation(pluginText);
                } catch (x) {
                    continue;
                }
            }

            let pluginName = util.openFile(pluginPath).leafName;
            let pluginInfo = pluginContext.__ksPluginInfo__;

            pluginList[pluginName] = {
                pluginInfo: pluginInfo,
                pluginPath: pluginPath
            };
        }

        return pluginList;
    }
};
