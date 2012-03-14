// Lisence block {{ ========================================================= //

/**
Original Code by anekos.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice,
       this list of conditions and the following disclaimer.
    2. Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.
    3. The names of the authors may not be used to endorse or promote products
       derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.
**/

// }} ======================================================================= //

// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Caret hint</name>
    <description>Move caret by hitting hints</description>
    <description lang="ja">ヒントを使ってキャレット移動</description>
    <version>0.0.5</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/caret-hint.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/caret-hint.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>new BSD License</license>
    <license lang="ja">修正 BSD ライセンス</license>
    <minVersion>1.1.8</minVersion>
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
        <option>
            <name>caret_hint.select_tail_key</name>
            <type>string</type>
            <description>Key to select element and move caret to the tail (default: s)</description>
            <description lang="ja">要素を選択し、末尾にキャレットを移動するキー (デフォルト: s)</description>
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
==== HoK 拡張ヒントモードの強化 ====

このプラグインは KeySnail 用 HaH プラグインの HoK と共に使用してください。

Caret hint プラグインは HoK の拡張モードへ「ヒントを使ってキャレットを移動する為のコマンド」を提供します。

F7 を押して入れるキャレットブラウズモードをよく使用する方に有用でしょう。

例えば HoK の拡張ヒントモードを ; へ割り当てている場合なら ;c と入力することによりヒントが表示され、選択された要素部分へとキャレットが移動します。

==== キャレットの交換 ====

このプラグインが提供する swap-caret を次のようにして適当なキーへと割り当てておくと、 F7 キーを押して入れるキャレットブラウズモードがもっと便利になります。

>|javascript|
key.setCaretKey('s', function (ev, arg) {
    ext.exec("swap-caret", arg, ev);
}, 'キャレットを交換', true);
||<

C-SPC を押してマークを設定し C-f C-n などのキーを使って選択範囲を変更する際、このような設定をしておくと s キーを入力することで「選択範囲は変えず、キャレットの位置を交換する」といったことが可能となります。

言葉では説明しにくいので、ぜひ実際に試してみて下さい。
]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// Change Log {{ ============================================================ //
//
// ==== 0.0.3 (2009 12/20) ====
//
// * Removed unnecessary codes
//
// }} ======================================================================= //

var optionsDefaultValue = {
    "head_key"        : 'c',
    "tail_key"        : 'C',
    "select_key"      : '',
    "select_tail_key" : 's',
    "hint_query"      : '*'
};

function getOption(aName) {
    var fullName = "caret_hint." + aName;

    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

(function () {
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
             content.document.documentElement.ksMarked = content.document.body.ksMarked = true;
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
                             function (e) moveCaret(e, true, true)],
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
