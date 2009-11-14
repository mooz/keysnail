// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Prefer LDRize</name>
    <description>Prefer LDRize keyboard shortcut</description>
    <description lang="ja">LDRize と KeySnail を共存</description>
    <version>1.0.4</version>
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

>||
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

>||
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

>||
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

>||
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

>||
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

>||
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
             // check for site local status
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

             setKeymap(ldrizeEnabled());
             setStatusbarIcon();
         }

         // }} ======================================================================= //

         // Status bar icon {{ ======================================================= //

         var enabledIconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A' +
             '/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9kLDgQHD7Ydgu8AAAAZdEVYdENv' +
             'bW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAACTUlEQVQ4y22Tv0vbbRTFPzdWaCGiiwRXB3Gp' +
             'oKMQxN3B/gEZ7Ozi4OQcDCSD/gkBq4tTliLZnCLUwSHSZhKimZQgjcSCzzkdvon6vvTAw3Mvz69z' +
             '7j1PSJJtcrlcANgGEJADTAQGwiYARRAQ2I6IyI0OAxhwRDgicLYB7u/h50+IyEa7TUgmInvNtre3' +
             'tzW+APDGxoZsO33/LoESWNWq/PWrBBJYv37JtskUOEvAI+jFtj5/tsAJZLCz2ALryxfZdu6d7v8g' +
             'B/DxI5Gl4YzdGz59ymZJyXayLUAjNkm23G4nQUoZ7eQsToKkP3+S7IRtDwYDdbtdA765ufHj46PG' +
             'UtRoaEQ70w5St/sm27YqlYpmZ2e1tLTkQqHgnZ2dZFujFit1OhmDqSnp928pW0u2HSPqY4wko3fx' +
             'qyn+gfhQrVa5u7uj3+/H4eGhZ2ZmYn9/P3q9XgyHQ6+trVEqlTj69o3LHz8YDAZMT09TqVSYmJiA' +
             'drutubk51ev1V91HR0dpfX1dzWYzraysqFarqd/vJ0AXFxfp4OBA8/Pz6bUGi4uLur+/H0m2z8/P' +
             'U6lUGhdKk5OTGnfp8vJSe3t7Wl5efvPB2AsRwebmJvl8Hr8zx8vLy9jqnJycUC6XabVa2frV1ZUL' +
             'hYLq9bqbzaYBNxqNVCwWfXZ2ptXVVe3u7urh4UGAOp2Oer2eAd3e3jpqtZq63S7D4RBJLCwskM/n' +
             'fX19HU9PTy4Wi7G1tcXx8bFbrVZMTU1RLpc5PT318/NzxPgPvG/b/3NJ4x/7PjcQfwEbKv+abz+B' +
             'nAAAAABJRU5ErkJggg==';

         var disabledIconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A' +
             '/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9kLDgQIEcuKo0MAAAAZdEVYdENv' +
             'bW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAACYUlEQVQ4y22SPUszURCFn7OJxCyiGBvRWkQi' +
             'Bi2iCKKFkPRaiKWgrb3Y2lr4A6z8CWr8QssE0ohoKShCQAhZyIZoDN55i3dX8n5cGO7M3JnLOZwj' +
             '55wzMzzPE4CZATjAA0xS3CPOJcnMTJK8aBnAooV4ySTR6XQIwxBJAIRh+PMGmMzMTk5O7Pb29vcE' +
             'kMvlbHd3V+/v71YulwE0PT1tYRjy+voKoNXVVRsYGJCccybJAG1tbXF8fBwxMd3d3dFsNomQ9VJk' +
             'bGzM8vm8vN5m75FEIpGIocv+Gopo4wEuQvBPzM7OOjNzPT0Xx9zcnAHOk+R1Oh01Gg0Bqtfr+vj4' +
             'EKDBwUHNz88LUITCA1QoFLxINU9m5s7Pz7m8vGRoaEjNZpOFhQW3sbGhSDJarRY3NzfW19enQqFA' +
             'MpmMlfj9QS/16HY9eaw9/zlKlkolgiCg3W5rc3PTfN/X2dmZgiBQt9u1yclJFhcXKZfLvLy88Pn5' +
             'ie/7rK+v43ke3szMDNVqlampKfN9X4BlMhmr1WqWz+ft6uqKi4sLcrmcXV9fs7y8bJlMhr29PZNE' +
             'cnx8nHQ6TS6X+7HpyMiIDQ8PK5vNks1m2d7eplgsCiCRSCgMQ9LptGIZ/+B5dHREKpWKrQ3A9/f3' +
             'T12pVDg9PWV/f98AvLe3N7XbbR4eHvT09MT9/T1BEFCv1/X4+MjBwQHFYpFWqyWAlZUVDg8PtbOz' +
             'oyAIUKlUco1Gg263i3OO0dFRUqmU1Wo1fX192cTEhJaWlqhUKvb8/Kz+/n7W1taoVqvW7XYVW9R6' +
             'Zfu7ds79WLenNkC/AENaUIUshyj4AAAAAElFTkSuQmCC';

         var suspendedIconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz' +
             'AAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJsSURB' +
             'VDiNbZMxSNtREId/91dMqTWkUEWxUDAgqV0UpItT5+IgRIt2aOnQyaWFLt0MhAo6CeLiVMcER0EI' +
             'LVgc0qFIIFI3IcRCI1pR0ID/+zo8NS3twcG79+5973f3OHN3BxRFkUkSIEkuKZKEzIQkA5kkN5NJ' +
             'JsDMLLq6LElIwswwMxESpMND6ft3ySx4tSpzR2bhNYDZ2Vm/Bkgim806gO/tuefzeDaLr6w4r165' +
             'S+4SvrfnAAoVEAIJAH7+hFwOnj6FsTF48wa+fIF374ijCJfwiYkW4KoPTE5Owvo63LsHEty/D48e' +
             'QRQFf/sW//gxAGZmbgAxEAP+6+tXSCTg1i348IEbazRgaipAl5bwZ8/cm83YIRbA2dmZn5ycwPg4' +
             '3L4N6TS0t0Oh0ILEcSinsxMOD1tlAz4/P++fSiVIJuH5c/jxAzKZfyGFQlBRKnGlPAAAp14Ph7lc' +
             'SP4fpFIJOcvLNwraFxYWVK/X9fLFCw3fvStVq5Ik9fZKnz9LT55I09Nh7/JSksTDh4ovL9XW1iZV' +
             'q1Xv6+vznZ0dJ5sNDdzdbcn+U0k6DakUjf19BgYGWiVkMhk/Ojpy9vfhzh148AA2N0PjAMplSKWC' +
             '/NVV1tbWfGRkxP8CNBoNB4g3N8P/S6Gp/f1h3dEBuRzb29tI8mazGQNElUrFjo+PtbGxYaVSSY/f' +
             'v9dZuSwtLUnj49LwsDQ3J7590+taje7ubg4ODiyRSFi9XpctLi56rVbT+fm53F2Dg4NKJpOcnp5a' +
             'T0+PhoaGNDo6qmKxyNbWlnV1dSmfz6tYLHJxcWF2PQOSTC37K3b364n9M0aS/QbbOmNBJc4luQAA' +
             'AABJRU5ErkJggg==';

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

         var savedEvalInSandbox = gmService.evalInSandbox.__original__ || gmService.evalInSandbox;

         gmService.evalInSandbox = function (code, codebase, sandbox) {
             savedEvalInSandbox.apply(gmService, arguments);

             if (sandbox.window.Minibuffer != undefined && sandbox.window.LDRize != undefined)
             {
                 sandbox.window.addEventListener("focus", function () {
                                                     setup();
                                                 }, false);
                 sandbox.window.addEventListener("blur", function () {
                                                     setKeymap(false);
                                                     setStatusbarIcon();
                                                 }, false);

                 try
                 {
                     if (window.content.wrappedJSObject == sandbox.unsafeWindow)
                         setup();
                 }
                 catch (x)
                 {
                     util.message(x);
                 }
             }
         };

         gmService.evalInSandbox.__original__ = savedEvalInSandbox;

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
