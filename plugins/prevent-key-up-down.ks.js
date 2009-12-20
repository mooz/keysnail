// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Prevent key up down</name>
    <description>Prevent keyup and keydown</description>
    <description lang="ja">ウェブページに keyup, keydown イベントが渡らないように</description>
    <version>1.0.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/prevent-key-up-down.ks.js</updateURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MIT</license>
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

var preventKeyUpDown = (
    function () {
        function preventEvent(aEvent) {
            if (!key.suspended &&
                !key.escapeCurrentChar &&
                !util.isWritable(aEvent))
            {
                aEvent.stopPropagation();
                aEvent.preventDefault();
            }
        }

        let eventType = ["keydown", "keyup"];

        var self = {
            start: function () {
                for ([, type] in Iterator(eventType))
                {
                    window.addEventListener(type, preventEvent, true);
                }
            },

            stop: function () {
                for ([, type] in Iterator(eventType))
                {
                    window.removeEventListener(type, preventEvent, true);
                }
            }
        };

        return self;
    })();

preventKeyUpDown.start();
