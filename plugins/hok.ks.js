// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>HoK</name>
    <description>Hit a hint for KeySnail</description>
    <description lang="ja">キーボードでリンクを開く</description>
    <version>1.2.4</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/hok.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/hok.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.1.8</minVersion>
    <include>main</include>
    <provides>
        <ext>hok-start-foreground-mode</ext>
        <ext>hok-start-background-mode</ext>
        <ext>hok-start-continuous-mode</ext>
        <ext>hok-start-extended-mode</ext>
    </provides>
    <options>
        <option>
            <name>hok.hint_keys</name>
            <type>string</type>
            <description>Hints keys (default asdfghjkl)</description>
            <description lang="ja">ヒントに使うキー (デフォルトは asdfghjkl)</description>
        </option>
        <option>
            <name>hok.unique_fire</name>
            <type>boolean</type>
            <description>When current focused hint is unique, auto fire the link or not</description>
            <description lang="ja">キーを入力した際、他に候補が無ければ自動的にそのリンクをたどるか (デフォルト: true)</description>
        </option>
        <option>
            <name>hok.statusbar_feedback</name>
            <type>boolean</type>
            <description>Whether display your inputs to the statusbar or not</description>
            <description lang="ja">入力したキーをステータスバーへ表示するかどうか (デフォルト: true)</description>
        </option>
        <option>
            <name>hok.actions</name>
            <type>array</type>
            <description>Actions for extended hint mode</description>
            <description lang="ja">拡張ヒントモード用に独自のアクションを設定</description>
        </option>
        <option>
            <name>hok.use_selector</name>
            <type>boolean</type>
            <description>Use Selectors API instead of XPath. Performance up but only works after Firefox 3.1 (default: true)</description>
            <description lang="ja">ヒントの取得に Selectors API を用いるかどうか。 XPath より高速となるが Firefox 3.1 以降専用。 (デフォルト: true)</description>
        </option>
        <option>
            <name>hok.selector</name>
            <type>string</type>
            <description>Selectors API Path query</description>
            <description lang="ja">ヒントの取得に使う Selectors API クエリ</description>
        </option>
        <option>
            <name>hok.xpath</name>
            <type>string</type>
            <description>XPath query</description>
            <description lang="ja">ヒントの取得に使う XPath クエリ</description>
        </option>
        <option>
            <name>hok.local_queries</name>
            <type>array</type>
            <description>Site local queries (Only effective when Selectors API is used)</description>
            <description lang="ja">サイト毎のクエリ (Selectors API 使用時のみ有効)</description>
        </option>
        <option>
            <name>hok.hint_color_link</name>
            <type>string</type>
            <description>Color of the hints for links</description>
            <description lang="ja">リンク用ヒントの色</description>
        </option>
        <option>
            <name>hok.hint_color_form</name>
            <type>string</type>
            <description>Color of the hints for forms</description>
            <description lang="ja">フォーム用ヒントの色</description>
        </option>
        <option>
            <name>hok.hint_color_focused</name>
            <type>string</type>
            <description>Color of focused hints</description>
            <description lang="ja">フォーカスされているヒントの色</description>
        </option>
        <option>
            <name>hok.hint_color_candidates</name>
            <type>string</type>
            <description>Color of candidate hints</description>
            <description lang="ja">現在の入力から始まる候補一覧の色</description>
        </option>
        <option>
            <name>hok.hint_base_style</name>
            <type>object</type>
            <description>Color of focused hints</description>
            <description lang="ja">ヒントのスタイルを設定</description>
        </option>
        <option>
            <name>hok.user_keymap</name>
            <type>object</type>
            <description>Specify user keymap</description>
            <description lang="ja">ユーザ定義のキーマップを指定</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===

==== Start HaH ====

Paste code below to your .keysnail.js file.

>||
key.setViewKey('e', function (aEvent, aArg) {
    ext.exec("hok-start-foreground-mode", aArg);
}, 'Hok - Foreground hint mode', true);

key.setViewKey('E', function (aEvent, aArg) {
    ext.exec("hok-start-background-mode", aArg);
}, 'HoK - Background hint mode', true);

key.setViewKey(';', function (aEvent, aArg) {
    ext.exec("hok-start-extended-mode", aArg);
}, 'HoK - Extented hint mode', true);

key.setViewKey(['C-c', 'C-e'], function (aEvent, aArg) {
    ext.exec("hok-start-continuous-mode", aArg);
}, 'Start continuous HaH', true);
||<

In this example, you can start hah by pressing e key in the view mode.

==== Customizing ====

You can change keys for generating hints to paste the code with following form to your .keysnail.js file.

>||
plugins.options["hok.hint_keys"] = "0123456789";
||<

In this example, you make this plugin to use number keys instead of the alphabets.

Style of the hints can be customized by changing the value of hint_base_style.

>||
plugins.options["hok.hint_base_style"] = {
    position        : 'absolute',
    zIndex          : '2147483647',
    color           : '#000',
    fontSize        : '10pt',
    fontFamily      : 'monospace',
    lineHeight      : '10pt',
    padding         : '0px',
    margin          : '0px',
    textTransform   : 'uppercase'
};
||<

Each background color of hints for link, form, focused can be changed by following forms.

>||
plugins.options["hok.hint_color_link"]    = 'rgba(180, 255, 81, 0.7)';
plugins.options["hok.hint_color_form"]    = 'rgba(157, 82, 255, 0.7)';
plugins.options["hok.hint_color_focused"] = 'rgba(255, 82, 93, 0.7)';
||<

If you are familiar with the XPath and want this plugin to use arbitrary one, you can set the query.

>||
plugins.options["hok.selector"] = 'a, textarea, button';
||<
	       ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===

==== 起動 ====

次のようにして適当なキーへ HoK を割り当てておきましょう。

>||
key.setViewKey('e', function (aEvent, aArg) {
    ext.exec("hok-start-foreground-mode", aArg);
}, 'Hit a Hint を開始', true);

key.setViewKey('E', function (aEvent, aArg) {
    ext.exec("hok-start-background-mode", aArg);
}, 'リンクをバックグラウンドで開く Hit a Hint を開始', true);

key.setViewKey(';', function (aEvent, aArg) {
    ext.exec("hok-start-extended-mode", aArg);
}, 'HoK - 拡張ヒントモード', true);

key.setViewKey(['C-c', 'C-e'], function (aEvent, aArg) {
    ext.exec("hok-start-continuous-mode", aArg);
}, 'リンクを連続して開く Hit a Hint を開始', true);
||<

上記のような設定を .keysnail.js へ記述しておくことにより、ブラウズ画面において e キーを押すことで通常モードの Hit a Hint を開始させることが可能となります。

E を押すことで「タブを背面で開く HaH」を開始させることもできますし、 ; キーを押せば単にリンクをたどるだけでなく、様々なアクションを選ぶことができてしまいます。

ページ内のリンクを一度に開きたいときは hok-start-continuous-mode がきっと役に立つでしょう。一度リンクを開いてもヒントモードが継続されるのです。終了したい時は ESC などのキーを押せば OK です。

==== ポップアップブロックへの対処 ====

HoK でヒントを選択しタブを開こうとしたときポップアップブロックに引っかかってしまうという方は、ロケーションバーに about:config と打ち込んでから dom.popup_allowed_events と入力し、その値に keypress を付け加えてみてください。

==== カスタマイズ ====

ヒントに用いるキーは次のようにして変更することが可能です。

>||
plugins.options["hok.hint_keys"] = "0123456789";
||<

例えば上記のようなコードを .keysnail.js 内の PRESERVE エリアへ張り付けることで、ヒントに数字キーを使うことが可能となります。

ヒントのスタイルは hint_base_style で設定することが可能です。

>||
plugins.options["hok.hint_base_style"] = {
    position        : 'absolute',
    zIndex          : '2147483647',
    color           : '#000',
    fontSize        : '10pt',
    fontFamily      : 'monospace',
    lineHeight      : '10pt',
    padding         : '0px',
    margin          : '0px',
    textTransform   : 'uppercase'
};
||<

ヒントの背景色については hint_color_link, hint_color_form, hint_color_focused の値を変更してください。

>||
plugins.options["hok.hint_color_link"]       = 'rgba(180, 255, 81, 0.9)';
plugins.options["hok.hint_color_form"]       = 'rgba(157, 82, 255, 0.9)';
plugins.options["hok.hint_color_candidates"] = 'rgba(240, 82, 93, 0.9)';
plugins.options["hok.hint_color_focused"]    = 'rgba(255, 4, 5, 1.0)';
||<

Selectors API を知っていてカスタマイズしたいという方は、次のようにしてヒント取得用のクエリを変更することもできます。

>||
plugins.options["hok.selector"] = 'a, textarea, button';
||<

=== 拡張ヒントモード ===

次のような設定を .keysnail.js 内に含めておくと、 Vimperator における拡張ヒントモードのようなことを行うことができるようになります。

>||
key.setViewKey(';', function (aEvent, aArg) {
    ext.exec("hok-start-extended-mode", aArg);
}, 'HoK - 拡張ヒントモード', true);
||<

例えばフレームのあるサイトで ; f と入力すれば、そのページ内の任意のフレームへ一発でフォーカスを当てることが出来るようになります。

また ; c と押してからヒントを選択すれば、あたかもその要素の上で右クリックをしたかのような振る舞いをさせることも可能となっています。

それ以外にも様々なアクションが用意されています。拡張ヒントモードで HoK を起動してから TAB を押して、アクションの一覧を確認してみてください。

アクションはユーザが独自に追加することもできます。次のような設定を .keysnail.js 内に張り付けてみてください。

>||
plugins.options["hok.actions"] = [
    ['1',
     M({ja: "画像の URL をコピー", en: "Copy image's url"}),
     function (elem) { command.setClipboardText(elem.src); },
     true, false, "img"],
    ['2',
     M({ja: "要素のプロパティを一覧表示", en: "List elements properties"}),
     function (elem) { util.listProperty(elem); },
     false, true]
];
||<

こうすることにより ; 1 と入力すれば画像にだけヒントがつき、その後選択された画像の src がクリップボードへコピーされるようになります。

ポイントは「アクション毎に Selectros API クエリを設定できる」というところにあります。例えばフレームだけを対象にさせたいのであれば body を設定しておけば良いのですし、画像だけなら img で OK なのです。可能性は無限大ですね。

各アクションは次のような形式となります。

>||
['キー', '説明',
 function (elem) { /* elem を使った処理 */ },
 autoFire を抑制するか, continuous とするか, 'Selectors API のクエリ']
||<

関数にはヒントを使って選択した要素が渡ります。 elem.href とすればリンクの URL が得られ、 elem.textContent とすればそのリンクのテキストが得られます。画像であれば elem.src としてその URL を得ることも出来ます。

後ろ三つの引数に関しては省略することが可能です。

==== サイト毎にクエリを指定 ====

次のようにして、サイト毎にクエリを追加したり、変更したりすることが可能です。

>||
plugins.options["hok.local_queries"] = [
    ["^http://www\\.google\\.(co\\.jp|com)/reader/view/", "*.unselectable, *.link"]
];
||<

こうすることにより、通常は取得できていなかった部分も HoK で選択することができるようになります。

=== 謝辞 ===

このプラグインは以下のブックマークレットと Vimperator の hints.js を参考にして作成されました。

http://d.hatena.ne.jp/Griever/20090223/1235407852

HoK のオリジナル開発者は myuhe さんです。

http://github.com/myuhe
	       ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
//
// ==== 1.2.4 (2009 11/19) ====
//
// * Made hok export entire context of itself, using __ksSelf__.
//
// ==== 1.2.3 (2009 11/19) ====
//
// * Made user keymap system use keysnails key expression instead of raw keycode.
//
// ==== 1.2.2 (2009 11/17) ====
//
// * Added user keymap system.
//
// ==== 1.2.1 (2009 11/16) ====
//
// * Added site local query system.
//
// ==== 1.2.0 (2009 11/09) ====
//
// * Made HoK use Selectors API again and added XPath option.
//
// ==== 1.1.8 (2009 11/08) ====
//
// * Does not focus when hint keys are inputted.
//
// ==== 1.1.7 (2009 11/08) ====
//
// * Fixed the hints position bug.
// * Made HoK use XPath instead of Selectors API.
//
// ==== 1.1.6 (2009 11/07) ====
//
// * Modified default hint style. Made more elements to be gathered.
//
// ==== 1.1.5 (2009 11/07) ====
//
// * Fixed the silly bug. Images not gathered collectly.
//
// ==== 1.1.4 (2009 11/07) ====
//
// * Made hok immediatly fire When only one hint found.
// * Made hok works correctly in the pages which does not has "document" elemt (like XUL)
// * Added action view source code
// * Refactored the source code
//
// }} ======================================================================= //

// Options {{ =============================================================== //

var optionsDefaultValue = {
    "hint_keys"          : 'asdfghjkl',
    "selector"           : 'a[href], input:not([type="hidden"]), textarea, iframe, area, select, button, ' +
        '*[onclick], *[onmouseover], *[onmousedown], *[onmouseup], *[oncommand], *[role="link"]',
    "xpath"              : '//input[not(@type="hidden")] | //a | //area | //iframe | //textarea | //button | //select' +
        ' | //*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @role="link"]',
    "statusbar_feedback" : true,
    "unique_fire"        : true,
    "actions"            : null,
    "use_selector"       : !!document.querySelectorAll,
    "hint_base_style"    : {
        position        : 'absolute',
        zIndex          : '2147483647',
        color           : '#000',
        fontFamily      : 'monospace',
        fontSize        : '10pt',
        fontWeight      : 'bold',
        lineHeight      : '10pt',
        padding         : '2px',
        margin          : '0px',
        textTransform   : 'uppercase'
    },
    "hint_color_link"       : 'rgba(180, 255, 81, 0.90)',
    "hint_color_form"       : 'rgba(155, 174, 255, 0.90)',
    "hint_color_candidates" : 'rgba(255, 81, 116, 0.90)',
    "hint_color_focused"    : 'rgba(255, 0, 51, 1.0)'
};

function getOption(aName) {
    var fullName = "hok." + aName;

    if (typeof(plugins.options[fullName]) != "undefined")
    {
        return plugins.options[fullName];
    }
    else
    {
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
    }
}

// }} ======================================================================= //

// Misc utils {{ ============================================================ //

// Most functions are borrowed from liberator. Thanks a lot :)

function createMouseEvent(aDocument, aType, aOptions) {
    var defaults = {
        type          : aType,
        bubbles       : true,
        cancelable    : true,
        view          : aDocument.defaultView,
        detail        : 1,
        screenX       : 0, screenY : 0,
        clientX       : 0, clientY : 0,
        ctrlKey       : false,
        altKey        : false,
        shiftKey      : false,
        metaKey       : false,
        button        : 0,
        relatedTarget : null
    };

    var event = aDocument.createEvent("MouseEvents");

    for (let prop in aOptions)
    {
        defaults[prop] = aOptions[prop];
    }

    event.initMouseEvent.apply(event, [v for each(v in defaults)]);

    return event;
}

const NEW_TAB            = 1;
const NEW_BACKGROUND_TAB = 2;
const NEW_WINDOW         = 3;
const CURRENT_TAB        = 4;

/**
 * Fakes a click on a link. from hint.js in liberator
 *
 * @param {Node} elem The element to click.
 * @param {number} where Where to open the link.
 */
function followLink(elem, where) {
    let doc     = elem.ownerDocument;
    let view    = doc.defaultView;
    let offsetX = 1;
    let offsetY = 1;

    if (elem instanceof HTMLFrameElement || elem instanceof HTMLIFrameElement)
    {
        elem.contentWindow.focus();
        return;
    }
    else if (elem instanceof HTMLAreaElement) // for imagemap
    {
        let coords = elem.getAttribute("coords").split(",");
        offsetX = Number(coords[0]) + 1;
        offsetY = Number(coords[1]) + 1;
    }

    let ctrlKey = false, shiftKey = false;

    switch (where) {
    case NEW_TAB:
    case NEW_BACKGROUND_TAB:
        ctrlKey  = true;
        shiftKey = (where != NEW_BACKGROUND_TAB);
        break;
    case NEW_WINDOW:
        shiftKey = true;
        break;
    case CURRENT_TAB:
        break;
    default:
        display.echoStatusBar("Invalid where argument for followLink()");
    }

    elem.focus();

    // ============================================================ //

    try
    {
        ["mousedown", "mouseup", "click"].forEach(
            function (event) {
                elem.dispatchEvent(
                    createMouseEvent(doc,
                                     event,
                                     {
                                         screenX: offsetX, screenY: offsetY,
                                         ctrlKey: ctrlKey, shiftKey: shiftKey, metaKey: ctrlKey
                                     }));
            });
    }
    catch (x) {}
}

function openContextMenu(elem) {
    document.popupNode = elem;
    var menu = document.getElementById("contentAreaContextMenu");
    menu.showPopup(elem, -1, -1, "context", "bottomleft", "topleft");
}

function openURI(url, where) {
    where = where || CURRENT_TAB;
    // decide where to load the first url
    switch (where) {
    case CURRENT_TAB:
        gBrowser.loadURIWithFlags(url, null, null, null, null);
        break;
    case NEW_BACKGROUND_TAB:
    case NEW_TAB:
        gBrowser.loadOneTab(url, null, null, null, where == NEW_BACKGROUND_TAB);
        break;
    }
}

function saveLink(elem, skipPrompt) {
    let doc  = elem.ownerDocument;
    let url  = window.makeURLAbsolute(elem.baseURI, elem.href);
    let text = elem.textContent;

    try {
        window.urlSecurityCheck(url, doc.nodePrincipal);
        saveURL(url, text, null, true, skipPrompt, makeURI(url, doc.characterSet));
    } catch (e) {}
}

function viewSource(url, useExternalEditor) {
    url = url || window.content.location.href;

    if (useExternalEditor)
    {
        userscript.editFile(url);
    }
    else
    {
        const PREFIX = "view-source:";
        if (url.indexOf(PREFIX) == 0)
            url = url.substr(PREFIX.length);
        else
            url = PREFIX + url;

        openURI(url);
    }
}

function recoverFocus() {
    gBrowser.focus();
    _content.focus();
}

// }} ======================================================================= //

// HoK object {{ ============================================================ //

var originalSuspendedStatus;
var useSelector = getOption("use_selector");

var hok = function () {
    var hintKeys            = getOption("hint_keys");
    var selector            = getOption("selector");
    var xPathExp            = getOption("xpath");
    var hintBaseStyle       = getOption("hint_base_style");
    var hintColorLink       = getOption("hint_color_link");
    var hintColorForm       = getOption("hint_color_form");
    var hintColorFocused    = getOption("hint_color_focused");
    var hintColorCandidates = getOption("hint_color_candidates");
    var elementColorFocused = getOption("element_color_focused");

    var keyMap = {};
    if (plugins.options["hok.user_keymap"])
        keyMap = plugins.options["hok.user_keymap"];

    keyMap["<delete>"]    = 'Delete';
    keyMap["<backspace>"] = 'Backspace';
    keyMap["C-h"]         = 'Backspace';
    keyMap["RET"]         = 'Enter';
    keyMap["C-m"]         = 'Enter';

    var lastFocusedInfo;

    // misc options {{ ========================================================== //

    var useStatusBarFeedBack = getOption("statusbar_feedback");

    var uniqueFire = getOption("unique_fire");
    var supressUniqueFire;

    var continuousMode;

    // }} ======================================================================= //

    var currentAction;
    var priorQuery;
    var localQuery;

    // length of the hint keys like 'asdfghjkl'
    var hintKeysLength  = null;

    var hintContainerId = 'ksHintContainer';

    var hintElements    = [];
    // actually hintElements.length
    var hintCount;

    var inputKey        = '';
    var lastMatchHint   = null;

    function createText(num) {
        var text = '';
        var l    = hintKeysLength;
        var iter = 0;
        var n;

        while (num >= 0)
        {
            n = num;
            num -= Math.pow(l, 1 + iter++);
        }

        for (var i = 0; i < iter; i++)
        {
            var r = n % l;
            n     = Math.floor(n / l);
            text  = hintKeys.charAt(r) + text;
        }

        return text;
    }

    /**
     * Gets the actual offset of an imagemap area. (from liberator)
     *
     * @param {Object} elem  The <area> element.
     * @param {number} leftpos  The left offset of the image.
     * @param {number} toppos  The top offset of the image.
     * @returns [leftpos, toppos]  The updated offsets.
     */
    function getAreaOffset(elem, leftpos, toppos)
    {
        try
        {
            // Need to add the offset to the area element.
            // Always try to find the top-left point, as per liberator default.
            let shape = elem.getAttribute("shape").toLowerCase();
            let coordstr = elem.getAttribute("coords");
            // Technically it should be only commas, but hey
            coordstr = coordstr.replace(/\s+[;,]\s+/g, ",").replace(/\s+/g, ",");
            let coords = coordstr.split(",").map(Number);

            if ((shape == "rect" || shape == "rectangle") && coords.length == 4)
            {
                leftpos += coords[0];
                toppos += coords[1];
            }
            else if (shape == "circle" && coords.length == 3)
            {
                leftpos += coords[0] - coords[2] / Math.sqrt(2);
                toppos += coords[1] - coords[2] / Math.sqrt(2);
            }
            else if ((shape == "poly" || shape == "polygon") && coords.length % 2 == 0)
            {
                let leftbound = Infinity;
                let topbound = Infinity;
                var i;

                // First find the top-left corner of the bounding rectangle (offset from image topleft can be noticably suboptimal)
                for (i = 0; i < coords.length; i += 2)
                {
                    leftbound = Math.min(coords[i], leftbound);
                    topbound = Math.min(coords[i + 1], topbound);
                }

                let curtop = null;
                let curleft = null;
                let curdist = Infinity;

                // Then find the closest vertex. (we could generalise to nearest point on an edge, but I doubt there is a need)
                for (i = 0; i < coords.length; i += 2)
                {
                    let leftoffset = coords[i] - leftbound;
                    let topoffset = coords[i + 1] - topbound;
                    let dist = Math.sqrt(leftoffset * leftoffset + topoffset * topoffset);
                    if (dist < curdist)
                    {
                        curdist = dist;
                        curleft = coords[i];
                        curtop = coords[i + 1];
                    }
                }

                // If we found a satisfactory offset, let's use it.
                if (curdist < Infinity)
                    return [leftpos + curleft, toppos + curtop];
            }
        } catch (e) {} // badly formed document, or shape == "default" in which case we don't move the hint

        return [leftpos, toppos];
    }

    function getBodyOffsets(body, html)
    {
        return [
            (body.scrollLeft || html.scrollLeft) - html.clientLeft,
            (body.scrollTop || html.scrollTop) - html.clientTop
        ];
    }

    function drawHints(win) {
        if (!win)
            win = window.content;

        var doc = win.document;

        if (!doc)
            return;

        var html = doc.documentElement;
        var body = doc.body;

        if (!body)
        {
            // process childs only
            Array.forEach(win.frames, drawHints);
            return;
        }

        var height = win.innerHeight;
        var width  = win.innerWidth;

        var [scrollX, scrollY] = getBodyOffsets(body, html);

        // Arrange hint containers {{ =============================================== //

        var fragment      = doc.createDocumentFragment();
        var hintContainer = doc.createElement('div');

        fragment.appendChild(hintContainer);
        hintContainer.id = hintContainerId;

        // }} ======================================================================= //

        // Arrange hints seed {{ ==================================================== //

        var hintSpan = doc.createElement('span');

        var st = hintSpan.style;

        for (var prop in hintBaseStyle)
        {
            st[prop] = hintBaseStyle[prop];
        }

        st.backgroundColor = hintColorLink;

        // }} ======================================================================= //

        var result, elem;

        if (useSelector)
        {
            result = doc.querySelectorAll(priorQuery || localQuery || selector);
        }
        else
        {
            let xpathResult = doc.evaluate(priorQuery || xPathExp, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            result = [];

            for (let i = 0; i < xpathResult.snapshotLength; ++i)
                result.push(xpathResult.snapshotItem(i));
        }

        var style, rect, hint, span, top, left, ss;
        var leftpos, toppos;

        for (var i = 0; i < result.length; ++i)
        {
            elem = result[i];

            rect = elem.getBoundingClientRect();
            if (!rect || rect.top > height || rect.bottom < 0 || rect.left > width || rect.right < 0)
                continue;

            rect = elem.getClientRects()[0];
            if (!rect)
                continue;

            // ========================================================================== //

            style = win.getComputedStyle(elem, null);

            if (!style || style.visibility !== "visible" || style.display === "none")
            {
                continue;
            }

            // ========================================================================== //

            hint = createText(hintCount);
            span = hintSpan.cloneNode(false);
            span.appendChild(doc.createTextNode(hint));

            // Set hint position {{ ===================================================== //

            leftpos = Math.max((rect.left + scrollX), scrollX);
            toppos  = Math.max((rect.top + scrollY), scrollY);

            if (elem instanceof HTMLAreaElement)
                [leftpos, toppos] = getAreaOffset(elem, leftpos, toppos);

            ss = span.style;
            ss.left = leftpos + "px";
            ss.top  =  toppos + "px";

            // }} ======================================================================= //

            if (elem.hasAttribute('href') === false)
            {
                ss.backgroundColor = hintColorForm;
            }

            hintElements[hint] = span;
            span.element       = elem;
            hintContainer.appendChild(span);

            hintCount++;
        }

        if (doc)
        {
            body.appendChild(fragment);
        }

        Array.forEach(win.frames, drawHints);
    };

    function getHintColor(elem) {
        return (elem.hasAttribute('href') === true) ?
            hintColorLink : hintColorForm;
    }

    function blurHint() {
        if (lastMatchHint)
        {
            lastMatchHint.style.backgroundColor = getHintColor(lastMatchHint.element);
            lastMatchHint = null;
        }
    }

    function focusHint(aHint) {
        // set hint color
        aHint.style.backgroundColor = hintColorFocused;

        // aHint.element.__ks_saved_background_color__ = aHint.element.style.backgroundColor || true;
        // aHint.element.style.backgroundColor = "#ddff5e";

        // This scrolls up / down the view.
        // aHint.element.focus();
    }

    function recoverOriginalStyle(elem) {
        if (elem.__ks_saved_background_color__)
        {
            if (elem.__ks_saved_background_color__ === true)
            {
                elem.style.backgroundColor = "";
            }
            else
            {
                elem.style.backgroundColor = elem.__ks_saved_background_color__;
            }
        }
    }

    function updateHeaderMatchHints() {
        var foundCount = 0;

        for (var hintStr in hintElements)
        {
            if (hintStr.indexOf(inputKey) == 0)
            {
                if (hintStr != inputKey)
                {
                    hintElements[hintStr].style.backgroundColor = hintColorCandidates;
                    // recoverOriginalStyle(hintElements[hintStr].element);
                }

                foundCount++;
            }
            else
            {
                hintElements[hintStr].style.backgroundColor = getHintColor(hintElements[hintStr].element);
                // recoverOriginalStyle(hintElements[hintStr].element);
            }
        }

        return foundCount;
    }

    function resetHintsColor() {
        for (let [, span] in Iterator(hintElements))
        {
            span.style.backgroundColor = getHintColor(span.element);
        }
    }

    function removeHints(win) {
        if (!win)
            win = window.content;

        var doc = win.document;

        var hintContainer = doc.getElementById(hintContainerId);
        if (doc && doc.body && hintContainer)
        {
            try {
                doc.body.removeChild(hintContainer);
            } catch (x) { util.message(x); }
        }

        Array.forEach(win.frames, removeHints);
    }

    function destruction(aForce) {
        inputKey = '';

        // if (lastMatchHint)
        //     recoverOriginalStyle(lastMatchHint.element);

        if (continuousMode && !aForce)
        {
            // not remove the hints
            lastMatchHint = null;
            resetHintsColor();
        }
        else
        {
            key.suspended = originalSuspendedStatus;

            try {
                removeHints();
            } catch (x) {
                util.message(x);
            }

            document.removeEventListener('keypress', onKeyPress, true);
        }

        display.echoStatusBar("");
    }

    function fire(elem) {
        // recoverOriginalStyle(elem);

        try {
            currentAction(elem);
        } catch (x) {
            return x;
        }

        return null;
    }

    function onKeyPress(event) {
        var keyStr = key.keyEventToString(event);

        if (keyStr in keyMap === false)
        {
            destruction(true);
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        var role = keyMap[keyStr];

        switch (role) {
        case 'Delete':
            destruction(true);
            return;
        case 'Backspace':
            if (!inputKey)
            {
                destruction(true);
                return;
            }

            inputKey = inputKey.slice(0, inputKey.length - 1);

            // reset but not exit
            blurHint();
            resetHintsColor();

            if (inputKey.length != 0)
                updateHeaderMatchHints();
            return;
        case 'Enter':
            if (lastMatchHint)
                fire(lastMatchHint.element);
            destruction();
            return;
        default :
            inputKey += role;
        };

        blurHint();

        if (inputKey in hintElements === true)
        {
            lastMatchHint = hintElements[inputKey];
            focusHint(lastMatchHint);

            // fire if hint is unique
            if (uniqueFire && !supressUniqueFire)
            {
                let foundCount = updateHeaderMatchHints();

                if (foundCount == 1)
                {
                    var targetElem = lastMatchHint.element;
                    destruction();

                    fire(targetElem);
                }
            }
        }
        else
        {
            lastMatchHint = null;
            inputKey      = "";
        }
    }

    function setLocalQuery() {
        if (plugins.options["hok.local_queries"] && typeof content.location.href == "string")
        {
            for (let [, row] in Iterator(plugins.options["hok.local_queries"]))
            {
                if (content.location.href.match(row[0]))
                {
                    if (row[2])
                    {
                        // not append
                        localQuery = row[1];
                    }
                    else
                    {
                        // append
                        localQuery = selector + ", " + row[1];
                    }

                    return;
                }
            }
        }

        localQuery = undefined;
    }

    function init() {
        hintKeysLength = hintKeys.length;
        hintElements   = [];
        hintCount      = 0;

        hintKeys.split('').forEach(
            function (l) {
                keyMap[l] = l;
            });
    }

    var self = {
        start: function (aAction, aContext) {
            if (!window.content)
                return;

            supressUniqueFire = aContext.supressUniqueFire;
            continuousMode  = aContext.continuous;

            currentAction = aAction;
            priorQuery    = aContext.query;

            // suspend keysnail's keyhandler
            originalSuspendedStatus = key.suspended;
            key.suspended = true;

            init();
            setLocalQuery();

            // var fromDate = new Date();
            drawHints();
            // var endDate = new Date();

            // util.message((endDate - fromDate) + " msec");

            if (hintCount > 1)
                document.addEventListener('keypress', onKeyPress, true);
            else
            {
                // remove hints, recover keysnail's keyhandler, ...
                destruction(true);

                if (hintCount == 1)
                {
                    // only one hint found, immediatly fire
                    try
                    {
                        // TODO: Is there a good way to do this?
                        for (let [, hintElem] in Iterator(hintElements))
                        {
                            if (supressUniqueFire)
                                hintElem.element.focus();
                            else
                                fire(hintElem.element);

                            break;
                        }
                    }
                    catch (x)
                    {
                        util.message(x);
                    }
                }
                else
                {
                    display.echoStatusBar(M({ja: "ヒントが見つかりませんでした", en: "No hints found"}), 1000);
                    recoverFocus();
                }
            }
        },

        startForeground: function (supressUniqueFire) {
            self.start(function (elem) followLink(elem, CURRENT_TAB),
                      {
                          supressUniqueFire: supressUniqueFire
                      });
        },

        startBackground: function (supressUniqueFire) {
            hok.start(function (elem) followLink(elem, NEW_BACKGROUND_TAB),
                      {
                          supressUniqueFire: supressUniqueFire
                      });
        },

        startContinuous: function () {
            hok.start(function (elem) followLink(elem, NEW_BACKGROUND_TAB),
                      {
                          supressUniqueFire: false,
                          continuous: true
                      });
        }
    };

    return self;
}();

// export
plugins.hok = __ksSelf__;

// }} ======================================================================= //

// Actions {{ =============================================================== //

function formatActions(aActions) {
    return aActions.map(function (row) row.slice(0, 2));
}

var query = {
    images : useSelector ? "img" : "//img",
    frames : useSelector ? "body" : "//body"
};

// ['Key', 'Description', function (elem) { /* process hint elem */ }, supressUniqueFire, continuousMode, 'Query query']
var actions = [
    [';', M({ja: "要素へフォーカス", en: "Focus hint"}), function (elem) elem.focus()],
    ['s', M({ja: "リンク先を保存", en: "Save hint"}), function (elem) plugins.hok.saveLink(elem, true)],
    ['a', M({ja: "名前をつけてリンク先を保存", en: "Save hint with prompt"}), function (elem) plugins.hok.saveLink(elem, false)],
    ['f', M({ja: "フレームへフォーカス", en: "Focus frame"}), function (elem) elem.ownerDocument.defaultView.focus(), false, false, query.frames],
    ['o', M({ja: "リンクを開く", en: "Follow hint"}), function (elem) plugins.hok.followLink(elem, CURRENT_TAB)],
    ['t', M({ja: "新しいタブでリンクを開く", en: "Follow hint in a new tab"}), function (elem) plugins.hok.followLink(elem, NEW_TAB)],
    ['b', M({ja: "背面のタブでリンクを開く", en: "Follow hint in a background tab"}), function (elem) plugins.hok.followLink(elem, NEW_BACKGROUND_TAB)],
    ['w', M({ja: "新しいウィンドウでリンクを開く", en: "Follow hint in a new window"}), function (elem) plugins.hok.followLink(elem, NEW_WINDOW)],
    ['F', M({ja: "連続してリンクを開く", en: "Open multiple hints in tabs"}), function (elem) plugins.hok.followLink(elem, NEW_BACKGROUND_TAB), false, true],
    ['v', M({ja: "リンク先のソースコードを表示", en: "View hint source"}), function (elem) plugins.hok.viewSource(elem.href, false)],
    ['V', M({ja: "リンク先のソースコードを外部エディタで表示", en: "View hint source in external editor"}), function (elem) plugins.hok.viewSource(elem.href, true)],
    ['y', M({ja: "リンクの URL をコピー", en: "Yank hint location"}), function (elem) command.setClipboardText(elem.href)],
    ['Y', M({ja: "要素の内容をコピー", en: "Yank hint description"}), function (elem) command.setClipboardText(elem.textContent || "")],
    ['c', M({ja: "右クリックメニューを開く", en: "Open context menu"}), function (elem) plugins.hok.openContextMenu(elem)],
    ['i', M({ja: "画像を開く", en: "Show image"}), function (elem) plugins.hok.openURI(elem.src), false, false, query.images],
    ['I', M({ja: "画像を新しいタブで開く", en: "Show image in a new tab"}), function (elem) plugins.hok.openURI(elem.src, NEW_TAB), false, false, query.images]
];

if (getOption("actions"))
{
    getOption("actions").forEach(function (aRow) actions.push(aRow));
}

function doAction(aStr) {
    for (var i = 0; i < actions.length; ++i)
    {
        if (actions[i][0] === aStr)
        {
            var func = actions[i][2];
            var desc = actions[i][1];

            hok.start(func,
                      {
                          supressUniqueFire : actions[i].length > 3 ? actions[i][3] : false,
                          continuous        : actions[i].length > 4 ? actions[i][4] : false,
                          query             : actions[i].length > 5 ? actions[i][5] : null
                      });
            return;
        }
    }
}

// }} ======================================================================= //

// Exts {{ ================================================================== //

ext.add("hok-start-foreground-mode",
        function (ev, arg) hok.startForeground(!(arg === null)),
        M({ja: "HoK - リンクをフォアグラウンドで開く", en: "Start Hit a Hint foreground mode"}));

ext.add("hok-start-background-mode",
        function (ev, arg) hok.startBackground(!(arg === null)),
        M({ja: "HoK - リンクをバックグラウンドで開く", en: "Start Hit a Hint background mode"}));

ext.add("hok-start-continuous-mode",
        hok.startContinuous,
        M({ja: "HoK - リンクを連続して開く", en: "Start Hit a Hint continuous mode"}));

ext.add("hok-start-extended-mode", function (ev, arg) {
            prompt.reader(
                {
                    message  : "Extended hint mode (Press TAB to see completions): ",
                    onChange : function (arg) {
                        if (arg.event.keyCode === KeyEvent.DOM_VK_SHIFT ||
                            arg.event.keyCode === KeyEvent.DOM_VK_TAB)
                            return;

                        var current = arg.textbox.value;
                        if (current)
                            arg.finish();
                    },
                    collection          : formatActions(actions),
                    header              : [M({ja: "キー", en: "Key"}), M({ja: "説明", en: "Description"})],
                    style               : ["font-weight:bold;text-align:right;margin-right:2em;", "color:#5100ae;"],
                    width               : [40, 60],
                    supressRecoverFocus : true,
                    callback            : function (aStr) {
                        if (aStr !== null)
                            doAction(aStr);
                        recoverFocus();
                    }
                }
            );
        }, M({ja: "HoK - 拡張ヒントモードを開始", en: "Start Hit a Hint extended mode"}));

// }} ======================================================================= //
