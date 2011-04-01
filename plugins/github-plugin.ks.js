var PLUGIN_INFO =
<KeySnailPlugin>
    <name>github helper</name>
    <name lang="ja">github プラグインヘルパー</name>
    <description>Helps you to install plugin from github</description>
    <description lang="ja">github から簡単にプラグインをインストール</description>
    <version>1.2.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/github-plugin.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/github-plugin.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.8.5</minVersion>
    <include>main</include>
    <detail><![CDATA[
=== Usage ===
==== Suggestion ====
By enabling this plugin, when KeySnail plugin is found at current github page, the notification bar will appear top of the browser content area and user can install the plugin easily.

For installed plugin, this plugin does not display the notification bar. You can re-install the plugin by using the command described below.
==== Command ====
This plugin provides exts listed below.
- github-install-plugin-from-this-page
This ext seek for the KeySnail plugin at the current github page and when plugin found, asks user to install the plugin.
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===
==== サジェストによるインストール ====
このプラグインをインストールすることにより、現在閲覧している github のページに KeySnail プラグインが見つかった際に画面上部にメッセージが表れ、指示に従って簡単にプラグインをインストールすることができるようになります。

既にインストール済みのプラグインに対してはサジェストが無効となりますので、明示的にインストールを行いたい場合は次に説明するコマンドを使用してください。
==== コマンド入力によるインストール ====
このプラグインをインストールすることで次のエクステが追加されます。
- github-install-plugin-from-this-page
このエクステは現在見ている github のページから KeySnail プラグインを探しだし、見つかった場合はインストールを行うかどうかをユーザへ確認するものです。
    ]]></detail>
</KeySnailPlugin>;

var status = true;

function githubIsPluginURL(aURL) {
    return /\.ks\.js$/.test(aURL) && /^https?:\/\/(?:gist\.)?github\.com\//.test(aURL);
}

function githubIsInstalledPlugin(aURL) {
    var fileName = util.getLeafNameFromURL(aURL);

    for (let filePath in plugins.context) {
        if (plugins.context[filePath].__ksFileName__ == fileName)
            return true;
    }

    return false;
}

function githubGetRawURL(aURL) {
    var matched;
    if ((matched = aURL.match("^https?://github\\.com/[^/]+/[^/]+/blob/")))
        return matched[0].slice(0, -5) + "raw/" + aURL.slice(matched[0].length);
    return aURL;
}

function githubLocationChangeChecker(aURI) {
    if (!aURI || !githubIsPluginURL(aURI.spec))
        return;

    var url = aURI.spec;

    if (githubIsInstalledPlugin(url)) {
        // installed plugin
        return;
    }

    url = githubGetRawURL(url);

    var buttons = [
        {
            label     : M({ja: "インストール", en: "Install"}),
            callback  : function (aNotification) {
                userscript.installPluginFromURL(url);
                try {
                    aNotification.close();         
                } catch (x) {}
            },
            accessKey : "i"
        }
    ];


    function displayNotification() {
        display.notify(M({ja: "このページからプラグインをインストールしますか？",
                          en: "Install KeySnail plugin from this page?"}),
                       buttons);
    }

    if (content.document.__ksDocumentLoaded) {
        displayNotification();
    } else {
        content.document.addEventListener("DOMContentLoaded",
                                          function () {
                                              content.document.removeEventListener("DOMContentLoaded", arguments.callee, true);
                                              content.document.__ksDocumentLoaded = true;
                                              displayNotification();
                                          }, true);
    }
}

function installPluginFromThisPage(aEvent, aArg) {
    var url = content.document.location.href;

    if (!githubIsPluginURL(url)) {
        display.echoStatusBar(M({ja: "このページからはプラグインが見つかりませんでした。",
                                 en: "No plugin found on this page."}), 2000);
        return;
    }

    userscript.installPluginFromURL(githubGetRawURL(url));
}

if (my.githubPluginLocationChangeChecker)
    hook.removeHook('LocationChange', my.githubPluginLocationChangeChecker);
my.githubPluginLocationChangeChecker = githubLocationChangeChecker;

hook.addToHook('LocationChange', githubLocationChangeChecker);

plugins.withProvides(function (provide) {
    provide("github-install-plugin-from-this-page",
            installPluginFromThisPage,
            M({ ja: "github のページからプラグインをインストール",
                en: "Install plugin from github page" }));
}, PLUGIN_INFO);
