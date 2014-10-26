// PLUGIN_INFO {{ =========================================================== //

let PLUGIN_INFO =
<KeySnailPlugin>
    <name>kungfloo</name>
    <description>Manipulate Tombloo from KeySnail</description>
    <description lang="ja">KeySnail から Tombloo を操作</description>
    <version>0.0.8</version>
    <updateURL>https://github.com/mooz/keysnail/raw/master/plugins/kungfloo.ks.js</updateURL>
    <iconURL>https://github.com/mooz/keysnail/raw/master/plugins/icon/kungfloo.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.8.0</minVersion>
    <detail><![CDATA[
=== Usage ===

==== Manipulate Tombloo with keyboard ====

kungfloo allows you to manipulate Tombloo by keyboard.

You can reblog entry of blog, videos in YouTube, photos in Flickr, and of course tumble in Tumblr in various ways listed below.

- DWIM post by pressing certain key.
- Select where to post by pressing certain key.
- Select image using HoK and post it.
- Select arbitrary element using HoK and post it.

==== Settings / Basics ====

Paste the code below to the bottom of your .keysnail.js.

>|javascript|
key.defineKey([key.modes.VIEW, key.modes.CARET], 'r', function (ev, arg) {
    ext.exec("kungfloo-reblog", arg, ev);
}, 'kungfloo - Reblog', true);
||<

After that, by pressing 'r' key, you can select where to post.

Use arrow key or j/k to select where to post and press keys listed below.

- r / Enter
 - Post current page immediately.
- R
 - Dialog of Tombloo will be opened.

We bound kungfloo-reblog to r in the above settings so we can reblog current page by pressing r two times like rr. How easy!

If you do not want to select where to post and reblog current page directly, change kungfloo-reblog to kungfloo-reblog-dwim. Do What I Mean.

==== Reblog images ====

kungfloo collaborates with HoK plugin and allows you to reblog images by using only keyboard easily.

After installing HoK, press ';' key and launch extended hint mode. Then, press 'r' key and hints are attached to the images in the screen.

Now select image you want to reblog by pressing its hint and reblog will be done. How easy!

If you want to select where to post image, press 'R' instead of 'r'. By pressing 'p' key, you can reblog any elements as well as images.

==== Google Reader ====

If you are using Google Reader, the settings below allows you to reblog current item quickly.

>|javascript|
local["^http://www.google.(co.jp|com)/reader/view/"] = [
    // Your local keybind settings here
    ["r", function () {
         let link = content.document.querySelector("#current-entry a.entry-title-link");
         if (link && plugins.kungfloo)
             plugins.kungfloo.reblog(link, false, false, ["FFFFOUND", "Flickr", "Tumblr"]);
     }]
];
||<

See site-local-keymap&quot;s help for details.

    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===

==== Tombloo を KeySnail から操作 ====

kungfloo はキーボードだけで Tombloo を操作する為に作られた KeySnail プラグインです。

このプラグインによって提供される Reblog 方法には、以下のようなものがあります。

- キーを押し、それらしい Reblog 先を Tombloo に判断させて即座にポスト
- キーを押し Reblog 先を選んで現在閲覧中のページを (範囲が選択されていれば Quote もして) ポスト
- HoK の拡張ヒントモードを用い、画像を選択してポスト
- HoK の拡張ヒントモードを用い、様々な要素を選択してポスト

==== 設定 / 基本操作 ====

以下のような設定を .keysnail.js の末尾へ挿入しておきます。

>|javascript|
key.defineKey([key.modes.VIEW, key.modes.CARET], 'r', function (ev, arg) {
    ext.exec("kungfloo-reblog", arg, ev);
}, 'kungfloo - Reblog', true);
||<

この設定を行った後に view-mode と caret-mode において r を押すと、投稿先一覧が画面下部へ表示されます。

ここで十字キーや j/k を使い投稿先にカーソルを合わせた後、次のようなキーを入力することで投稿を行うことが可能です。

- r / Enter
 - 即座に投稿が行われる
- R
 - Tombloo の投稿用ダイアログが開く

先程の設定では kungfloo-reblog へ r を割り当てていましたので、 rr と r を続けて二回押すことにより Reblog が可能となるわけです。

いちいち投稿先を選ぶのが面倒くさい。 Tombloo へお任せでいいから r 一回で Reblog したい。という方は kungfloo-reblog ではなく kungfloo-reblog-dwim へとキーを割り当てておけば良いでしょう。

==== 画像の Reblog ====

ページだけでなく画像も Reblog したいですよね。しかしキーボードだけだと、少し辛そうな感じもします。

kungfloo は Hit a Hint プラグインの HoK と連携し、キーボード操作による画像の簡単 Reblog を可能としました。

HoK をインストールした後 ; などのキーを入力して拡張ヒントモードを立ち上げ r を入力します。

すると画面中の画像にだけヒントがつくので、 Reblog したいものを選んでそのヒントを入力してください。これだけで画像の Reblog が完了します。

「投稿先を選びたい」という場合は r でなく R を押せば、先程説明した投稿先一覧が現れます。また、画像だけでなくリンクなどを Reblog したい場合は p (post) を入力してください。

これらのキーはオプションの値を変更することで、カスタマイズすることも可能となっています。

==== Google Reader 用設定 ====

Google Reader をお使いの方は、次のような設定を行っておくと現在閲覧中のアイテムを簡単に Reblog することができて便利です。

>|javascript|
local["^http://www.google.(co.jp|com)/reader/view/"] = [
    // 略
    ["r", function () {
         let link = content.document.querySelector("#current-entry a.entry-title-link");
         if (link && plugins.kungfloo)
             plugins.kungfloo.reblog(link, false, false, ["FFFFOUND", "Flickr", "Tumblr"]);
     }]
];
||<

なお、上記の設定詳細について site-local-keymap プラグインのヘルプを参照してください。

=== 謝辞 ===

プラグインを開発するにあたって http://unsigned.g.hatena.ne.jp/Trapezoid/20080717/1216297347 のコードを参考にさせていただきました。

]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// Change Log {{ ============================================================ //
//
// ==== 0.0.4 (2010 02/19) ====
//
// * Fixed the missing focus bug
//
// ==== 0.0.3 (2010 02/11) ====
//
// * Added 4th argument "preferred" to the plugins.kungfloo.reblog()
//   This argument specifies the initialy selected service by array
//   e.g. ["FFFFOUND", "Flickr", "Tumblr"].
//
// ==== 0.0.2 (2010 02/10) ====
//
// * Released
//
// }} ======================================================================= //

const pOptions = plugins.setupOptions("kungfloo", {
    "reblog_image_dwim_key" : {
        preset: 'r',
        description: M({
            en: "Key bound to `Reblog image DWIM` in the HoK extended hint mode (Default: r)",
            ja: "HoK 拡張ヒントモードにおいて `画像の Reblog DWIM` へ割り当てるキー (デフォルト: r)"})
    },

    "reblog_image_key" : {
        preset: 'R',
        description: M({
        en: "Key bound to `Reblog image` in the HoK extended hint mode (Default: R)",
        ja: "HoK 拡張ヒントモードにおいて `画像の Reblog` へ割り当てるキー (デフォルト: R)"})
    },

    "reblog_misc_key" : {
        preset: 'p',
        description: M({
        en: "Key bound to `Reblog miscellanies` in the HoK extended hint mode (Default: p)",
        ja: "HoK 拡張ヒントモードにおいて `色々 Reblog` へ割り当てるキー (デフォルト: p)"})
    },

    "keymap" : {
        preset: {
            "C-z" : "prompt-toggle-edit-mode",
            "SPC" : "prompt-next-page",
            "b"   : "prompt-previous-page",
            "j"   : "prompt-next-completion",
            "k"   : "prompt-previous-completion",
            "g"   : "prompt-beginning-of-candidates",
            "G"   : "prompt-end-of-candidates",
            "q"   : "prompt-cancel",
            //
            "r"   : "reblog",
            "R"   : "reblog-with-dialog"
        },
        description: M({
            en: "Keymap of the extensions selector",
            ja: "投稿先を選択する画面のキーマップ"}),
        type: "object"
    }
}, PLUGIN_INFO);

let kungfloo = (function () {
    let to      = (Cc['@brasil.to/tombloo-service;1'] || Cc['@tombfix.github.io/tombfix-service;1']).getService().wrappedJSObject;
    let Tombloo = to.Tombloo;

    function getActions() {
        let actions = Tombloo.Service.actions;

        return [actions[name] for ([, name] in Iterator(actions.names))
                              if (actions[name] && typeof actions[name].execute === "function")];
    }

    function getContext(target) {
        let doc = window.content.document;
        let win = window.content;

        target = target || doc;

        return implant(implant({
            document  : doc,
            window    : win,
            title     : doc.title.toString() || '',
            selection : win.getSelection().toString(),
            target    : target
        }, {} ), win.location);
    }

    function implant(dst, src, keys) {
        if (keys)
            keys.forEach(function (key) { dst[key] = src[key]; });
        else
            for (let key in src) dst[key] = src[key];

        return dst;
    }

    let self = {
        menu: function menu() {
            let items = getActions();

            prompt.selector({
                message       : "action:",
                collection    : items.map(function (e) e.name),
                heade         : ["Tombloo action"],
                style         : [style.prompt.description],
                keymap        : pOptions["keymap"],
                callback      : function (i) { if (i >= 0) items[i].execute(); }
            });
        },

        /**
         * Reblog
         * @param {} target      Target element
         * @param {} dwim        Do What I Mean
         * @param {} dialog      true if tombloo's dialog is wanted
         * @param {} preferred   ex) ["FFFFOUND", "Flickr"]
         */
        reblog: function reblog(target, dwim, withDialog, preferred) {
            try {
                // new tombfix
                var context    = getContext(target);
                var extensions = Tombloo.Service.check(context);
            } catch(ex) {
                // tombloo or old tombfix
                context.document = context.document.wrappedJSObject;
                context.window = context.window.wrappedJSObject;
                var extension = Tombloo.Service.check(context);
            }

            let candidates = [[e, e.ICON, e.name] for ([, e] in Iterator(extensions))];

            function share(extension, dialog) {
                Tombloo.Service.share(context, extension, dialog);
                display.echoStatusBar("Reblogged - " + context.title, 3000);
            }

            function findPreferredExtractor(preferredNames) {
                let found = -1;
                preferredNames.some(function (pat) extensions.some(
                    function (e, i) e.name.match(pat) ? (found = i, true) : false));
                return found;
            }

            function focusContent() {
                getBrowser().focus();
                _content.focus();
            }

            preferred = Object.prototype.toString.call(preferred) === "[object Array]"
                ? preferred : [preferred || ""];

            let extensionIndex = Math.max(findPreferredExtractor(preferred), 0);

            if (dwim)
                share(candidates[extensionIndex][0], withDialog);
            else {
                prompt.selector({
                    message       : "reblog:",
                    collection    : candidates,
                    header        : ["Post to"],
                    style         : [style.prompt.description],
                    flags         : [HIDDEN | IGNORE, ICON | IGNORE, 0],
                    keymap        : pOptions["keymap"],
                    initialIndex  : extensionIndex,
                    initialAction : withDialog ? 1 : 0,
                    actions       : [
                        [function (i) { if (i >= 0) share(candidates[i][0], false); },
                         "Reblog", "reblog"],
                        [function (i) { if (i >= 0) share(candidates[i][0], true);  },
                         "Reblog with dialog", "reblog-with-dialog"]
                    ],
                    supressRecoverFocus : true,
                    onFinish            : function () { focusContent(); }
                });
            }
        }
    };

    // }} ======================================================================= //

    return self;
})();

plugins.kungfloo = kungfloo;

// Extend HoK {{ ============================================================ //

hook.addToHook('PluginLoaded', function () {
    if (!plugins.hok)
        return;

    let actions = [
        //
        [pOptions["reblog_image_key"],
         M({ja: "画像を Reblog", en: "Reblog image"}),
         function (elem) { if (elem) kungfloo.reblog(elem); }, false, false, "img"],
        //
        [pOptions["reblog_misc_key"],
         M({ja: "色々 Reblog", en: "Reblog miscellanies"}),
         function (elem) { if (elem) kungfloo.reblog(elem); }],
        //
        [pOptions["reblog_image_dwim_key"],
         M({ja: "画像を Reblog - DWIM", en: "Reblog image - DWIM"}),
         function (elem) { if (elem) kungfloo.reblog(elem, true); }, false, false, "img"]
    ];

    function seekAction(aActions, aKey) {
        for (let i = 0; i < aActions.length; ++i)
            if (aActions[i][0] === aKey)
                return i;
        return -1;
    }

    actions.forEach(function (row) {
        let k = row[0];
        if (!k) return;

        let i = seekAction(plugins.hok.actions, k);

        if (i >= 0)
            plugins.hok.actions[i] = row;
        else
            plugins.hok.actions.push(row);
    });
});

// }} ======================================================================= //

// Add exts {{ ============================================================== //

plugins.withProvides(function (provide) {
    provide("kungfloo-reblog",
            function (ev, arg) { kungfloo.reblog(null, false, !!arg); },
            "Kungfloo - Reblog");

    provide("kungfloo-reblog-dwim",
            function (ev, arg) { kungfloo.reblog(null, true, !!arg); },
            "Kungfloo - Reblog Do What I Mean");

    provide("kungfloo-tombloo-menu",
            function (ev, arg) { kungfloo.menu(); },
            "Kungfloo - Tombloo Menu");
}, PLUGIN_INFO);

// }} ======================================================================= //
