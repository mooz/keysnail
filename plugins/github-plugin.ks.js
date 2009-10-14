var PLUGIN_INFO =
<KeySnailPlugin>
    <name>github helper</name>
    <name lang="ja">github プラグインヘルパー</name>
    <description>Helps you to install plugin from github</description>
    <description lang="ja">github から簡単にプラグインをインストール</description>
    <version>1.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/github-plugin.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/github-plugin.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.4</minVersion>
    <maxVersion>0.9.*</maxVersion>
    <provides>
        <ext>github-install-plugin-from-this-page</ext>
    </provides>
    <detail><![CDATA[
=== 使い方 ===
==== 自動インストール ====
このプラグインをインストールすることにより、現在閲覧している github のページに KeySnail プラグインが見つかった場合画面上部にメッセージが表れ、指示にしたがって簡単にプラグインをインストールすることができるようになります。

==== コマンド入力によるインストール ====
このプラグインをインストールすることで次のエクステが追加されます。
- github-install-plugin-from-this-page
このエクステを ext.exec (デフォルトでは M-x に割り当て) により呼び出すことで、現在見ている github のページから KeySnail プラグインをインストールすることができます。
    ]]></detail>
</KeySnailPlugin>;

var status = true;

function githubIsPluginURL(aURL) {
    return aURL.match("\\.ks\\.js$") && aURL.match("^http://github\\.com/");
}

function githubIsInstalledPlugin(aURL) {
    var fileName = util.getLeafNameFromURL(aURL);

    for (filePath in plugins.context) {
        if (plugins.context[filePath].__ksFileName__ == fileName)
            return true;
    }

    return false;
}

function githubGetRawURL(aURL) {
    var matched;
    if ((matched = aURL.match("^http://github\\.com/[^/]+/[^/]+/blob/")))
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

    display.notify(M({ja: "このページからプラグインをインストールしますか？",
                      en: "Install KeySnail plugin from this page?"}),
                   buttons);
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

hook.addToHook('LocationChange', githubLocationChangeChecker);

ext.add("github-install-plugin-from-this-page", installPluginFromThisPage,
        M({ja: "github のページからプラグインをインストール",
           en: "Install plugin from github page"}));
