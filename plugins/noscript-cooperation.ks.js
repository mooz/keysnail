const PLUGIN_INFO =
<KeySnailPlugin>
    <name>NoScript Cooperation</name>
    <description>Manipulate NoScript with KeySnail</description>
    <description lang="ja">NoScript を Keysnail から操作</description>
    <version>0.0.1</version>
    <updateURL>https://github.com/mooz/keysnail/raw/master/plugins/noscript-cooperation.ks.js</updateURL>
    <iconURL>https://github.com/mooz/keysnail/raw/master/plugins/icon/noscript-cooperation.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.7.2</minVersion>
    <include>main</include>
    <detail><![CDATA[
=== Example key settings ===

>|javascript|
key.defineKey([key.modes.VIEW, key.modes.CARET],
              'N',
              function (ev) {
                  ext.exec("noscript-selector");
              }, 'NoScript - selector');

key.defineKey([key.modes.VIEW, key.modes.CARET],
              ['C-c', 'C-n'],
              function (ev) {
                  ext.exec("noscript-show-popup");
              }, 'NoScript - popup menu');
||<
]]></detail>
</KeySnailPlugin>;

let pOptions = plugins.setupOptions("noscript_cooperation", {
    "keymap": {
        preset: {
            "C-z"   : "prompt-toggle-edit-mode",
            "SPC"   : "prompt-next-page",
            "b"     : "prompt-previous-page",
            "j"     : "prompt-next-completion",
            "k"     : "prompt-previous-completion",
            "g"     : "prompt-beginning-of-candidates",
            "G"     : "prompt-end-of-candidates",
            "q"     : "prompt-cancel",
            "C-RET" : "noscript-permit-temprary"
        },
        description: M({
            en: "keymap used in `noscript-selector`",
            ja: "`noscript-selector` で使われるキーバインド設定"
        }),
        type: "object (keymap for prompt.selector)"
    }
}, PLUGIN_INFO);

plugins.withProvides(function (provide) {
    if (typeof noscriptOverlay === "undefined")
        return;

    const ns = noscriptOverlay.ns;

    var Noscript = {
        LEVEL: 3,

        get popup() (ns.getPref("stickyUI.onKeyboard") && noscriptOverlay.stickyUI)
            || document.getElementById("noscript-status-popup"),
        get statusIcon() document.getElementById("noscript-statusIcon"),

        showPopup: function () {
            this.popup.openPopup(this.statusIcon, "after_end", -1, -1, true);
        },

        getSite: function (url) ns.getQuickSite(url, this.LEVEL),
        getSites: function () noscriptOverlay.getSites(),

        get currentURI() content.document.documentURI,
        get currentSite() this.getSite(this.currentURI),

        setStatusForURL: function (url, status, temporary) {
            const site = this.getSite(url);
            noscriptOverlay.safeAllow(site, !ns.isJSEnabled(site), temporary);
        },

        getStatusForURL: function (url) {
            const site = this.getSite(url);
            return site && ns.isJSEnabled(site);
        },

        toggleStatusForURL: function (url, temporary) {
            this.setStatusForURL(url, !this.getStatusForURL(url), temporary);
        },

        toggleTmpCurrentURI: function () {
            this.toggleStatusForURL(this.currentURI, true);
        },

        togglePermCurrentURI: function () {
            this.toggleStatusForURL(this.currentURI);
        }
    };

    provide("noscript-show-popup", function () {
        Noscript.showPopup();
    }, "Noscript - Show popup");

    provide("noscript-toggle-tmp", function () {
        Noscript.toggleTmpCurrentURI();
    }, "Noscript - Toggle temporal permit status of current page");

    provide("noscript-toggle-perm", function () {
        Noscript.togglePermCurrentURI();
    }, "Noscript - Toggle persistent permit status of current page");

    provide("noscript-selector", function () {
        let sites      = Noscript.getSites();
        let collection = Array.slice(sites).map(function (url) {
            const icon = "chrome://noscript/skin/" +
                (Noscript.getStatusForURL(url) ? "no16.png" : "yes16.png");
            return [icon, url];
        });

        function getURLFor(i) {
            return collection[i][1];
        }

        function createToggler(tmp) {
            return function (i) {
                if (i >= 0)
                    Noscript.toggleStatusForURL(getURLFor(i), tmp);
            };
        }

        prompt.selector({
            message    : "NoScript Allow / Deny Host: ",
            collection : collection,
            flags      : [ICON | IGNORE, 0],
            keymap     : pOptions.keymap,
            actions    : [
                [createToggler(), "Toggle status", "noscript-permit"],
                [createToggler(true), "Toggle temporary status", "noscript-permit-temprary"]
            ]
        });
    }, "Noscript - selector");
}, PLUGIN_INFO);
