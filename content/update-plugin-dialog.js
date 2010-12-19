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
        this.info   = script.info;
        this.path   = script.path;
        this.elem   = elementFromInfo(this.info);

        this.checkBox = this.elem.querySelector("checkbox.plugin-install-or-not-checkbox");
    }

    Plugin.prototype = {
        set updateThisPlugin(v) this.checkBox.checked = v,
        get updateThisPlugin() this.checkBox.checked
    };

    const defaultIconURL = "chrome://keysnail/skin/script.png";

    function elementFromInfo(info) {
        function getString(name) L(util.xmlGetLocaleString(info[name]));

        let iconURL     = getString("iconURL") || defaultIconURL;
        let name        = getString("name");
        let version     = getString("version");
        let description = getString("description");

        let elem = util.xmlToDom(
            <richlistitem class="plugin-info-box">
                <hbox>
                    <checkbox class="plugin-install-or-not-checkbox" checked="true" />
                    <hbox align="center">
                        <!-- icon -->
                        <vbox align="center">
                            <image src={iconURL} class="plugin-icon" />
                        </vbox>
                        <vbox>
                            <!-- name, version -->
                            <hbox align="center">
                                <description class="plugin-name">{name}</description>
                                <description class="plugin-version">{version}</description>
                            </hbox>
                            <!-- description -->
                            <description class="plugin-description">{description}</description>
                        </vbox>
                    </hbox>
                </hbox>
            </richlistitem>
        , null, document);

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
