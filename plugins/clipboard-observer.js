/**
 * @fileOverview
 * @name clipboard-observer.js
 * @description Observe clipboard
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

// PLUGIN INFO: {{{
var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>Clipboard observer</name>
    <description>Observe clipboard</description>
    <description lang="ja">クリップボードを監視</description>
    <version>1.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/clipboard-observer.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/clipboard-observer.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.2</minVersion>
    <maxVersion>0.9.*</maxVersion>
    <detail><![CDATA[
      == Set up ==
      In your .keysnail.js file,
      >||
      userscript.require("clipboard-observer.js");
      ||<
      == Usage ==
      Automatically begins to observe the clipboard
    ]]></detail>
    <detail lang="ja"><![CDATA[
      == セットアップ ==
      .keysnail.js へ次の一行を付け加えてください
      >||
      userscript.require("clipboard-observer.js");
      ||<
      == 使い方 ==
      クリップボードの監視が始まり、コピーされたテキストの中身に URL があれば自動的に開かれるようになります。
    ]]></detail>
    </KeySnailPlugin>;
// }}}

hook.addToHook('ClipboardChanged', function (aText) {
    var matched;

    while ((matched = aText.match("(h?t?tps?|ftp)(://[a-zA-Z0-9/?#_*.:/=&\\-]+)"))) {
        var prefix = (matched[1] == "ftp") ? "ftp" : "http";
        if (matched[1][matched[1].length - 1] == 's')
            prefix += "s";

        gBrowser.loadOneTab(prefix + matched[2], null, null, null, true);

        aText = aText.slice(aText.indexOf(matched[2]) + matched[2].length);
    }
});
