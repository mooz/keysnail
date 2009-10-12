var PLUGIN_INFO =
<KeySnailPlugin>
    <name>github plugin</name>
    <name lang="ja">github プラグイン</name>
    <description>Helps you to install plugin from github</description>
    <description lang="ja">github からのプラグインインストールを簡単に</description>
    <version>1.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/github-plugin.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/github-plugin.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.4</minVersion>
    <maxVersion>0.9.*</maxVersion>
    <provide>
        <ext>github-install-plugin-from-this-page</ext>
    </provide>
    <detail><![CDATA[
=== 使い方 ===

このプラグインをインストールすることで次のエクステが追加されます。
- github-install-plugin-from-this-page
このエクステを M-x のメニューや ext.exec により呼び出すことで、現在見ている github のページから KeySnail プラグインを簡単に
インストールすることが出来るようになります。
    ]]></detail>
</KeySnailPlugin>;

var status = true;

function githubIsPluginURL(aURL) {
    return aURL.match("\\.ks\\.js$") && aURL.match("^http://github\\.com/");
}

function githubLocationChangeChecker(aURI) {
    if (!aURI || !githubIsPluginURL(aURI.spec))
        return;

    var url = aURI.spec;

    var matched;
    if ((matched = url.match("^http://github\\.com/[^/]+/[^/]+/blob/")))
        url = matched[0].slice(0, -5) + "raw/" + url.slice(matched[0].length);

    var buttons = [
        {
            label     : "Install",
            callback  : function (aNotification) {
                userscript.installPluginFromURL(url);
                aNotification.close();
            },
            accessKey : "i"
        }
    ];

    display.notify("Install KeySnail plugin from this page?", buttons);
}

hook.addToHook('LocationChange', githubLocationChangeChecker);

ext.add("github-install-plugin-from-this-page", function () {
        }, "Switch clipboard observer status");
