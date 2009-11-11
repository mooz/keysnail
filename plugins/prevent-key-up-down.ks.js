// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Prevent key up down</name>
    <description>Prevent keyup and keydown</description>
    <description lang="ja">github ハック</description>
    <version>1.2.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/hok.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/hok.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.0.1</minVersion>
    <include>main</include>
    <provides>
        <ext>hok-start-foreground-mode</ext>
    </provides>
    <options>
        <option>
            <name>hok.hint_keys</name>
            <type>string</type>
            <description>Hints keys (default asdfghjkl)</description>
            <description lang="ja">ヒントに使うキー (デフォルトは asdfghjkl)</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===

==== Start HaH ====
	       ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===

==== 起動 ====
	       ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
//
// ==== 1.0.0 (2009 11/12) ====
//
// }} ======================================================================= //

var preventKeyUpDown = (
    function () {
        function preventEvent(aEvent) {
            util.message("hogehoge");

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

preventKeyUpDown.start();
