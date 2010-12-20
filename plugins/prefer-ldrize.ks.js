// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Prefer LDRize</name>
    <description>Prefer LDRize keyboard shortcut</description>
    <description lang="ja">LDRize と KeySnail を共存</description>
    <version>1.0.5</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/prefer-ldrize.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/prefer-ldrize.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.8</minVersion>
    <include>main</include>
    <provides>
        <ext>prefer-ldrize-toggle-status</ext>
        <ext>prefer-ldrize-open-minibuffer</ext>
        <ext>prefer-ldrize-toggle-help</ext>
        <ext>prefer-ldrize-scroll-next-item</ext>
        <ext>prefer-ldrize-scroll-previous-item</ext>
        <ext>prefer-ldrize-pin</ext>
        <ext>prefer-ldrize-toggle-pinned-items-list</ext>
        <ext>prefer-ldrize-focus-on-search-box</ext>
        <ext>prefer-ldrize-open-in-current-tab</ext>
        <ext>prefer-ldrize-open-pinned-items-or-current-item</ext>
        <ext>prefer-ldrize-open-in-iframe</ext>
        <ext>prefer-ldrize-change-siteinfo</ext>
    </provides>
    <options>
        <option>
            <name>prefer_ldrize.keymap</name>
            <type>object</type>
            <description>Local keymaps in LDRize enabled site</description>
            <description lang="ja">LDRize が有効となっているサイトでのキーマップ</description>
        </option>
        <option>
            <name>prefer_ldrize.black_list</name>
            <type>[regexp]</type>
            <description>URL regexp list of sites you want to suspend the Prefer LDRize.</description>
            <description lang="ja">Prefer LDRize を自動的に一時停止とさせたいサイトの URL リストを正規表現指定</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Prefer LDRize ====

This plugin allows user to disable / change the part of KeySnail keybindings in the site LDRize enabled.

By default, keybindings listed below are disabled in the LDRize enabled site.

- :
- ?
- j
- k
- p
- l
- f
- v
- o
- i
- s

You can customize the keybindings via the .keysnail.js file.

>|javascript|
plugins.options["prefer_ldrize.keymap"] = {
    ":"   : null,
    "j"   : null,
    "k"   : null,
    "p"   : null,
    "v"   : null,
    "o"   : null
};
||<

You can also set functions to the keymap.

>|javascript|
plugins.options["prefer_ldrize.keymap"] = {
    ":"   : null,
    "m"   : function (ev, arg) {
        display.prettyPrint("LDRize enabled",
                            {timeout: 1200, fade: 70});
    },
    "j"   : null,
    "k"   : null,
    "p"   : null,
    "v"   : null,
    "o"   : null
}
||<

==== Using black list ====

If you want Prefer LDRize to be suspend in the certain site LDRize enabled, paste the code like below example to your .keysnail.js file.

>|javascript|
plugins.options["prefer_ldrize.black_list"] = [
    "www\\.youtube\\.com/watch.*",
    "(www|tw|es|de|)\\.nicovideo\\.jp/watch/.*"
];
||<

You can specify the regular expression matches URL of certain sites you want Prefer LDRize to be suspend.

Have a nice browsing with LDRize and KeySnail!
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== LDRize を優先 ====

LDRize が有効となっているサイトで、 KeySnail のキーバインドを「一部だけ」無効にしたり変更したりすることが可能となります。

デフォルトの状態では LDRize の有効となっているサイトで以下のキーバインドが無効となります。

- :
- ?
- j
- k
- p
- l
- f
- v
- o
- i
- s

無効とするキーバインドを変更したい場合は .keysnail.js 内で次のようにして設定して下さい。

>|javascript|
plugins.options["prefer_ldrize.keymap"] = {
    ":"   : null,
    "j"   : null,
    "k"   : null,
    "p"   : null,
    "v"   : null,
    "o"   : null,
    "J"   : function () { goDoCommand("cmd_scrollLineDown"); },
    "K"   : function () { goDoCommand("cmd_scrollLineUp"); }
};
||<

上の例では必要最小限の設定を行っています。

また、上記で null としているところに関数を指定することも可能となっています。これが何の役に立つかは、あなた次第です。

>|javascript|
plugins.options["prefer_ldrize.keymap"] = {
    ":"   : null,
    "m"   : function (ev, arg) {
        display.prettyPrint("LDRize が有効ですよ",
                            {timeout: 1200, fade: 70});
    },
    "j"   : null,
    "k"   : null,
    "p"   : null,
    "v"   : null,
    "o"   : null,
    "J"   : function () { goDoCommand("cmd_scrollLineDown"); },
    "K"   : function () { goDoCommand("cmd_scrollLineUp"); }
}
||<

==== LDRize 対応のサイトではじめから KeySnail のキーバインドを優先 ====

LDRize 対応のサイトでも、 KeySnail で定義したほうのキーバインドを優先させたい。いちいち Prefer LDRize をサスペンドするのは面倒だ、という方は次のような設定を初期化ファイルへ仕込んでおくと幸せになれます。

>|javascript|
plugins.options["prefer_ldrize.black_list"] = [
    "www\\.youtube\\.com/watch.*",
    "(www|tw|es|de|)\\.nicovideo\\.jp/watch/.*"
];
||<

prefer_ldrize.black_list には「デフォルトで Prefer LDRize を無効にさせたいページの URL 正規表現」を指定します。

==== LDRize のコマンドをエクステ化 ====

このプラグインを有効にすることにより LDRize のコマンドがエクステ化されます。

これにより、 KeySnail の強みを生かして LDRize のコマンドをキーシーケンスへ割り当てる、といったことも可能となります。

LDRize と KeySnail で快適なブラウジングを！

]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
//
// ==== 1.0.5 (2010 01/06) ====
//
// * Fixed the bug when this plugin reloaded, the evalInSandbox of GM
//   sometimes becomes strange and cause odd behavior.
//
// ==== 1.0.4 (2009 11/14) ====
//
// * Added suspend icon.
//
// * Made status site local.
//
// * Fixed the bug that when use reload this plugin, suspend function does not work
//
// ==== 1.0.3 (2009 11/14) ====
//
// * Fixed the crucial bug (around the greasemonkey hook)
//
// ==== 1.0.2 (2009 11/14) ====
//
// * Added statusbar icon.
//
// ==== 1.0.1 (2009 11/14) ====
//
// * Convert all LDRize commands to KeySnail exts.
// * Made plugin work correctly in the site which has LDRize enabled iframe content like p2.2ch.net.
// * Fixed the typo.
//
// ==== 1.0.0 (2009 11/14) ====
//
// * Released
//
// }} ======================================================================= //

var preferLDRize =
    (function () {
         // Keymap handling {{ ======================================================= //

         key.modes.LDRIZE = "ldrize";

         var ldrizeKeymap = plugins.options["prefer_ldrize.keymap"] ||
             {
                 ":"   : null,
                 "?"   : null,
                 "j"   : null,
                 "k"   : null,
                 "p"   : null,
                 "l"   : null,
                 "f"   : null,
                 "v"   : null,
                 "o"   : null,
                 "i"   : null,
                 "s"   : null
             };

         function setKeymap(aBool) {
             return key.keyMapHolder[key.modes.LDRIZE] = (aBool) ? ldrizeKeymap : undefined;
         }

         function setStatusbarIcon() {
             var keymap = key.keyMapHolder[key.modes.LDRIZE];

             // change statusbar icon
             if (keymap)
             {
                 if (self.status)
                 {
                     iconElem.setAttribute("src", enabledIconData);
                     iconElem.tooltipText = M({en: "LDRize preferred",
                                               ja: "LDRize が優先されてます"});
                 }
                 else
                 {
                     iconElem.setAttribute("src", suspendedIconData);
                     iconElem.tooltipText = M({en: "Prefer LDRize disabled",
                                               ja: "Prefer LDRize にはちょっとお休みしてもらってます"});
                 }
             }
             else
             {
                 iconElem.setAttribute("src", disabledIconData);
                 iconElem.tooltipText = M({en: "LDRize is not enabled",
                                           ja: "ここは LDRize の管轄外です"});
             }
         }

         function setup() {
             if (!content || !content.document)
             {
                 self.status = false;
             }
             // check for site local status
             else
             {
                 if (typeof content.document.__preferLDRizeStatus__ === "undefined")
                 {
                     // check for the black list
                     if (plugins.options["prefer_ldrize.black_list"] &&
                         // check if current url does not match any pattrens in black list
                         plugins.options["prefer_ldrize.black_list"].some(
                             function (aPattern) {
                                 return (typeof content.location.href == "string" &&
                                         content.location.href.match(aPattern));
                             }))
                     {
                         // matched black list
                         self.status = false;

                     }
                     else
                     {
                         self.status = true;
                     }

                     content.document.__preferLDRizeStatus__ = self.status;
                 }
                 else
                 {
                     self.status = content.document.__preferLDRizeStatus__;
                 }
             }

             setKeymap(ldrizeEnabled());
             setStatusbarIcon();
         }

         // }} ======================================================================= //

         // Status bar icon {{ ======================================================= //

         const enabledIconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAAn9JREFU' +
             'OMulk0uIjXEYxn/f9505ZmiOOSK51sy4RUwzhIwFWVtJSlnIAiEbiqWRwlbJxk5KyUIxM0W5hWlG' +
             'uTMu4zLm0DjG6Vy//+39W3zRlMvGW2/Ps3je93kX7xN47/mfSv0k0tOz0Du3wVs7Rax9K9Z212/Z' +
             'UgAonjmTFa23itaHnFJDotTJ6V1dVwAC7z3S3b3PO3eE+nSWMELKJUyh+EyM2SZaV0Tri3VTmpZO' +
             'mNeKK5WoPHxENfflnFNqV+CuXt3orb4cLlxAEEZgDKTTmOFhas9ffnRalxtamxfXt7RAYQzCCJqy' +
             'fO/t5fujJ8dSYu3eaNZMgmoVcl/ACVhLXfMcopXtc32sieoboP8BiCQGjRPJdK4h39e/PSXGLIky' +
             'GRh6B8aCF3AOXrwmnJyBKIDBN4CAtgnmxwhaBRfHmZQYk8Y5iBUolSzQJlkykgNrE2cR8A6UAXFg' +
             'NKKUpETrord2WmANxDWwLhm2NsHx3FpwFlIhhCFOqTAUpa7bwUGYPRMqZajVII7BqAR1nGCtlhiU' +
             'SjC/hfyNW4hS50On1InKh0/v408j0LYU0lEiKleTgWoNVAzVCtSFsHYVhdExcle6x0TrrsB7T/74' +
             '8WWi1NmGbOOKScuXE47mYOAJBEFyerUKbYvwzfMY7enl8+17T8WY3R39/XeCn6/8+fDhyU6pA6LU' +
             '/mxHW2PjrBlw9x4Uy7B2NcVvBd6fv6BF69NizLGOgYH8r08cX+927FjhlDrV1Dx39dQN68FZ8nfu' +
             'MnL95pBovbP9/v1r4/XBn8L0avPmJqfUUdF6T3bOjODryzeXROuD7X19Q7+Jvfd/7cfr1m162Nm5' +
             '/1+a4H/j/AMWg7ZlV6wt2QAAAABJRU5ErkJggg==';

         const disabledIconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBI' +
             'WXMAAAsTAAALEwEAmpwYAAACVklEQVQ4y6VTP2hTcRD+fi/9Q1sSTZrXDg20m2DQLh3cBac6uQnO' +
             'KiIuChb6B5UOZhNBujgUxEmkCBIsupm5lEYebbBYH1jahDwrSZO++373c0qoRV16cNxx9313w91n' +
             'nHM4jfV0kkqlck5VL6tqxlr71VpbnJyc/AkApVIpTfI6yYcisk2yMD09/R4AjHMOlUrlrqo+SiQS' +
             'aWMMjo6OcHh4+MVae4Nkk+SbwcHBC77vo91uIwxDRFH0SkRuma2trask32WzWXieB1VFIpFAFEXY' +
             '3d39TrLh+/553/fRarVgjMHAwADK5TJ2dnYWTRAEH5LJ5BXP89BoNOCcg6oilUrBWguS6OvrQ7Va' +
             '7fZ6e3uRTqdRLBZ/eCTz/f39aDabUNWu1+t1tNttkMT+/j5UFdZaqCparRaccxCRVI+1ts85193W' +
             '2aKqiOMYqgrn3B/1zjAR0R6Sv6y1fmdAh9ABniSqKowxMMZARDxPRD5Vq1Ukk0nEcQyS//U4jpFO' +
             'pxEEAUi+9kTkaa1W+xZFEUZGRtA5o4iAZDfGcQxjDMbGxhBFEdbW1uokHxvnHFZXVy+SfDk0NDQ1' +
             'Pj6ORqOBvb09GGOgqhARZLNZZDIZrK+vIwiCsrX29vz8/GfTeeWVlZUzInKf5L2JiYnk8PAwwjBE' +
             'HMfI5XI4ODhAqVSKSb4gubiwsFDrfuJxW15enhKR56Ojo5fy+TxUFZubm9jY2NgmeXN2dvbjcbz5' +
             'm5iWlpbOisgTknd83zdhGL4l+WBubm77JNb8T42FQuGatTY3MzPz7F8Yc1o5/wZLQt+rlf6LvQAA' +
             'AABJRU5ErkJggg==';

         const suspendedIconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAAslJREFU' +
             'OMulU1tLVFEU/vaccZpR52alqaPmmApJSWLR5cl86KmgQuz6ED4UVPjigxJEGRnUY0L+gCgIn4Lx' +
             'BpJmF0JMRTStvI/TmNPM5NzO/bTOTPogEUEHFmuz1/6+/e3vrMU0TcP/fMaNhdrTU64pSq0my1mq' +
             'LM9SdJvr68N6bb2jw6mK4gWKZkUQ5lRBeJjT2urRa0xXoHZ33yTwXZhNThg4qNEIpPD6pCpJlwkU' +
             'o+hMy3Ls27anBEokgtjYOOI+/1Miu8aUrq6Tmiy+NJSXgREYkgSYTJCWl5GYml5SRDFqKSnea3a7' +
             'gXAQ+gVwOBHq7UVofOK+kaTe4PLzwOJxwOcHFBWQZaQVF4A7dKBQ40VwZgswPELvVFMXWNNhO3YU' +
             'gQ/DV4wks4Kz2YC5eSrKgEaHFAX49AUGO+1zDJj5qrsEiHIqB4JgJSoUnrfpBKYkgBcAQUgRiFKK' +
             'ZMWXVJO8WQ+N9gSqqZQlEWSmaiSD1sn5nUymAp8ggJIC60BlyzqZKYwG8sIAMtFgIJZ+eWYGcOUB' +
             'sSiQIBKepxuEVBb5VE7uU9BfQKkbgYHXuoJnLNze7iYV/ZYi127zrhxgcgpYC/5uDmVThXdtjGIU' +
             'sdB3cJk2pP3MjKfHs8u4Bx5PKDY4+Ir3+Q+qoR95aZX7wdKpvxa9KTC57l0dRcgeRsWZBpRebERO' +
             'thUhfoULRiYW2UYrf2tpsdObmkhWo7Oq0mrNzwXevac2jGJouRPVDU2wzA6QsW8AuwMBYxE+9g3N' +
             's62zMN/QUE1Ejx3FhYd31NYkTetvO4Xjj16AVZ3ePBe+k4uRoYDG/jRMn+vqHERyj7y57izIZVML' +
             'zxNHzl+yZCx5ICT8oJZDZJ3D9CxW2N+mcaKm5iz1iSvimnearBm3CrbLRqPBi8iajIVVTpF47Tb7' +
             '13F+e66wORb0XeUUVqRw2gqhnpzok9t+AccapT/6IvLXAAAAAElFTkSuQmCC';

         function setAttributes(aElem, aAttributes) {
             for (var key in aAttributes)
             {
                 aElem.setAttribute(key, aAttributes[key]);
             }
         }

         const CONTAINER_ID = "keysnail-prefer-ldrize-container";
         const ICON_ID      = "keysnail-prefer-ldrize-icon";

         var statusbar      = document.getElementById("status-bar");
         var statusbarPanel = document.getElementById("keysnail-status");
         var container      = document.getElementById(CONTAINER_ID);
         var iconElem       = document.getElementById(ICON_ID);

         if (!container)
         {
             // create a new one
             container = document.createElement("statusbarpanel");
             setAttributes(container,
                           {
                               align : "center",
                               id    : CONTAINER_ID
                           });

             iconElem = document.createElement("image");
             setAttributes(iconElem,
                           {
                               id  : ICON_ID,
                               src : disabledIconData
                           });

             container.appendChild(iconElem);
             statusbar.insertBefore(container, statusbarPanel);
         }

         iconElem.onmouseup = function () { self.toggleStatus(); };

         // }} ======================================================================= //

         // Hook greasemonkey {{ ===================================================== //

         var gmService = Cc["@greasemonkey.mozdev.org/greasemonkey-service;1"];

         if (!gmService)
         {
             // greasemonkey not installed
             return null;
         }

         gmService = gmService.getService().wrappedJSObject;

         if (!my.savedEvalInSandbox)
             my.savedEvalInSandbox = gmService.evalInSandbox;

         gmService.evalInSandbox = function (code, codebase, sandbox) {
             my.savedEvalInSandbox.apply(this, arguments);

             try
             {

                 if (sandbox.window.Minibuffer != undefined && sandbox.window.LDRize != undefined)
                 {
                     sandbox.window.addEventListener("focus", function () {
                                                         setup();
                                                     }, false);
                     sandbox.window.addEventListener("blur", function () {
                                                         setKeymap(false);
                                                         setStatusbarIcon();
                                                     }, false);

                     if (window.content.wrappedJSObject == sandbox.unsafeWindow)
                         setup();
                 }
             }
             catch (x)
             {
             }
         };

         // }} ======================================================================= //

         // Misc utils {{ ============================================================ //

         function ldrizeEnabled() {
             var enabled = false;

             (function (frame) {
                  if (frame.document.getElementById("gm_ldrize") &&
                      document.commandDispatcher.focusedWindow == frame)
                  {
                      enabled = true;
                      return;
                  }

                  for (var i = 0; i < frame.frames.length; ++i)
                  {
                      arguments.callee(frame.frames[i]);
                  }
              })(window.content);

             return enabled;
         }

         // }} ======================================================================= //

         // Override mode detector {{ ================================================ //

         // save key.getCurrentMode
         if (!my.preferLDRizeOriginalGetCurrentMode)
         {
             my.preferLDRizeOriginalGetCurrentMode = key.getCurrentMode;
         }

         // override mode detector
         key.getCurrentMode = function (aEvent, aKey) {
             if (self.status && key.keyMapHolder[key.modes.LDRIZE] && !util.isWritable(aEvent))
             {
                 if (typeof(key.keyMapHolder[key.modes.LDRIZE][aKey]) != "undefined")
                 {
                     return key.modes.LDRIZE;
                 }
             }

             return my.preferLDRizeOriginalGetCurrentMode.call(key, aEvent, aKey);
         };

         // }} ======================================================================= //

         // Public {{ ================================================================ //

         var self = {
             get status() {
                 return my.preferLDRizeStatus;
             },

             set status(aStatus) {
                 my.preferLDRizeStatus = aStatus;
                 content.document.__preferLDRizeStatus__ = aStatus;
             },

             toggleStatus: function toggleStatus() {
                 self.status = !self.status;
                 setKeymap(self.status);

                 setStatusbarIcon();

                 display.echoStatusBar(M({ja: "Prefer LDRize が", en: "Prefer LDRize"}) +
                                       (self.status ?
                                        M({ja: "有効になりました", en: " enabled"}) :
                                        M({ja: "無効になりました", en: " disabled"})));

                 gBrowser.focus();
                 _content.focus();
             }
         };

         // on the first time (not reloaded)
         if (typeof self.status == "undefined")
             self.status = true;

         // }} ======================================================================= //

         return self;
     }
    )();

// Provides exts {{ ========================================================= //

if (preferLDRize)
{
    ext.add("prefer-ldrize-toggle-status", preferLDRize.toggleStatus,
            M({ja: 'LDRize 優先状態の切り替え',
               en: "Toggle prefer ldrize status"}));

    // Make LDRize commands as exts  {{ ========================================= //

    var ldRizeKeys = {
        ":" : ["prefer-ldrize-open-minibuffer"                  , M({en: "Open Minibuffer",                  ja: "ミニバッファを開く"})],
        "?" : ["prefer-ldrize-toggle-help"                      , M({en: "Toggle help",                      ja: "ヘルプを表示 / 非表示"})],
        "j" : ["prefer-ldrize-scroll-next-item"                 , M({en: "Scroll next item",                 ja: "次のアイテムへスクロール"})],
        "k" : ["prefer-ldrize-scroll-previous-item"             , M({en: "Scroll previous item",             ja: "前のアイテムへスクロール"})],
        "p" : ["prefer-ldrize-pin"                              , M({en: "Pin",                              ja: "ピンを立てる"})],
        "l" : ["prefer-ldrize-toggle-pinned-items-list"         , M({en: "Toggle pinned items list",         ja: "ピンの立てられたアイテム一覧の表示タイプを切り替え"})],
        "f" : ["prefer-ldrize-focus-on-search-box"              , M({en: "Focus on search box",              ja: "検索ボックスへフォーカス"})],
        "v" : ["prefer-ldrize-open-in-current-tab"              , M({en: "Open in current tab",              ja: "現在のタブでアイテムを開く"})],
        "o" : ["prefer-ldrize-open-pinned-items-or-current-item", M({en: "Open pinned items or current item",ja: "ピンの立ったアイテム / 現在のアイテムを開く"})],
        "i" : ["prefer-ldrize-open-in-iframe"                   , M({en: "Open in iframe",                   ja: "インラインフレームでアイテムを開く"})],
        "s" : ["prefer-ldrize-change-siteinfo"                  , M({en: "Change Siteinfo",                  ja: "使用する Siteinfo を変更"})]
    };

    function makeLDRizeCommand(aKey) {
        return function (ev, arg) {
            key.feed(aKey, 0, "keypress");
        };
    }

    function makeLDRizeDescription(aDescription) {
        return "LDRize - " + aDescription;
    }

    for (var keystr in ldRizeKeys)
    {
        ext.add(ldRizeKeys[keystr][0], makeLDRizeCommand(keystr), makeLDRizeDescription(ldRizeKeys[keystr][1]));
    }

    // }} ======================================================================= //
}

// }} ======================================================================= //
