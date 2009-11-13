// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Prefer LDRize</name>
    <description>I prefer LDRize</description>
    <description lang="ja">LDRize と KeySnail で快適ブラウジング</description>
    <version>1.0.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/prefer-ldrize.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/prefer-ldrize.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.8</minVersion>
    <include>main</include>
    <provides>
        <ext>prefer-ldrize-toggle-status</ext>
    </provides>
    <options>
        <option>
            <name>prefer_ldrize.keymap</name>
            <type>object</type>
            <description>Local keymaps in LDRize enabled site</description>
            <description lang="ja">LDRize が有効となっているサイトでのキーマップ</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Prefer LDRize ====

This plugin allows user to disable / change the part of KeySnail keybindings in the site LDRize enabled.

By default, keybindings listed below are disabled in the LDRize enabled site.

- M-x
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

You can also set function to the keymap.

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

Have a nice browsing with LDRize and KeySnail!
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== LDRize を優先 ====

LDRize が有効となっているサイトで、 KeySnail のキーバインドを「一部だけ」無効にしたり変更したりすることが可能となります。

デフォルトの状態では LDRize の有効となっているサイトで以下のキーバインドが無効となります。

- M-x
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
    "o"   : null
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
    "o"   : null
}
||<

LDRize と KeySnail で快適なブラウジングを！

]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //

// ==== 1.0.0 (2009 11/14) ====
//
// * Released
//
// }} ======================================================================= //

var preferLDRize =
    (function () {
         var status = true;

         // Keymap handling {{ ======================================================= //

         key.modes.LDRIZE = "ldrize";

         var ldrizeKeymap = plugins.options["prefer_ldrize.keymap"] ||
             {
                 "M-x" : null,
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

         function decideKeyMap() {
             var keymap;

             keymap = setKeymap(ldrizeEnabled());

             // change statusbar icon
             if (keymap && key.status && !key.suspended)
             {
                 iconElem.setAttribute("src", iconData);
                 iconElem.tooltipText = M({en: "LDRize prefered",
                                           ja: "LDRize が優先されてますぅ"});
             }
             else
             {
                 if (!key.keyMapHolder[key.modes.SITELOCAL])
                     key.updateStatusBar();
             }
         }

         // }} ======================================================================= //

         // Status bar icon {{ ======================================================= //

         var iconElem = document.getElementById("keysnail-statusbar-icon");
         var iconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz' +
             'AAACVgAAAlYBSEjC2wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAInSURB' +
             'VDiNlZBfSJNRGIef8+3zczptNR2M+QedG8TAP2sKZYtMqChhKGRBs6uKFCFEKryMui4MIzCQiCCq' +
             'i9Cbki6iOci6SDC1oGka6RaYlYON1tq3LhxfrbTauTq87+95+J0jhsbPdsyEAwOzHyc2k8VxmN0R' +
             'V+m+Xp29RfVnCwN8ioVzE2q8Wc4GrirehtPSSJGhBFVNsrT6pkD+H9Bp8XCy8RK2oro/dv8U7N96' +
             'gi7PAEJI6+7/KnCV7qVr11UEAoDYtwjjC8NMh8cwKEYayltYXwtIQkenZ0CDJ5cec+xWCQJBR/0F' +
             '2l19qKnkxg3qyw9gKawE4HPsA+cftDDkm8OUb81ouGGDWmuzdh+Z6qettjcD1pr+Pjhc14ckdBQX' +
             'lGmz8YUR7GZ3Rm46PEb8e2xNIBCUbXECsBxdRE0lSSS/amGj3szT+eEMgWWTjYevBtcEsk6hxtqU' +
             'fm8Yq9HO/MqkFvZWnyYwdxf/7B2SaoJo/AvXAt0IISG815UUgMd2iInFRxTmmmhyHOVJ8DaDR14j' +
             'hESKFBdHW3nxflSTKnI+N33vfgqsRgfbK7wMv+znctszeu43cGrnFQ46O9NIiuDyBDPhAMY8Mzsq' +
             'W9HLBiSH2R0BCK0G8dja0UkyiqynwlTNjed9TIX8aYHAYXbTWtPDHocPvWwAiOq6zxxfTqjx5pVo' +
             'SKm27iYvp4B8pRB9joHpkJ/A23sIIVFV7EKWlF//MQqc+wEil6ylCDY4SAAAAABJRU5ErkJggg==';

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
             if (sandbox.window.LDRize != undefined && sandbox.window.Minibuffer != undefined)
             {
                 sandbox.window.addEventListener("focus", function () { decideKeyMap(); }, false);
                 sandbox.window.addEventListener("blur", function () { setKeymap(false); }, false);

                 if (window.content.wrappedJSObject == sandbox.unsafeWindow)
                 {
                     decideKeyMap();
                 }
             }

             gmService.evalInSandbox.__original__ = savedEvalInSandbox;

             savedEvalInSandbox.apply(gmService, arguments);
         };

         // }} ======================================================================= //

         function ldrizeEnabled() {
             return !!content.document.getElementById("gm_ldrize");
         }

         // Override mode detector {{ ================================================ //

         // save key.getCurrentMode
         if (!my.preferLDRizeOriginalGetCurrentMode)
         {
             my.preferLDRizeOriginalGetCurrentMode = key.getCurrentMode;
         }

         // override mode detector
         key.getCurrentMode = function (aEvent, aKey) {
             if (status && key.keyMapHolder[key.modes.LDRIZE] && !util.isWritable(aEvent))
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
             toggleStatus: function toggleStatus() {
                 if (status)
                 {
                     // disable
                     status = false;
                     key.keyMapHolder[key.modes.LDRIZE] = undefined;
                     key.updateStatusBar();
                 }
                 else
                 {
                     // enable
                     status = true;
                     locationChangeHandler();
                 }

                 gBrowser.focus();
                 _content.focus();
                 document.commandDispatcher.advanceFocus();
             }
         };

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
}

// }} ======================================================================= //