// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>KKK</name>
    <description>Kill keyup and keydown event</description>
    <description lang="ja">keyup, keydown イベントが特定のサイトへ渡らないように</description>
    <version>0.0.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/kkk.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/kkk.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.1</minVersion>
    <include>main</include>
    <provides>
        <ext>kkk-permit</ext>
        <ext>kkk-prevent</ext>
    </provides>
    <detail><![CDATA[
=== Usage ===

This plugin prevents certain sites from handling keyup and keydown event.

For example, the setting below kills shortcut keys of GitHub Wiki.

>||
plugins.options["kkk.sites"] = ["^https?://wiki\\.github\\.com/"];
||<

If you want to kill shortcut keys of everywhere in GitHub, paste the code below to the PRESERVE area in your .keysnail.js file.

>||
plugins.options["kkk.sites"] = ["^https?://([0-9a-zA-Z]+\\.)?github\\.com/"];
||<
	       ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===

このプラグインにより keyup, keydown イベントを特定のサイトに渡さないようにすることができます。

例えば GitHub の Wiki ページで KeySnail のショートカットキーを使いたければ、次のような設定を .keysnail.js の PRESERVE エリアへ張り付けておくと良いでしょう。

>||
plugins.options["kkk.sites"] = ["^https?://wiki\\.github\\.com/"];
||<

GitHub 全体でショートカットキーを無効にさせたい場合は、次のようにします。

>||
plugins.options["kkk.sites"] = ["^https?://([0-9a-zA-Z]+\\.)?github\\.com/"];
||<

ご利用は計画的に。
	       ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
//
// ==== 0.0.1 (2009 02/13) ====
//
// }} ======================================================================= //

let optionsDefaultValue = {
    "sites" : []
};

function getOption(aName) {
    let fullName = "kkk." + aName;

    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

let kkk =
    (function () {
         let eventType = ["keydown", "keyup"];

         function preventEvent(ev) {
             if (self.status && !key.suspended && !key.escapeCurrentChar && !util.isWritable(ev))
             {
                 ev.stopPropagation();
             }
         }

         var self = {
             status: false,
             handleLocationChange: function (uri) {
                 self.status = (!uri || getOption("sites").some(function (pat) uri.spec.match(pat)));
             },

             start: function () {
                 for (let [, type] in Iterator(eventType))
                     window.addEventListener(type, preventEvent, true);
             },

             stop: function () {
                 for (let [, type] in Iterator(eventType))
                     window.removeEventListener(type, preventEvent, true);
             }
         };

         hook.addToHook('LocationChange', self.handleLocationChange);
         self.start();

         return self;
     })();

ext.add("kkk-permit", function () {
            kkk.status = false;
            display.echoStatusBar(util.format("KKK permitted '%s'", content.document.title), 2000);
        }, "KKK - permit this site");

ext.add("kkk-prevent", function () {
            kkk.status = true;
            display.echoStatusBar(util.format("KKK prevented '%s'", content.document.title), 2000);
        }, "KKK - prevent this site");
