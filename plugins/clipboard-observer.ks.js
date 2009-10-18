var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Clipboard observer</name>
    <name lang="ja">クリップボード監視君</name>
    <description>Observe clipboard</description>
    <description lang="ja">クリップボードを監視します</description>
    <version>1.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/clipboard-observer.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/clipboard-observer.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.2</minVersion>
    <include>main</include>
    <provides>
        <ext>switch-clipboard-observer-status</ext>
    </provides>
    <detail><![CDATA[
=== Usage ===
==== URL watcher ====
This plugin observes clipboard and if there are URL's, open links automatically.

==== Switching the state ====
If you want to enable or disable the observer, use ext below.
- switch-clipboard-observer-status
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== 自動 URL オープン ====
このプラグインをインストールするとクリップボードの監視が始まり、コピーされたテキストの中身に URL があれば自動的に開かれるようになります。

==== ON / OFF の切り替え ====
クリップボードの監視状態を切り替えたいときは次のエクステを使用してください。
- switch-clipboard-observer-status
    ]]></detail>
</KeySnailPlugin>;

var status = true;

function clipboardObserver(aText) {
    if (!status)
        return;

    var matched;

    while ((matched = aText.match("(h?t?tps?|ftp)(://[a-zA-Z0-9/?#_*.:/=&\\-]+)"))) {
        var prefix = (matched[1] == "ftp") ? "ftp" : "http";
        if (matched[1][matched[1].length - 1] == 's')
            prefix += "s";

        gBrowser.loadOneTab(prefix + matched[2], null, null, null, true);

        aText = aText.slice(aText.indexOf(matched[2]) + matched[2].length);
    }    
}

hook.addToHook('ClipboardChanged', clipboardObserver);

ext.add("switch-clipboard-observer-status", function () {
            status = !status;
            display.echoStatusBar(
                M({ja: ("クリップボードの監視を" + (status ? "開始しました" : "停止しました")),
                   en: ("Clipboard observer " + (status ? "enabled" : "disabled"))}), 2000);
        }, M({ja: "クリップボード監視 ON / OFF を切り替え", en: "Switch clipboard observer status"}), true);
