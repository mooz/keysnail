var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Unfu*k your enemies</name>
    <description>Override the content type</description>
    <description lang="ja">クソ野郎が垂れ流す Content type を上書き</description>
    <version>1.0.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/unfuck-your-enemies.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/unfuck-your-enemies.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.0</minVersion>
    <include>main</include>
    <provides>
        <ext>unfuck-your-enemies-toggle-status</ext>
    </provides>
    <options>
        <option>
            <name>unfuck_your_enemies.site_info</name>
            <type>object</type>
            <description>Information of the content type override</description>
            <description lang="ja">コンテンツタイプの上書き情報</description>
        </option>
        <option>
            <name>unfuck_your_enemies.default_content_disposition</name>
            <type>("inline"|"attachment")</type>
            <description>Default value of the disposition which will be used if disposition is omitted</description>
            <description lang="ja">Disposition を省略した場合に用いられるデフォルト値</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Override the content type ====

Paste the code below to your .keysnail.js PRESERVE area or preserved codes area in the setting dialog.

>|javascript|
plugins.options["unfuck_your_enemies.site_info"] = {
    "http://github\\.com/[^/]+/[^/]+/raw/.+/([^?]+)": {
        xpi: ["application/zip", "attachment"]
    },

    "http://[^\.]+\\.googlecode\\.com/issues/attachment?(?:.*&name|name)=([^&]+)": {
        vimp : ["text/plain", "inline"],
        js   : ["text/plain", "inline"]
    },

    "http://[^\.]+\\.googlecode\\.com/files/([^?]+)": {
        vimp : "text/plain",
        js   : "text/plain",
    }
};
||<

unfuck_your_enemies.site_info is the hash its key is the URL regexp of the content you want to override the content type.

The value of hash is {extension : [Content type : ("attachment"|"inline")], ... }.

When attachment is given, browser asks you to download that content and when inline is given, browser try to display that content.

You can omit disposition (attachment / inline). IF disposition is omitted, the value of unfuck_your_enemies.default_content_disposition will be used.
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===
==== コンテンツタイプの上書き ====

次のような設定を .keysnail.js の PRESERVE エリアか設定ダイアログ内「その他のコード」へ張り付けてください。

>|javascript|
plugins.options["unfuck_your_enemies.site_info"] = {
    "http://github\\.com/[^/]+/[^/]+/raw/.+/([^?]+)": {
        xpi: ["application/zip", "attachment"]
    },

    "http://[^\.]+\\.googlecode\\.com/issues/attachment?(?:.*&name|name)=([^&]+)": {
        vimp : ["text/plain", "inline"],
        js   : ["text/plain", "inline"]
    },

    "http://[^\.]+\\.googlecode\\.com/files/([^?]+)": {
        vimp : "text/plain",
        js   : "text/plain",
    }
};
||<

unfuck_your_enemies.site_info にはコンテンツタイプを上書きしたい URL の正規表現をプロパティとして、「拡張子 : [希望するコンテンツタイプ : ("attachment"|"inline")]」の組み合わせを指定します。

attachment が指定された場合はブラウザがそのファイルをダウンロードするか聞くようになり、 inline が指定された場合はブラウザがそのファイルを表示しようとするようになります。

Disposition (attachment / inline のこと) を省略し、コンテンツタイプだけを指定することも可能です。この場合 Disposition の値には unfuck_your_enemies.default_content_disposition の値が用いられます。
    ]]></detail>
</KeySnailPlugin>;

// ChangeLog : {{{
// ==== 1.0.2 (2009 11/03) ====
//
// * Removed the window.alert()
//
// ==== 1.2.1 (2009 11/03) ====
//
// * Released
//
// }}}

let Cc = Components.classes;
let Ci = Components.interfaces;

var siteInfo = plugins.options["unfuck_your_enemies.site_info"];

if (!plugins.options["unfuck_your_enemies.default_content_disposition"])
    plugins.options["unfuck_your_enemies.default_content_disposition"] = "inline";

const TOPIC           = "http-on-examine-response";
const observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
const mimeService     = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);

var httpFilter = {
    status: true,
    registered: false,

    observe: function observe(subject, topic, data) {
        if (topic != TOPIC || !this.status || !siteInfo)
            return;

        var channel = subject.QueryInterface(Ci.nsIHttpChannel);

        for (var pattern in siteInfo)
        {
            let matched;
            if ((matched = channel.name.match(pattern)))
            {
                let extension = /\.(.*)$/.exec(matched[1]) || [0, ".txt"];
                extension = extension[1];

                let type, disposition;
                if (siteInfo[pattern][extension] instanceof Array)
                {
                    // Disposition type specified
                    // ["application/octet-stream", "attachment"]
                    type        = siteInfo[pattern][extension][0];
                    disposition = siteInfo[pattern][extension][1];
                }
                else if (siteInfo[pattern][extension])
                {
                    // Only content type
                    type        = siteInfo[pattern][extension];
                    disposition = plugins.options["unfuck_your_enemies.default_content_disposition"];
                }
                else if (siteInfo[pattern][extension] === null)
                {
                    // null specified which means get content type from extension
                    type        = mimeService.getTypeFromExtension(extension);
                    disposition = plugins.options["unfuck_your_enemies.default_content_disposition"];
                }
                else
                {
                    break;
                }

                channel.setResponseHeader("Content-Disposition", disposition, false);
                channel.contentType = type;

                break;
            }
        }
    },

    unregister: function unregister() {
        try {
            observerService.removeObserver(this, TOPIC);

            var filters = getHttpFilters();
            if (filters.filter(function (aHttpFilter) aHttpFilter.registered).length == 0
                && filters.length)
            {
                // we shuld arrange the one
                filters[0].register();
            }
        }
        catch (e) {}

        this.registered = false;
    },

    register: function register() {
        observerService.addObserver(this, TOPIC, false);
        this.registered = true;
    }
};

// avoid duplication {{ =========================================

function getBrowserWindows() {
    var windows = [];

    var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);
    var enumerator = wm.getEnumerator("navigator:browser");

    while (enumerator.hasMoreElements())
    {
        windows.push(enumerator.getNext());
    }

    return windows;
}

function getHttpFilters() {
    return getBrowserWindows().filter(
        function (win) {
            return win.KeySnail && win.KeySnail.modules.my.httpFilter;
        }).map(
            function (win) {
                return win.KeySnail.modules.my.httpFilter;
            }
        );
}

getHttpFilters().forEach(
    function (aHttpFilter) {
        if (aHttpFilter.registered)
            aHttpFilter.unregister();
    });

my.httpFilter = httpFilter;
httpFilter.register();

window.addEventListener("unload", function () { httpFilter.unregister(); }, false);

// }} ===========================================================

ext.add("unfuck-your-enemies-toggle-status",
        function () {
            var status;

            getHttpFilters().forEach(
                function (aHttpFilter) {
                    status = aHttpFilter.status = !aHttpFilter.status;
                });

            display.echoStatusBar(M({ja: "コンテンツタイプの上書きが" + (status ? "有効" : "無効") + "になりました",
                                     en: "Override content type " + (status ? "enabled" : "disabled")}),
                                  2000);
        },
        M({ja: 'コンテンツタイプ上書き状態の切り替え',
           en: "Toggle content type override status"}));
