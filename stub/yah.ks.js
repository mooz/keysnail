// PLUGIN_INFO : {{
var PLUGIN_INFO =
<KeySnailPlugin>
    <name>HoK</name>
    <description>Hit a hint for KeySnail</description>
    <description lang="ja">キーボードでリンクをごにょごにょ</description>
    <version>1.0.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/hok.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/hok.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz, myuhe</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.0</minVersion>
    <include>main</include>
    <provides>
        <ext>hok-start</ext>
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
            <description lang="ja">キーを入力した際、他に候補が無ければ自動的にそのリンクをたどるか (デフォルト true)</description>
        </option>
        <option>
            <name>hok.selector</name>
            <type>string</type>
            <description>SelectorAPI query</description>
            <description lang="ja">ヒントの取得に使う SelectorAPI クエリ</description>
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
key.setViewKey("e",
    function (ev, arg) {
        ext.exec("hok-start", arg);
    }, "Start HaH", true);
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

次のようにして適当なキーへ Hok を割り当てておきましょう。

>||
key.setViewKey("e",
    function (ev, arg) {
        ext.exec("hok-start", arg);
    }, "Hit a Hint を開始", true);
||<

上記のような設定を .keysnail.js へ記述しておくことにより、ブラウズ画面において e キーを押すことで Hit a Hint を開始させることが可能となります。

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
plugins.options["hok.hint_color_link"]    = 'rgba(180, 255, 81, 0.7)';
plugins.options["hok.hint_color_form"]    = 'rgba(157, 82, 255, 0.7)';
plugins.options["hok.hint_color_focused"] = 'rgba(255, 82, 93, 0.7)';
||<

もし Selector API を知っていて、カスタマイズしたい気があるのなら、次のようにしてヒント取得用のクエリを変更することもできます。

>||
plugins.options["hok.selector"] = 'a[href], input:not([type="hidden"]),
                                   textarea, select, img[onclick], button';
||<

=== 説明 ===

このプラグインは以下のブックマークレットを元にして作成されました。

http://d.hatena.ne.jp/Griever/20090223/1235407852

KeySnail プラグインへの移植は myuhe さんと mooz が行いました。
	       ]]></detail>
</KeySnailPlugin>;

var originalSuspendesStatus;

var optionsDefaultValue = {
    "hint_keys"          : 'asdfghjkl',
    "selector"           : 'a[href], input:not([type="hidden"]), textarea, select, img[onclick], button',
    "unique_fire"        : true,
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
    "hint_color_link"    : 'rgba(255, 255, 0, 0.7)',
    "hint_color_form"    : 'rgba(0, 255, 255, 0.7)',
    "hint_color_focused" : 'rgba(255, 0, 255, 0.7)'
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

    event.initMouseEvent.apply(event, [for (v of defaults)] v);

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

    // var savedOption = util.getUnicharPref("browser.tabs.loadInBackground");
    // util.setUnicharPref("browser.tabs.loadInBackground", true);
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
    // util.setUnicharPref("browser.tabs.loadInBackground", savedOption);
}

var hok = function () {
    var hintKeys         = getOption("hint_keys");
    var selector         = getOption("selector");
    var hintBaseStyle    = getOption("hint_base_style");
    var hintColorLink    = getOption("hint_color_link");
    var hintColorForm    = getOption("hint_color_form");
    var hintColorFocused = getOption("hint_color_focused");
    var keyMap           = {'8': 'Bkspc', '46': 'Delete'};

    var uniqueFire       = getOption("unique_fire");
    var currentAction;

    var hintKeysLength  = null;
    var fragment        = null;
    var hintContainer   = null;
    var hintContainerId = 'hintContainer';
    var hintSpan        = null;
    var hintElements    = [];
    var html            = null;
    var body            = null;
    var inWidth         = null;
    var inHeight        = null;
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

    function drawHints(win) {
        var k = 0;

        if (!win)
            win = window.content;

        let doc    = win.document;
        let height = win.innerHeight;
        let width  = win.innerWidth;
        // let [scrollX, scrollY] = getBodyOffsets(doc);

        var result = doc.querySelectorAll(selector);

        for each(var elem in result)
        {
            var style = getComputedStyle(elem, null);

            if (style.visibility !== "visible" || style.visibility === "none")
            {
                continue;
            }

            var rect = elem.getClientRects()[0];
            var top, left;

            if (rect &&
                rect.right - rect.left &&
                rect.left >= 0 &&
                rect.top >= -5 &&
                rect.bottom <= height + 5 &&
                rect.right <= width)
            {
                top = (body.scrollTop || html.scrollTop) - html.clientTop + rect.top;
                left = (body.scrollLeft || html.scrollLeft) - html.clientLeft + rect.left;
            }
            else
            {
                continue;
            }

            var hint = createText(k);
            var span = hintSpan.cloneNode(false);
            span.appendChild(doc.createTextNode(hint));

            var ss   = span.style;
            ss.left  = Math.max(0, left - 8) + 'px';
            ss.top   = Math.max(0, top - 8) + 'px';

            if (elem.hasAttribute('href') === false)
            {
                ss.backgroundColor = hintColorForm;
            }

            hintElements[hint] = span;
            span.element       = elem;
            hintContainer.appendChild(span);

            k++;            
        }

        util.message("k = " + k);

        // for (var i = 0; i < win.frames; ++i)
        // {
        //     k += drawHints(win.frames[i]);
        // }

        if (!k)
            return 0;

        return k;
    };

    function removeHints(win) {
        if (!win) {
            win = window.content;
        }

        var doc = win.document;

        // for (var i = 0; i < win.frames.length; i++)
        //     removeHints(win.frames[i]);

        content.document.body.removeChild(hintContainer);
    }

    function blurHint() {
        if (lastMatchHint)
        {
            lastMatchHint.style.backgroundColor = lastMatchHint.element.hasAttribute('href') === true ?
                hintColorLink : hintColorForm;
            lastMatchHint = null;
        }
    }

    function destruct() {
        inputKey = '';
        key.suspended = originalSuspendesStatus;
        // removeHints();

        content.document.body.removeChild(hintContainer);
        content.document.removeEventListener('keypress', onKeyPress, true);
    }

    function init() {
        hintContainer = content.document.getElementById(hintContainerId);

        if (!hintContainer)
        {
            fragment         = content.document.createDocumentFragment();
            hintContainer    = content.document.createElement('div');
            fragment.appendChild(hintContainer);
            hintContainer.id = hintContainerId;
            hintSpan         = content.document.createElement('span');

            var st = hintSpan.style;

            for (var prop in hintBaseStyle)
            {
                st[prop] = hintBaseStyle[prop];
            }

            st.backgroundColor = hintColorLink;
        }

        html           = content.document.documentElement;
        body           = content.document.body;
        hintKeysLength = hintKeys.length;

        hintKeys.split('').forEach(
            function (l) {
                keyMap[l.charCodeAt(0)] = l;
            });
    }

    function onKeyPress(event) {
        var keyc = event.keyCode || event.charCode;

        if (keyc in keyMap === false)
        {
            destruct();
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        var onkey = keyMap[keyc];

        switch (onkey) {
        case 'Bkspc' :
        case 'Delete' :
            if (!inputKey) {
                destruct();
                return;
            }
            // reset but not exit
            inputKey = '';
            blurHint();
            return;
        default :
            inputKey += onkey;
        };

        blurHint();

        if (inputKey in hintElements === true)
        {
            lastMatchHint = hintElements[inputKey];
            lastMatchHint.style.backgroundColor = hintColorFocused;
            lastMatchHint.element.focus();

            if (uniqueFire)
            {
                // fire if hint is unique
                let foundCount = 0;
                for (let hintStr in hintElements)
                {
                    if (hintStr.indexOf(inputKey) == 0)
                        foundCount++;
                }

                // util.message(foundCount);

                if (foundCount == 1)
                {
                    // fire!
                    currentAction(lastMatchHint.element);
                    destruct();
                }
            }
        }
        else
        {
            lastMatchHint = null;
        }
    }

    var self = {
        start: function (aAction) {
            currentAction = aAction;
            originalSuspendesStatus = key.suspended;
            key.suspended = true;

            init();

            if (drawHints())
            {
                content.document.body.appendChild(fragment);
                content.document.addEventListener('keypress', onKeyPress, true);
            }
            else
            {
                key.suspended = originalSuspendesStatus;
            }
        }
    };

    return self;
}();

ext.add("hok-start", function (ev, arg) {
            var argumentGiven = !(arg == null);
            hok.start(function (elem) {
                          followLink(elem, argumentGiven ? NEW_TAB : CURRENT_TAB);
                      });
        }, M({ja: "Hit a Hint を開始", en: "Start Hit a Hint"}));
