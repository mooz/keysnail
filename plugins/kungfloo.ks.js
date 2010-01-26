// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Kungfloo</name>
    <description>Tombloo</description>
    <description lang="ja">Tombloo を操作</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/kungfloo.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/kungfloo.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.8</minVersion>
    <provides>
        <ext>swap-caret</ext>
    </provides>
    <include>main</include>
    <options>
        <option>
            <name>caret_hint.head_key</name>
            <type>string</type>
            <description>Key to move caret to the head of element (default: c)</description>
            <description lang="ja">要素の先頭へキャレットを移動するキー (デフォルト: c)</description>
        </option>
        <option>
            <name>caret_hint.tail_key</name>
            <type>string</type>
            <description>Key to move caret to the head of element (default: C)</description>
            <description lang="ja">要素の末尾へキャレットを移動するキー (デフォルト: C)</description>
        </option>
        <option>
            <name>caret_hint.select_head_key</name>
            <type>string</type>
            <description>Key to select element and move caret to the head (default: disabled)</description>
            <description lang="ja">要素を選択し、先頭にキャレットを移動するキー (デフォルト: 無効)</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Power up HoK extend hint mode ====

This plugin provides commands which moves caret using hints to HoK extend mode.

For example, if you binds HoK extend mode to ;, you can display hints by pressing ;c and move caret to the element you selected.

    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// Change Log {{ ============================================================ //
//
// ==== 0.0.1 (2010 01/10) ====
// 
// * Released
//
// }} ======================================================================= //

const Cc = Components.classes;
const Ci = Components.interfaces;

var optionsDefaultValue = {
    "post_image_key" : 'c',
    "tail_key"        : 'C',
    "select_key"      : '',
    "select_tail_key" : 's',
    "hint_query"      : '*'
};

function getOption(aName) {
    var fullName = "kungfloo." + aName;

    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

let kungfloo = (
    function () {
        let to      = Cc['@brasil.to/tombloo-service;1'].getService().wrappedJSObject;
        let Tombloo = to.Tombloo;

        function getTomblooActionList() {
            let actions = Tombloo.Service.actions;
            return [actions[name] for each (name in actions.names)
                                    if (typeof actions[name].execute === "function")];
        }

        let headMode       = getOption('head_key');
        let tailMode       = getOption('tail_key');
        let selectHeadMode = getOption('select_head_key');
        let selectTailMode = getOption('select_tail_key');
        let hintQuery      = getOption('hint_query');

        function swapCaret (ev, arg) {
            let win = new XPCNativeWrapper(window.content.window);
            let s = win.getSelection();

            if (s.rangeCount <= 0)
                return;

            let [a, f] = [[s.anchorNode, s.anchorOffset], [s.focusNode, s.focusOffset]];
            s.collapse.apply(s, f);
            s.extend.apply(s, a);

            /*
             if (util.isWritable(ev))
             {
             let elem = ev.originalTarget;

             if (typeof elem.ksMarked === 'number')
             {
             let [from, to] = [elem.selectionStart, elem.selectionEnd];

             util.message("st %s   end %s", elem.selectionStart, elem.selectionEnd);

             if (elem.ksMarked === elem.selectionStart)
             {
             // this doesn't work properly
             elem.ksMarked = elem.selectionEnd;
             elem.setSelectionRange(elem.ksMarked, elem.ksMarked);
             util.message(elem.selectionStart);
             elem.selectionStart = from;
             util.message(elem.selectionStart);
             }
             else
             {
             // this works well
             elem.ksMarked = elem.selectionStart;
             elem.setSelectionRange(elem.ksMarked, elem.ksMarked);
             elem.selectionEnd = to;
             }
             }
             }
             */
        }

        function moveCaret () {
            try {
                _moveCaret.apply(null, arguments);
            } catch (x) {}

            gBrowser.focus();
            _content.focus();
        }

        function _moveCaret (elem, head, select) {
            let doc = elem.ownerDocument;
            let win = new XPCNativeWrapper(window.content.window);
            let sel = win.getSelection();
            let r   = doc.createRange();

            sel.removeAllRanges();
            r.selectNodeContents(elem);

            if (select)
            {
                util.setBoolPref("accessibility.browsewithcaret", true);
                content.document.documentElement.ksMarked = true;
            }
            else
            {
                if (head)
                    r.setEnd(r.startContainer, r.startOffset);
                else
                    r.setStart(r.endContainer, r.endOffset);

                util.setBoolPref("accessibility.browsewithcaret", true);
            }

            sel.addRange(r);

            if (select && head)
                swapCaret();
        }

        // Add HoK extend mode actions {{ =========================================== //

        hook.addToHook('PluginLoaded', function () {
                           if (!plugins.hok)
                               return;

                           var actions = [
                               [headMode, M({ja: "キャレットを要素の先頭へ移動", en: "Move caret to the head of the selected element"}),
                                function (e) moveCaret(e, true, false)],
                               [tailMode, M({ja: "キャレットを要素の末尾へ移動", en: "Move caret to the tail of the selected element"}),
                                function (e) moveCaret(e, false, false)],
                               [selectHeadMode, M({ja: "要素を選択してキャレットを先頭へ移動", en: "Select element and move caret to the head"}),
                                function (e) moveCaret(e, false, true)],
                               [selectTailMode, M({ja: "要素を選択してキャレットを末尾へ移動", en: "Select element and move caret to the tail"}),
                                function (e) moveCaret(e, false, true)]
                           ];

                           function seekAction(aActions, aKey) {
                               for (let i = 0; i < aActions.length; ++i)
                               {
                                   if (aActions[i][0] === aKey)
                                       return i;
                               }

                               return -1;
                           }

                           actions.forEach(
                               function ([aKey, aDesc, aFunc]) {
                                   if (!aKey)
                                       return;

                                   let i   = seekAction(plugins.hok.actions, aKey);
                                   let row = [aKey, aDesc, aFunc, false, false, hintQuery];

                                   if (i >= 0)
                                       plugins.hok.actions[i] = row;
                                   else
                                       plugins.hok.actions.push(row);
                               }
                           );
                       });

        // }} ======================================================================= //

        // Add exts {{ ============================================================== //

        ext.add("swap-caret", swapCaret, M({ja: 'キャレットを交換', en: "Swap caret"}));

        // }} ======================================================================= //
    })();


