// Plugin info {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>HoK</name>
    <description>Hit a hint for KeySnail</description>
    <description lang="ja">キーボードでリンクをごにょごにょ</description>
    <version>1.1.5</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/hok.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/hok.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.0.1</minVersion>
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
            <name>hok.selector</name>
            <type>string</type>
            <description>SelectorAPI query</description>
            <description lang="ja">ヒントの取得に使う Selectors API クエリ</description>
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
            <description lang="ja">ヒントのスタイルを設定する。</description>
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

If you are familiar with the Selectors API and want this plugin to use arbitrary one, you can set the query.

>||
plugins.options["hok.selector"] = 'a[href], input:not([type="hidden"]),
                                   textarea, select, img[onclick], button';
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

Selector API を知っていてカスタマイズしたいという方は、次のようにしてヒント取得用のクエリを変更することもできます。

>||
plugins.options["hok.selector"] = 'a[href], input:not([type="hidden"]),
                                   textarea, select, img[onclick], button';
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

ポイントは「アクション毎に Selectors API クエリを設定できる」というところにあります。例えばフレームだけを対象にさせたいのであれば body を設定しておけば良いのですし、画像だけなら img で OK なのです。可能性は無限大ですね。

各アクションは次のような形式となります。

>||
['キー', '説明',
 function (elem) { /* elem を使った処理 */ },
 autoFire を抑制するか, continuous とするか, 'Selectors API のクエリ']
||<

関数にはヒントを使って選択した要素が渡ります。 elem.href とすればリンクの URL が得られ、 elem.textContent とすればそのリンクのテキストが得られます。画像であれば elem.src としてその URL を得ることも出来ます。

後ろ三つの引数に関しては省略することが可能です。

=== 説明 ===

このプラグインは以下のブックマークレットと Vimperator の hints.js を参考にして作成されました。

http://d.hatena.ne.jp/Griever/20090223/1235407852

HoK のオリジナル開発者は myuhe さんです。

http://github.com/myuhe
	       ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
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
    "selector"           : 'a[href], input:not([type="hidden"]), textarea, select, img[onclick], button',
    "statusbar_feedback" : true,
    "unique_fire"        : true,
    "actions"            : null,
    "hint_base_style"    : {
            position        : 'absolute',
            zIndex          : '2147483647',
            color           : '#000',
            fontSize        : '10pt',
            fontFamily      : 'monospace',
            lineHeight      : '10pt',
            padding         : '0px',
            margin          : '0px',
            textTransform   : 'uppercase'
    },
    "hint_color_link"       : 'rgba(180, 255, 81, 0.9)',
    "hint_color_form"       : 'rgba(157, 82, 255, 0.9)',
    "hint_color_candidates" : 'rgba(255, 149, 153, 0.9)',
    "hint_color_focused"    : 'rgba(255, 4, 5, 1.0)'
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

    // var savedOption = util.getUnicharPref(L("browser.tabs.loadInBackground"));
    // util.setUnicharPref(L("browser.tabs.loadInBackground"), true);
    try {
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
    } catch (x) { util.message(x); }
    // util.setUnicharPref(L("browser.tabs.loadInBackground"), savedOption);
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

// }} ======================================================================= //

// HoK object {{ ============================================================ //

var originalSuspendedStatus;

var hok = function () {
    var hintKeys            = getOption("hint_keys");
    var selector            = getOption("selector");
    var hintBaseStyle       = getOption("hint_base_style");
    var hintColorLink       = getOption("hint_color_link");
    var hintColorForm       = getOption("hint_color_form");
    var hintColorFocused    = getOption("hint_color_focused");
    var hintColorCandidates = getOption("hint_color_candidates");
    var elementColorFocused = getOption("element_color_focused");

    var keyMap = {};
    keyMap[KeyEvent.DOM_VK_DELETE]     = 'Delete';
    keyMap[KeyEvent.DOM_VK_BACK_SPACE] = 'Backspace';
    keyMap[KeyEvent.DOM_VK_RETURN]     = 'Enter';
    keyMap[KeyEvent.DOM_VK_ENTER]      = 'Enter';

    var lastFocusedInfo;

    // misc options {{ ========================================================== //

    var useStatusBarFeedBack = getOption("statusbar_feedback");

    var uniqueFire = getOption("unique_fire");
    var uniqueFireSuspended;

    var continuousMode;

    // }} ======================================================================= //

    var currentAction;
    var priorSelector;

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

    function getBodyOffsets(doc)
    {
        let bodyRect = (doc.body || doc.documentElement).getBoundingClientRect();
        return [-bodyRect.left, -bodyRect.top];
    }


    function drawHints(win) {
        if (!win)
            win = window.content;

        var doc = win.document;

        if (!doc)
            return;

        var html   = doc.documentElement;
        var body   = doc.body;

        if (!body)
        {
            // process childs only
            Array.forEach(win.frames, drawHints);
            return;
        }

        var height = win.innerHeight;
        var width  = win.innerWidth;

        var [scrollX, scrollY] = getBodyOffsets(doc);

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

        var result = doc.querySelectorAll(priorSelector || selector);

        for each (var elem in result)
        {
            var style = win.getComputedStyle(elem, null);

            if (!style || style.visibility !== "visible" || style.visibility === "none")
            {
                continue;
            }

            var rect = elem.getClientRects()[0];

            if (!rect             ||
                rect.top > height ||
                rect.bottom < 0   ||
                rect.left > width ||
                rect.right < 0)
            {
                continue;
            }

            var top, left;
            top  = (body.scrollTop || html.scrollTop) - html.clientTop + rect.top;
            left = (body.scrollLeft || html.scrollLeft) - html.clientLeft + rect.left;

            var hint = createText(hintCount);
            var span = hintSpan.cloneNode(false);
            span.appendChild(doc.createTextNode(hint));

            var ss   = span.style;
            ss.left  = Math.max((rect.left + scrollX + 4), scrollX + 8) + 'px';
            ss.top   = Math.max((rect.top + scrollY + 4), scrollY + 8) + 'px';

            if (elem.hasAttribute('href') === false)
            {
                ss.backgroundColor = hintColorForm;
            }

            hintElements[hint] = span;
            span.element       = elem;
            hintContainer.appendChild(span);

            hintCount++;
        }

        if (doc.body)
            doc.body.appendChild(fragment);

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

        aHint.element.focus();
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
        for each (var span in hintElements)
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
            } catch (x) {}
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
        var keyCode = event.keyCode || event.charCode;

        if (keyCode in keyMap === false)
        {
            destruction(true);
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        var onkey = keyMap[keyCode];

        switch (onkey) {
        case 'Backspace':
        case 'Delete':
            if (!inputKey)
            {
                destruction(true);
                return;
            }
            // reset but not exit
            inputKey = '';
            blurHint();
            resetHintsColor();
            return;
        case 'Enter':
            if (lastMatchHint)
                fire(lastMatchHint.element);
            destruction();
            return;
        default :
            inputKey += onkey;
        };

        blurHint();

        if (inputKey in hintElements === true)
        {
            lastMatchHint = hintElements[inputKey];
            focusHint(lastMatchHint);

            // fire if hint is unique
            if (uniqueFire && !uniqueFireSuspended)
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

        if (useStatusBarFeedBack)
            display.echoStatusBar("hint input : " + inputKey);
    }

    function init() {
        hintKeysLength = hintKeys.length;
        hintElements   = [];
        hintCount      = 0;

        hintKeys.split('').forEach(
            function (l) {
                keyMap[l.charCodeAt(0)] = l;
            });
    }

    var self = {
        start: function (aAction, aContext) {
            if (!window.content || !document.querySelectorAll)
                return;

            uniqueFireSuspended = aContext.suspendUniqueFire;
            continuousMode      = aContext.continuous;

            currentAction = aAction;
            priorSelector = aContext.selector;

            // suspend keysnail's keyhandler
            originalSuspendedStatus = key.suspended;
            key.suspended = true;

            init();

            drawHints();

            if (hintCount > 1)
            {
                document.addEventListener('keypress', onKeyPress, true);
            }
            else
            {
                // remove hints, recover keysnail's keyhandler, ...
                destruction(true);

                if (hintCount == 1)
                {
                    // only one hint found, immediatly fire
                    try {
                        // TODO: Is there a good way to do this?
                        for each (let hintElem in hintElements)
                        {
                            fire(hintElem.element);
                            break;
                        }
                    } catch (x) {}
                }
                else
                {
                    display.echoStatusBar(M({ja: "ヒントが見つかりませんでした", en: "No hints found"}), 1000);
                }
            }
        },

        startForeground: function (supressAutoFire) {
            self.start(function (elem) followLink(elem, CURRENT_TAB),
                      {
                          supressAutoFire: supressAutoFire
                      });
        },

        startBackground: function (supressAutoFire) {
            hok.start(function (elem) followLink(elem, NEW_BACKGROUND_TAB),
                      {
                          supressAutoFire: supressAutoFire
                      });
        },

        startContinuous: function () {
            hok.start(function (elem) followLink(elem, NEW_BACKGROUND_TAB),
                      {
                          supressAutoFire: false,
                          continuous: true
                      });
        }
    };

    return self;
}();

// }} ======================================================================= //

// Actions {{ =============================================================== //

function formatActions(aActions) {
    return aActions.map(function (row) row.slice(0, 2));
}

// Selectors API query
var selectors = {
    images  : "img",
    frames : "body"
};

// ['Key', 'Description', function (elem) { /* process hint elem */ }, supressAutoFire, continuousMode, 'Selectors API query']
var actions = [
    [';', M({ja: "要素へフォーカス", en: "Focus hint"}), function (elem) elem.focus()],
    ['s', M({ja: "リンク先を保存", en: "Save hint"}), function (elem) saveLink(elem, false)],
    ['a', M({ja: "名前をつけてリンク先を保存", en: "Save hint with prompt"}), function (elem) saveLink(elem, true)],
    ['f', M({ja: "フレームへフォーカス", en: "Focus frame"}), function (elem) elem.ownerDocument.defaultView.focus(), false, false, selectors.frames],
    ['o', M({ja: "リンク先へジャンプ", en: "Follow hint"}), function (elem) followLink(elem, CURRENT_TAB)],
    ['t', M({ja: "新しいタブでリンクを開く", en: "Follow hint in a new tab"}), function (elem) followLink(elem, NEW_TAB)],
    ['b', M({ja: "背面のタブでリンクを開く", en: "Follow hint in a background tab"}), function (elem) followLink(elem, NEW_BACKGROUND_TAB)],
    ['w', M({ja: "新しいウィンドウでリンクを開く", en: "Follow hint in a new window"}), function (elem) followLink(elem, NEW_WINDOW)],
    ['v', M({ja: "ヒントのソースコードを表示", en: "View hint source"}), function (elem) viewSource(elem.href, false)],
    ['V', M({ja: "ヒントのソースコードを外部エディタで表示", en: "View hint source in external editor"}), function (elem) viewSource(elem.href, true)],
    ['F', M({ja: "連続してリンクを開く", en: "Open multiple hints in tabs"}), function (elem) followLink(elem, NEW_BACKGROUND_TAB), false, true],
    ['y', M({ja: "リンク先の URL をコピー", en: "Yank hint location"}), function (elem) command.setClipboardText(elem.href)],
    ['Y', M({ja: "要素の内容をコピー", en: "Yank hint description"}), function (elem) command.setClipboardText(elem.textContent || "")],
    ['c', M({ja: "右クリックメニューを開く", en: "Open context menu"}), function (elem) openContextMenu(elem)],
    ['i', M({ja: "画像を開く", en: "Show image"}), function (elem) openURI(elem.src), false, false, selectors.images],
    ['I', M({ja: "画像を新しいタブで開く", en: "Show image in a new tab"}), function (elem) openURI(elem.src, NEW_TAB), false, false, selectors.images]
];

if (getOption("actions"))
{
    getOption("actions").forEach(function (aRow) actions.push(aRow));
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
            function recoverFocus() {
                gBrowser.focus();
                _content.focus();
            }

            prompt.reader(
                {
                    message: "Extended hint mode (Press TAB to see completions): ",
                    onChange: function (arg) {
                        if (arg.event.keyCode === KeyEvent.DOM_VK_SHIFT ||
                            arg.event.keyCode === KeyEvent.DOM_VK_TAB)
                        {
                            return;
                        }

                        var current = arg.textbox.value;
                        if (current)
                            arg.finish();
                    },
                    collection: formatActions(actions),
                    header: [
                        M({ja: "キー", en: "Key"}), M({ja: "説明", en: "Description"})
                    ],
                    style: [
                        "font-weight:bold;text-align:right;margin-right:2em;", "color:#5100ae;"
                    ],
                    width: [
                        40, 60
                    ],
                    supressRecoverFocus: true,
                    callback: function (aStr) {
                        if (aStr == null)
                        {
                            recoverFocus();
                            return;
                        }

                        for (var i = 0; i < actions.length; ++i)
                        {
                            if (actions[i][0] == aStr[0])
                            {
                                var func = actions[i][2];
                                var desc = actions[i][1];

                                hok.start(func,
                                          {
                                              supressAutoFire : actions[i].length > 3 ? actions[i][3] : false,
                                              continuous      : actions[i].length > 4 ? actions[i][4] : false,
                                              selector        : actions[i].length > 5 ? actions[i][5] : null
                                          });
                                return;
                            }
                        }

                        recoverFocus();
                    }
                }
            );
        }, M({ja: "HoK - 拡張ヒントモードを開始", en: "Start Hit a Hint extended mode"}));

// }} ======================================================================= //

if (!document.querySelectorAll)
{
    display.notify(M({ja: "HoK :: このプラグインは Firefox 3.1 以降専用です。 Firefox をアップデートするか、このプラグインを無効にしてください。",
                      en: "HoK :: This plugin is only works over Firefox version 3.1. Please update your Firefox or disable this plugin."}));
    hok = null;
}
