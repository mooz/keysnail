var PLUGIN_INFO =
<KeySnailPlugin>
    <name>github plugin</name>
    <name lang="ja">github プラグイン</name>
    <description>Helps you to install plugin from github</description>
    <description lang="ja">github からのプラグインインストールを簡単に</description>
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

このプラグインをインストールすることで次のエクステが追加されます。
- github-install-plugin-from-this-page
このエクステを M-x のメニューや ext.exec により呼び出すことで、現在見ている github のページから KeySnail プラグインを簡単に
インストールすることが出来るようになります。
    ]]></detail>
</KeySnailPlugin>;

ext.add("github-install-plugin-from-this-page", installPluginFromThisPage,
        M({ja: "github のページからプラグインをインストール",
           en: "Install plugin from github page"}));

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

function githubLocationChangeChecker(aURI) {
    if (!aURI || !githubIsPluginURL(aURI.spec))
        return;

    var url = aURI.spec;

    if (githubIsInstalledPlugin(url)) {
        // installed plugin
        return;
    }

    var matched;
    if ((matched = url.match("^http://github\\.com/[^/]+/[^/]+/blob/")))
        url = matched[0].slice(0, -5) + "raw/" + url.slice(matched[0].length);

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

    userscript.installPluginFromURL(url);
}

hook.addToHook('LocationChange', githubLocationChangeChecker);
