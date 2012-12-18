let ksUpdatePluginDialog = (function () {
    // {{%ARRANGE_MODULES%
    const { classes : Cc, interfaces : Ci } = Components;

    const { modules } = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator)
        .getMostRecentWindow("navigator:browser").KeySnail;

    const { my, share, persist, util, display, command, html, hook, macro, style,
            key, prompt, ext, shell, userscript, completer, vimp, L, M, plugins }
        = modules;
    // }}%ARRANGE_MODULES%

    function Plugin(script) {
        if (!(this instanceof Plugin))
            return new Plugin(script);

        this.script = script;
        this.info   = script.pluginInfo;
        this.path   = script.path;
        this.elem   = elementFromInfo(this.info);

        this.checkBox = this.elem.querySelector("checkbox.plugin-install-or-not-checkbox");
    }

    Plugin.prototype = {
        set updateThisPlugin(v) this.checkBox.checked = v,
        get updateThisPlugin() this.checkBox.checked
    };

    const defaultIconURL = "chrome://keysnail/skin/script.png";

    function elementFromInfo(pluginInfo) {
        let iconURL     = html.escapeTag(pluginInfo.iconURL);
        let name        = html.escapeTag(pluginInfo.name);
        let version     = html.escapeTag(pluginInfo.version);
        let description = html.escapeTag(pluginInfo.description);

        let elem = util.xmlToDom('\
            <richlistitem class="plugin-info-box">\n\
                <hbox>\n\
                    <checkbox class="plugin-install-or-not-checkbox" checked="true" />\n\
                    <hbox align="center">\n\
                        <!-- icon -->\n\
                        <vbox align="center">\n\
                            <image src="' + iconURL + '" class="plugin-icon" />\n\
                        </vbox>\n\
                        <vbox>\n\
                            <!-- name, version -->\n\
                            <hbox align="center">\n\
                                <description class="plugin-name">' + name + '</description>\n\
                                <description class="plugin-version">' + version + '</description>\n\
                            </hbox>\n\
                            <!-- description -->\n\
                            <description class="plugin-description">' + description + '</description>\n\
                        </vbox>\n\
                    </hbox>\n\
                </hbox>\n\
            </richlistitem>', null, document);

        return elem;
    }

    const self = {
        plugins: null,

        get modules() modules,

        initPluginList: function () {
            this.plugins = share.pluginUpdater.pluginsWithUpdate.map(Plugin);

            let fragment = document.createDocumentFragment();
            this.plugins.forEach(function ({ elem }) fragment.appendChild(elem));
            document.getElementById("plugin-list").appendChild(fragment);
        },

        onLoad: function () {
            this.initPluginList();

            this.checkBoxAutomaticallyCheck = document.getElementById("checkbox-automatically-check");
            this.checkBoxAutomaticallyCheck.checked
                = share.pluginUpdater.checkAutomatically;
        },

        checkBoxAutomaticallyCheck: null,

        toggleAutomaticallyCheck: function () {
            share.pluginUpdater.checkAutomatically
                = this.checkBoxAutomaticallyCheck.checked;
        },

        toggleAllChecked: function () {
            this.setAllChecked(!this.plugins.some(function (p) p.updateThisPlugin));
        },

        setAllChecked: function (checked) {
            this.plugins.forEach(function (plugin) {
                plugin.updateThisPlugin = checked;
            });
        },

        onAccept: function (ev) {
            let paths = this.plugins
                .filter(function (p) p.updateThisPlugin)
                .map(function (p) p.path);

            let count = paths.length;

            ev.target.disabled = true;
            share.pluginUpdater.updatePlugins(paths, function (succeeded) {
                ev.target.disabled = false;
                window.close();

                if (succeeded) {
                    let message = util.getLocaleString("updatedPlugins", [count]);
                    let title   = util.getLocaleString("keySnailPlugin");

                    display.showPopup(title, message, {
                        icon : "chrome://keysnail/skin/icon/update-notification-large.png"
                    }) || alert(title, message);
                } else {
                    alert(util.getLocaleString("updaterStatusFailed"));
                }
            });
        },

        onCancel: function (ev) {
            window.close();
        }
    };

    return self;
})();
