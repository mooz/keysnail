// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Prevent key up down</name>
    <description>Prevent keyup and keydown</description>
    <description lang="ja">ウェブページに keyup, keydown イベントが渡らないように</description>
    <version>1.0.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/prevent-key-up-down.ks.js</updateURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.0.1</minVersion>
    <include>main</include>
    <provides>
        <ext>toggle-prevent-key-up-down-status</ext>
    </provides>
    <detail><![CDATA[
=== Usage ===

	       ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===

プラグインがロードされると、 keyup, keydown イベントがウェブページへ渡らないようになります。

これにより github の Wiki ページなどで KeySnail のショートカットキーを使うことが可能となります。

Google Reader などではサイトが用意するショートカットキーが無効となりますので、
	       ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
//
// ==== 1.0.0 (2009 11/12) ====
//
// }} ======================================================================= //

var status = true;

var disabledInThisURL = false;

// function locationChangeHandler(aNsURI) {
//     if (!status)
//         return;

//     // about:blank?
//     if (!aNsURI)
//     {
//         disabledInThisURL = true;
//         return;
//     }

//     var url = aNsURI.spec;
//     var keymap;

//     for (var regexp in localKeyMaps)
//     {
//         if (url.match(regexp))
//         {
//             keymap = localKeyMaps[regexp];
//             // TODO: need some visual effects?
//             break;
//         }
//     }

//     key.keyMapHolder[key.modes.SITELOCAL] = keymap;

//     // change statusbar icon
//     if (keymap && key.status && !key.suspended) {
//         iconElem.setAttribute("src", iconData);
//         iconElem.tooltipText = M({en: "Site local keymap of this page enabled",
//                                   ja: "このサイト用のローカルキーマップが使われています"}) + " [" + regexp + "]";
//     } else {
//         key.updateStatusBar();
//     }
// }

var preventKeyUpDown = (
    function () {
        function preventEvent(aEvent) {
            if (!key.suspended &&
                !key.escapeCurrentChar &&
                !util.isWritable(aEvent))
            {
                aEvent.stopPropagation();
            }
        }

        var self = {
            start: function () {
                for each (var eventType in ["keydown", "keyup"])
                {
                    window.addEventListener(eventType, preventEvent, true);
                }
            },

            stop: function () {
                for each (var eventType in ["keydown", "keyup"])
                {
                    window.removeEventListener(eventType, preventEvent, true);
                }
            }
        };

        return self;
    })();

// if (my.preventKeyUpDownLocationChangeHandler)
//     hook.removeHook('LocationChange', my.preventKeyUpDownLocationChangeHandler);
// my.preventKeyUpDownLocationChangeHandler = locationChangeHandler;

// hook.addToHook('LocationChange', locationChangeHandler);

preventKeyUpDown.start();
