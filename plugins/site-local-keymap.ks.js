// PLUGIN INFO: {{{
var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Site local keymap</name>
    <name lang="ja">サイトローカル・キーマップ</name>
    <description>Define keybindings by each site</description>
    <description lang="ja">ウェブサイト毎にキーバインドを定義</description>
    <version>1.0.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/site-local-keymap.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/site-local-keymap.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.8</minVersion>
    <include>main</include>
    <options>
        <option>
            <name>remap_pages.local_keymap</name>
            <type>object</type>
            <description>Local keymaps by each site</description>
            <description lang="ja">サイト毎のローカルキーマップ (詳細は説明を参照のこと)</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Setting the site local keymap ====

Paste the code below to your .keysnail.js PRESERVE area or preserved codes area in the setting dialog.

>||
(function () {
     function fake(aKey, aKsHandle) {
         return function (ev, arg) {
             ev.stopPropagation();
             ev.originalTarget.dispatchEvent(key.stringToKeyEvent(aKey, !aKsHandle));
         };
     }
     var local = {};

     // ============================================================ //

     local["https?://mail.google.com/mail/*"] = [
         ["j", null],
         ["k", null],
         [["C-c", "w"], function () { window.alert("hoge"); }]
     ];

     local["http://www.google.com/reader/view/*"] = [
         ["j", fake("n")],
         ["k", fake("p")]
     ];

     local["http://wiki.github.com/*"] = [
         ["j", null],
         ["k", null]
     ];

     // ============================================================ //

     plugins.options["remap_pages.local_keymap"] = local;
 })();
||<

In this example, we disable the KeySnail's j / k keybindings in the Gmail and github. Meanwhile, in the Google Reader, we rebinds the  n / p to the j / k.

You can specify the local key settings to the local["URL pattern"] following the expressions below.

>||
[
 [(key|[key sequence]), (function|null)],
 [(key|[key sequence]), (function|null)],
               ...
]
||<

When null is specified, KeySnail ignores the key while in that site. This is useful if you prefer the web site's shortcut key.
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== サイトローカルなキーバインドの定義 ====

.keysnail.js の PRESERVE エリアか設定ダイアログ内「その他のコード」へ、次のようなコードを張り付けます。

>||
(function () {
     function fake(aKey, aKsHandle) {
         return function (ev, arg) {
             ev.stopPropagation();
             ev.originalTarget.dispatchEvent(key.stringToKeyEvent(aKey, !aKsHandle));
         };
     }
     var local = {};

     // ============================================================ //

     local["https?://mail.google.com/mail/*"] = [
         ["j", null],
         ["k", null],
         [["C-c", "w"], function () { window.alert("hoge"); }]
     ];

     local["http://www.google.com/reader/view/*"] = [
         ["j", fake("n")],
         ["k", fake("p")]
     ];

     local["http://wiki.github.com/*"] = [
         ["j", null],
         ["k", null]
     ];

     // ============================================================ //

     plugins.options["remap_pages.local_keymap"] = local;
 })();
||<

ここでは Gmail, github の Wiki ページにて j / k を無効にし、 Google Reader においては j / k 入力をそれぞれ n / p にリマップしています。

上記の例を見て分かるとおり local["キーの再定義を行いたいページの URL パターン"] には

>||
[
 [(キー|[キーシーケンス]), (関数|null)],
 [(キー|[キーシーケンス]), (関数|null)],
               ...
]
||<

といったものを指定します。

null が指定された場合、 KeySnail はそのサイトにいる間、そのキーを一時的に無視するようになります。各ウェブサイトのショートカットキーを優先させたい場合などに便利でしょう。
]]></detail>
</KeySnailPlugin>;
// }}}

// ChangeLog : {{{
// ==== 1.0.2 (2009 11/01) ====
//
// * Made local key bindings with key sequence work correctly.
//
// ==== 1.0.1 (2009 11/01) ====
//
// * Released.
//
// }}}

// {pattern : keymap}
var localKeyMaps = {};

// ============================================================ //

// arrange keymap
key.modes.SITELOCAL = "sitelocal";

function locationChangeHandler(aNsURI) {
    if (!aNsURI)
        return;

    var url = aNsURI.spec;
    var keymap;

    for (var regexp in localKeyMaps)
    {
        if (url.match(regexp))
        {
            keymap = localKeyMaps[regexp];
            // TODO: need some visual effects?
            break;
        }
    }

    key.keyMapHolder[key.modes.SITELOCAL] = keymap;
}

if (my.remapPagesLocationChangeHandler)
    hook.removeHook('LocationChange', my.remapPagesLocationChangeHandler);
my.remapPagesLocationChangeHandler = locationChangeHandler;

hook.addToHook('LocationChange', locationChangeHandler);

// ============================================================ //

// save key.getCurrentMode
if (!my.originalGetCurrentMode) {
    my.originalGetCurrentMode = key.getCurrentMode;
}

// override mode detector
key.getCurrentMode = function (aEvent, aKey) {
    if (key.keyMapHolder[key.modes.SITELOCAL])
    {
        if (typeof(key.keyMapHolder[key.modes.SITELOCAL][aKey]) != "undefined")
        {
            return key.modes.SITELOCAL;
        }
    }

    return my.originalGetCurrentMode.call(key, aEvent);
};

// ============================================================ //

function processLocalKeyMap() {
    var keyMapDefinition = plugins.options["remap_pages.local_keymap"];

    if (!keyMapDefinition)
        return;

    for (var pattern in keyMapDefinition)
    {
        var regexp = pattern.replace(".", "\\.", "g");
        regexp     = regexp.replace("*", ".*", "g");

        if (!localKeyMaps[regexp])
            localKeyMaps[regexp] = {};

        for each(var pair in keyMapDefinition[pattern])
        {
            var keySetting = pair[0];
            var definition = pair[1];

            if (typeof keySetting == "string")
            {
                // single stroke
                localKeyMaps[regexp][keySetting] = definition;
            }
            else
            {
                // key sequence
                var current = localKeyMaps[regexp];

                for (var i = 0; i < keySetting.length - 1; ++i) {
                    var keyStr = keySetting[i];

                    if (typeof(current[keyStr]) != "object")
                        current[keyStr] = {};

                    current = current[keyStr];
                }

                current[keySetting[i]] = definition;
            }
        }
    }
}

processLocalKeyMap();
