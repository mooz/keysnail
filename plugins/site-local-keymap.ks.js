// PLUGIN INFO: {{{
var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Site local keymap</name>
    <name lang="ja">サイトローカル・キーマップ</name>
    <description>Define keybindings by each site</description>
    <description lang="ja">ウェブサイト毎にキーバインドを定義</description>
    <version>1.1.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/site-local-keymap.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/site-local-keymap.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.1.8</minVersion>
    <include>main</include>
    <provides>
        <ext>site-local-keymap-toggle-status</ext>
    </provides>
    <options>
        <option>
            <name>site_local_keymap.local_keymap</name>
            <type>array</type>
            <description>Local keymaps by each site</description>
            <description lang="ja">サイト毎のローカルキーマップ (詳細は説明を参照のこと)</description>
        </option>
        <option>
            <name>site_local_keymap.disable_in_textarea</name>
            <type>boolean</type>
            <description>Disable site local keymap in the textarea (Default: )</description>
            <description lang="ja">編集エリアではサイトローカルのキーマップを無視する (デフォルト値 true)</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Setting the site local keymap ====

Paste the code below to your .keysnail.js PRESERVE area or preserved codes area in the setting dialog.

>|javascript|
var local = {};
plugins.options["site_local_keymap.local_keymap"] = local;

function fake(k, i) function () { key.feed(k, i); };
function pass(k, i) [k, fake(k, i)];
function ignore(k, i) [k, null];

local["^https?://mail.google.com/mail/"] = [
    pass(['g', 'i']),
    pass(['g', 's']),
    pass(['g', 't']),
    pass(['g', 'd']),
    pass(['g', 'a']),
    pass(['g', 'c']),
    pass(['g', 'k']),
    // thread list
    pass(['*', 'a']),
    pass(['*', 'n']),
    pass(['*', 'r']),
    pass(['*', 'u']),
    pass(['*', 's']),
    pass(['*', 't']),
    // navigation
    ['u', null],
    ['k', null],
    ['j', null],
    ['o', null],
    ['p', null],
    ['n', null],
    // application
    ['c', null],
    ['/', null],
    ['q', null],
    ['?', null],
    // manipulation
    ['x', null],
    ['s', null],
    ['y', null],
    ['e', null],
    ['m', null],
    ['!', null],
    ['#', null],
    ['r', null],
    ['R', null],
    ['a', null],
    ['A', null],
    ['f', null],
    ['F', null],
    ['N', null],
    pass(['<tab>', 'RET']),
    ['ESC', null],
    [']', null],
    ['[', null],
    ['z', null],
    ['.', null],
    ['I', null],
    ['U', null],
    ['C-s', null],
    ['T', null]
];

local["^http://www.google.(co.jp|com)/reader/view/"] = [
    // jump
    pass(["g", "h"]),
    pass(["g", "a"]),
    pass(["g", "s"]),
    pass(["g", "S"]),
    pass(["g", "u"]),
    pass(["g", "t"]),
    pass(["g", "T"]),
    pass(["g", "d"]),
    pass(["g", "f"]),
    pass(["g", "F"]),
    pass(["g", "c"]),
    pass(["g", "C"]),
    pass(["g", "e"]),
    pass(["g", "p"]),
    // navigation
    ["j", null],
    ["k", null],
    ["n", null],
    ["p", null],
    ["N", null],
    ["P", null],
    ["X", null],
    ["o", null],
    // item
    ["s", null],
    ["L", null],
    ["t", null],
    ["e", null],
    ["S", null],
    ["d", null],
    ["v", null],
    ["o", null],
    ["c", null],
    ["C", null],
    ["m", null],
    ["A", null],
    ["T", null],
    // application
    ["r", null],
    ["u", null],
    ["1", null],
    ["2", null],
    ["/", null],
    ["a", null],
    ["=", null],
    ["-", null]
];
||<

In this example, keysnail prefer the shortcut keys of Gmail and Google Reader.

You can specify the local keybindings by changing local["URL pattern"] in following expressions listed below.

>||
[
 [(key|[key sequence]), (function|null)],
 [(key|[key sequence]), (function|null)],
               ...
]
||<

When null is specified, keysnail ignores the key pressed in that site. This is useful if you prefer the web site's shortcut keys.

You can switch "Shotcut keys in that site" and "KeySnail's keybindings" by calling site-local-keymap-toggle-status.

>|javascript|
key.setGlobalKey("C-;", function (ev, arg) {
    ext.exec("site-local-keymap-toggle-status", arg, ev);
}, 'Site local keymap', true);
||<
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== サイトローカルなキーバインドの定義 ====

.keysnail.js の PRESERVE エリアか設定ダイアログ内「その他のコード」へ、次のようなコードを張り付けます。'"

>|javascript|
var local = {};
plugins.options["site_local_keymap.local_keymap"] = local;

function fake(k, i) function () { key.feed(k, i); };
function pass(k, i) [k, fake(k, i)];
function ignore(k, i) [k, null];

local["^https?://mail.google.com/mail/"] = [
    pass(['g', 'i']),
    pass(['g', 's']),
    pass(['g', 't']),
    pass(['g', 'd']),
    pass(['g', 'a']),
    pass(['g', 'c']),
    pass(['g', 'k']),
    // thread list
    pass(['*', 'a']),
    pass(['*', 'n']),
    pass(['*', 'r']),
    pass(['*', 'u']),
    pass(['*', 's']),
    pass(['*', 't']),
    // navigation
    ['u', null],
    ['k', null],
    ['j', null],
    ['o', null],
    ['p', null],
    ['n', null],
    // application
    ['c', null],
    ['/', null],
    ['q', null],
    ['?', null],
    // manipulation
    ['x', null],
    ['s', null],
    ['y', null],
    ['e', null],
    ['m', null],
    ['!', null],
    ['#', null],
    ['r', null],
    ['R', null],
    ['a', null],
    ['A', null],
    ['f', null],
    ['F', null],
    ['N', null],
    pass(['<tab>', 'RET']),
    ['ESC', null],
    [']', null],
    ['[', null],
    ['z', null],
    ['.', null],
    ['I', null],
    ['U', null],
    ['C-s', null],
    ['T', null]
];

local["^http://www.google.(co.jp|com)/reader/view/"] = [
    // jump
    pass(["g", "h"]),
    pass(["g", "a"]),
    pass(["g", "s"]),
    pass(["g", "S"]),
    pass(["g", "u"]),
    pass(["g", "t"]),
    pass(["g", "T"]),
    pass(["g", "d"]),
    pass(["g", "f"]),
    pass(["g", "F"]),
    pass(["g", "c"]),
    pass(["g", "C"]),
    pass(["g", "e"]),
    pass(["g", "p"]),
    // navigation
    ["j", null],
    ["k", null],
    ["n", null],
    ["p", null],
    ["N", null],
    ["P", null],
    ["X", null],
    ["o", null],
    // item
    ["s", null],
    ["L", null],
    ["t", null],
    ["e", null],
    ["S", null],
    ["d", null],
    ["v", null],
    ["o", null],
    ["c", null],
    ["C", null],
    ["m", null],
    ["A", null],
    ["T", null],
    // application
    ["r", null],
    ["u", null],
    ["1", null],
    ["2", null],
    ["/", null],
    ["a", null],
    ["=", null],
    ["-", null]
];
||<

ここでは Gmail, Google Reader においてサイト側のショートカットキーを優先させるようにしています。

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

以下のようにして適当なキーへ site-local-keymap-toggle-status を割り当てておけば、ワンキーで「サイト側のショートカットキー」と「KeySnail のキーバインド」を切り替えることが可能となりとても便利です。

>|javascript|
key.setGlobalKey("C-;", function (ev, arg) {
    ext.exec("site-local-keymap-toggle-status", arg, ev);
}, 'Site local keymap', true);
||<
]]></detail>
</KeySnailPlugin>;
// }}}

// ChangeLog : {{{
//
// ==== 1.1.1 (2010 03/24) ====
//
// * Fixed the bug when use transit about:blank from the page local-keymap enabled,
//   local keymap still be used;
//
// ==== 1.1.0 (2010 02/14) ====
//
// * Fixed the settings of Gmail in the document
//
// ==== 1.0.9 (2009 12/9) ====
//
// * Updated details.
//
// ==== 1.0.8 (2009 12/5) ====
//
// * Made status site local. Renamed option prefix name to "site_local_keymap" from "remap_pages".
//
// ==== 1.0.6 (2009 11/13) ====
//
// * Removed Prefer LDRize cooperation
//   (Prefer LDRize behavior changed. So removed codes no longer needed)
//
// ==== 1.0.5 (2009 11/13) ====
//
// * Added prefer LDRize cooperation
//
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

var siteLocalKeymap =
    (function () {
         // {pattern : keymap}
         var localKeyMaps = {};

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
         if (typeof plugins.options["site_local_keymap.disable_in_textarea"] === "undefined")
             plugins.options["site_local_keymap.disable_in_textarea"] = true;

         // ============================================================ //

         // arrange keymap
         key.modes.SITELOCAL = "sitelocal";

         function locationChangeHandler(aNsURI) {
             // about:blank?
             if (!aNsURI || !aNsURI.spec)
             {
                 key.keyMapHolder[key.modes.SITELOCAL] = null;
                 key.updateStatusBar();
                 return;
             }

             var url = aNsURI.spec;
             var keymap;

             for (var regexp in localKeyMaps) if (localKeyMaps.hasOwnProperty(regexp)) {
                 if (url.match(regexp)) {
                     keymap = localKeyMaps[regexp];
                     break;
                 }
             }

             key.keyMapHolder[key.modes.SITELOCAL] = keymap;

             // change statusbar icon
             if (keymap && key.status && !key.suspended)
             {
                 iconElem.setAttribute("src", iconData);
                 iconElem.tooltipText = M({en: "Site local keymap of this page enabled",
                                           ja: "このサイト用のローカルキーマップが使われています"}) + " [" + regexp + "]";
             }
             else
             {
                 key.updateStatusBar();
             }
         }

         if (my.siteLocalKeymapLocationChangeHandler)
             hook.removeHook('LocationChange', my.siteLocalKeymapLocationChangeHandler);
         my.siteLocalKeymapLocationChangeHandler = locationChangeHandler;

         hook.addToHook('LocationChange', locationChangeHandler);

         // ============================================================ //

         // save key.getCurrentMode
         if (!my.siteLocalOriginalGetCurrentMode)
         {
             my.siteLocalOriginalGetCurrentMode = key.getCurrentMode;
         }

         // override mode detector
         key.getCurrentMode = function (aEvent, aKey) {
             if (self.status &&
                 key.keyMapHolder[key.modes.SITELOCAL] &&
                 !(plugins.options["site_local_keymap.disable_in_textarea"] && util.isWritable(aEvent)))
             {
                 if (typeof key.keyMapHolder[key.modes.SITELOCAL][aKey] !== "undefined")
                 {
                     return key.modes.SITELOCAL;
                 }
             }

             return my.siteLocalOriginalGetCurrentMode.call(key, aEvent, aKey);
         };

         // ============================================================ //

         function processLocalKeyMap() {
             var keyMapDefinition =
                 plugins.options["site_local_keymap.local_keymap"] ||
                 // to keep compatibility
                 plugins.options["remap_pages.local_keymap"];

             if (!keyMapDefinition)
                 return;

             for (var pattern in keyMapDefinition)
             {
                 var regexp = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");

                 if (!localKeyMaps[regexp])
                     localKeyMaps[regexp] = {};

                 for (let [, pair] in Iterator(keyMapDefinition[pattern]))
                 {
                     var keySetting = pair[0];
                     var definition = pair[1];

                     if (typeof keySetting === "string")
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

                             if (typeof current[keyStr] !== "object")
                                 current[keyStr] = {};

                             current = current[keyStr];
                         }

                         current[keySetting[i]] = definition;
                     }
                 }
             }
         }

         function checkLocationNow() {
             locationChangeHandler({spec : window.content.location.href});
         }

         function toggleStatus() {
             if (self.status)
             {
                 // disable
                 self.status = false;
                 key.keyMapHolder[key.modes.SITELOCAL] = undefined;
                 key.updateStatusBar();
             }
             else
             {
                 // enable
                 self.status = true;
                 checkLocationNow();
             }

             gBrowser.focus();
             _content.focus();
             document.commandDispatcher.advanceFocus();
         }

         var self = {
             get status() {
                 if (typeof content.document.__siteLocalKeymapStatus__ === "boolean")
                     return content.document.__siteLocalKeymapStatus__;

                 return self.status = true;
             },

             set status(aStatus) {
                 content.document.__siteLocalKeymapStatus__ = aStatus;
             },

             init: function () {
                 processLocalKeyMap();
                 checkLocationNow();
             },

             toggleStatus: toggleStatus
         };

         return self;
     })();

siteLocalKeymap.init();

ext.add("site-local-keymap-toggle-status",
        siteLocalKeymap.toggleStatus,
        M({ja: 'サイトローカルなキーマップの有効 / 無効を切り替え',
           en: "Toggle site local keymap"}));
