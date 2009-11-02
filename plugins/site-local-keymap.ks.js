// PLUGIN INFO: {{{
var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Site local keymap</name>
    <name lang="ja">サイトローカル・キーマップ</name>
    <description>Define keybindings by each site</description>
    <description lang="ja">ウェブサイト毎にキーバインドを定義</description>
    <version>1.0.4</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/site-local-keymap.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/site-local-keymap.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.8</minVersion>
    <include>main</include>
    <provides>
        <ext>site-local-keymap-toggle-status</ext>
    </provides>
    <options>
        <option>
            <name>remap_pages.local_keymap</name>
            <type>array</type>
            <description>Local keymaps by each site</description>
            <description lang="ja">サイト毎のローカルキーマップ (詳細は説明を参照のこと)</description>
        </option>
        <option>
            <name>remap_pages.disable_in_textarea</name>
            <type>boolean</type>
            <description>Disable site local keymap in the textarea (Default: )</description>
            <description lang="ja">編集エリアではサイトローカルのキーマップを無視する (デフォルト値 true)</description>
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
// ==== 1.0.4 (2009 11/02) ====
//
// * Fixed the bug when user transit to the about:blank from site local keymap defined,
//   the local keymap will be used and icon left to blue.
//
// * Made plugin disabled in editable areas by default.
//   This is because when we remap "j" to "n" in certain site,
//   and the site has editable area, we can't use the "j" key which is recognized
//   as the "n" key by the Firefox.
//   User can change this behavior by setting the remap_pages.disable_in_textarea option.
//
// ==== 1.0.3 (2009 11/01) ====
//
// * Added icon which indicates keysnail currently using the site local keymap.
//
// * Added ext which toggle the keymap status.
//
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
var status = true;

var iconData = "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A" +
    "/wD/oL2nkwAAAAlwSFlzAAACVgAAAlYBSEjC2wAAAAd0SU1FB9kLAQomGZyrHwEAAAItSURBVDjL" +
    "lZJdSJNhFMd/z7vXvW9lzo9sOmoucGqkY6bMYDPBpEiULkoMKTGLoIi+oC68kboMuyropkZQXUQX" +
    "FRjShZJOKkVr4Mg+jCkamLo0cUi57e3CemPYKs/VOc/5/3/PgXPE2bauQ4OB8WtDI9OprCKK7OZ5" +
    "d3HOeUOSpbJ7tWaAqS9hJRJZqpRXYy7KzcS5dRPmjHVomsbI+Fyy/D9GV6GFlmMeiu2mFb1/Ag7s" +
    "dtB22oUQ4o/9vwI8JVauninT61BY4+nzIC/9k6SYjFS5rEiJzAZJcOlEhV4/80+xo8GLEIILTSWc" +
    "qncSjWmJJ/CU5pKbrQIwEYpwpPUxPd5GNmcouiZruznxBOXObD2/9WiI5n2lceZfsQJwvM6FQRJk" +
    "ZSbrb50vPuDM2xCn6/HPMB/+CRBCkGddPofJmQWiMY3v32K6OD1N5UnvWBzAZknhTsfwMkCWZVwO" +
    "GwCzc1/ZYjHxJjiji5tqnXT4hnnQNcbiooHQQpSW6z1IkoRI9bRpAHvc+fS+GiXdpFJTUUB791t8" +
    "N+sQQqBpGodbO/ENBnWoapTpv9f4ewvvR6c4WO3g9sMBqstt3Ljfh7d9hKO1doQQ3L1cxeC7WfoC" +
    "n8lIXcNedw4pKkhFdvM8QPDTLDU7bUgGGaMsU2BL54q3l+7X0/qvJflpnNxfQP2uZTMQNjQ0n5uO" +
    "RJYqJ0NhY1mhFVVVWL9WRlEU+gMTtPs+Eo0lsc2+ESX+asLAxR/Sxa1hhI4dIQAAAABJRU5ErkJggg==";

var iconElem = document.getElementById("keysnail-statusbar-icon");
if (typeof plugins.options["remap_pages.disable_in_textarea"] == "undefined")
    plugins.options["remap_pages.disable_in_textarea"] = false;

// ============================================================ //

// arrange keymap
key.modes.SITELOCAL = "sitelocal";

function locationChangeHandler(aNsURI) {
    if (!status)
        return;

    // about:blank?
    if (!aNsURI)
    {
        localKeyMaps[regexp] = null;
        key.updateStatusBar();
        return;
    }

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

    // change statusbar icon
    if (keymap && key.status && !key.suspended) {
        iconElem.setAttribute("src", iconData);
        iconElem.tooltipText = M({en: "Site local keymap of this page enabled",
                                  ja: "このサイト用のローカルキーマップが使われています"});
    } else {
        key.updateStatusBar();
    }
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
    if (key.keyMapHolder[key.modes.SITELOCAL] &&
        !(plugins.options["remap_pages.disable_in_textarea"] && util.isWritable(aEvent)))
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

                for (var i = 0; i < keySetting.length - 1; ++i)
                {
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

function toggleStatus() {
    if (status)
    {
        // disable
        status = false;
        key.keyMapHolder[key.modes.SITELOCAL] = undefined;
        key.updateStatusBar();
    }
    else
    {
        // enable
        status = true;
        locationChangeHandler({spec : window.content.location.href});
    }

    gBrowser.focus();
    _content.focus();
    document.commandDispatcher.advanceFocus();
}

processLocalKeyMap();

ext.add("site-local-keymap-toggle-status", toggleStatus,
        M({ja: 'サイトローカルなキーマップの有効 / 無効を切り替え',
           en: "Toggle site local keymap"}));
