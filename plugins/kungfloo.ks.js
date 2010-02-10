// PLUGIN_INFO {{ =========================================================== //

let PLUGIN_INFO =
<KeySnailPlugin>
    <name>kungfloo</name>
    <description>Manipulate Tombloo from KeySnail</description>
    <description lang="ja">KeySnail から Tombloo を操作</description>
    <version>0.0.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/kungfloo.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/kungfloo.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.8</minVersion>
    <provides>
        <ext>kungfloo-reblog</ext>
        <ext>kungfloo-reblog-dwim</ext>
        <ext>kungfloo-tombloo-menu</ext>
    </provides>
    <include>main</include>
    <options>
        <option>
            <name>kungfloo.reblog_image_dwim_key</name>
            <type>string</type>
            <description>Key bound to "Reblog image DWIM" in the HoK extended hint mode (Default: r)</description>
            <description lang="ja">HoK 拡張ヒントモードにおいて "画像の Reblog DWIM" へ割り当てるキー (デフォルト: r)</description>
        </option>
        <option>
            <name>kungfloo.reblog_image_key</name>
            <type>string</type>
            <description>Key bound to "Reblog image" in the HoK extended hint mode (Default: R)</description>
            <description lang="ja">HoK 拡張ヒントモードにおいて "画像の Reblog" へ割り当てるキー (デフォルト: R)</description>
        </option>
        <option>
            <name>kungfloo.reblog_misc_key</name>
            <type>string</type>
            <description>Key bound to "Reblog miscellanies" in the HoK extended hint mode (Default: p)</description>
            <description lang="ja">HoK 拡張ヒントモードにおいて "色々 Reblog" へ割り当てるキー (デフォルト: p)</description>
        </option>
        <option>
            <name>kungfloo.keymap</name>
            <type>object</type>
            <description>Keymap of the extensions selector</description>
            <description lang="ja">投稿先を選択する画面のキーマップ</description>
        </option>
    </options>
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

>||
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

>||
local["^http://www.google.(co.jp|com)/reader/view/"] = [
    // foobar
    ["r", function () {
         let link = content.document.querySelector("#current-entry a.entry-title-link");
         if (link && plugins.kungfloo)
             plugins.kungfloo.reblog(link, false, false);
     }]
||<

See site-local-keymap's help for details.

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

>||
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

>||
local["^http://www.google.(co.jp|com)/reader/view/"] = [
    // 略
    ["r", function () {
         let link = content.document.querySelector("#current-entry a.entry-title-link");
         if (link && plugins.kungfloo)
             plugins.kungfloo.reblog(link, false, false);
     }]
||<

なお、上記の設定詳細について site-local-keymap プラグインのヘルプを参照してください。

=== 謝辞 ===

プラグインを開発するにあたって http://unsigned.g.hatena.ne.jp/Trapezoid/20080717/1216297347 のコードを参考にさせていただきました。

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

let optionsDefaultValue = {
    "reblog_image_dwim_key" : 'r',
    "reblog_image_key"      : 'R',
    "reblog_misc_key"       : 'p',
    "keymap"           : {
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
    }
};

function getOption(aName) {
    let fullName = "kungfloo." + aName;

    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

let kungfloo =
    (function () {
        let to      = Cc['@brasil.to/tombloo-service;1'].getService().wrappedJSObject;
        let Tombloo = to.Tombloo;

         function getActions() {
             let actions = Tombloo.Service.actions;

             return [actions[name] for ([, name] in Iterator(actions.names))
                                   if (actions[name] && typeof actions[name].execute === "function")];
         }

         function getContext(target) {
             let doc = window.content.document;
             let win = window.content.wrappedJSObject;

             target = target || doc;

             return implant(
                 implant(
                     {
                         document  : doc,
                         window    : win,
                         title     : doc.title.toString() || '',
                         selection : win.getSelection().toString(),
                         target    : target
                     },
                     {}
                 ),
                 win.location
             );
         }

         function implant(dst, src, keys) {
             if (keys)
                 keys.forEach(function (key) { dst[key] = src[key]; });
             else
                 for (let key in src) dst[key] = src[key];

             return dst;
         }

         let self = {
             menu  : function menu() {
                 let items = getActions();

                 prompt.selector(
                     {
                         message       : "action:",
                         collection    : items.map(function (e) e.name),
                         heade         : ["Tombloo action"],
                         style         : ["color:#003870;"],
                         keymap        : getOption("keymap"),
                         callback      : function (i) {
                             if (i < 0)
                                 return;

                             items[i].execute();
                         }
                     }
                 );
             },

             reblog: function reblog(target, dwim, withDialog) {
                 let context    = getContext(target);
                 let extensions = Tombloo.Service.check(context);

                 let candidates = [[e, e.ICON, e.name] for ([, e] in Iterator(extensions))];

                 function share(extension, dialog) {
                     Tombloo.Service.share(context, extension, dialog);                         
                     display.echoStatusBar("Reblogged - " + context.title, 3000);
                 }

                 if (dwim)
                 {
                     share(candidates[0][0], withDialog);
                 }
                 else
                 {
                     prompt.selector(
                         {
                             message       : "reblog:",
                             collection    : candidates,
                             heade         : ["Post to"],
                             style         : ["color:#003870;"],
                             flags         : [HIDDEN | IGNORE, ICON | IGNORE, 0],
                             keymap        : getOption("keymap"),
                             initialAction : withDialog ? 1 : 0,
                             actions       : [
                                 [function (i) { if (i >= 0) share(candidates[i][0], false); }, "Reblog", "reblog"],
                                 [function (i) { if (i >= 0) share(candidates[i][0], true);  }, "Reblog with dialog", "reblog-with-dialog"]
                             ]
                         }
                     );
                 }
             }
         };

         // }} ======================================================================= //
         
         return self;
     })();

plugins.kungfloo = kungfloo;

// Extend HoK {{ ============================================================ //

hook.addToHook(
    'PluginLoaded',
    function () {
        if (!plugins.hok)
            return;

        var actions = [
            //
            [getOption("reblog_image_key"),
             M({ja: "画像を Reblog", en: "Reblog image"}),
             function (elem) { if (elem) kungfloo.reblog(elem); }, false, false, "img"],
            //
            [getOption("reblog_misc_key"),
             M({ja: "色々 Reblog", en: "Reblog miscellanies"}),
             function (elem) { if (elem) kungfloo.reblog(elem); }],
            //
            [getOption("reblog_image_dwim_key"),
             M({ja: "画像を Reblog - DWIM", en: "Reblog image - DWIM"}),
             function (elem) { if (elem) kungfloo.reblog(elem, true); }, false, false, "img"]
        ];

        function seekAction(aActions, aKey) {
            for (let i = 0; i < aActions.length; ++i)
                if (aActions[i][0] === aKey)
                    return i;
            return -1;
        }

        actions.forEach(
            function (row) {
                let k = row[0];
                if (!k) return;

                let i = seekAction(plugins.hok.actions, k);

                if (i >= 0)
                    plugins.hok.actions[i] = row;
                else
                    plugins.hok.actions.push(row);
            }
        );
    });

// }} ======================================================================= //

// Add exts {{ ============================================================== //

ext.add("kungfloo-reblog",
        function (ev, arg) { kungfloo.reblog(null, false, !!arg); },
        "Kungfloo - Reblog");

ext.add("kungfloo-reblog-dwim",
        function (ev, arg) { kungfloo.reblog(null, true, !!arg); },
        "Kungfloo - Reblog Do What I Mean");

ext.add("kungfloo-tombloo-menu",
        function (ev, arg) { kungfloo.menu(); },
        "Kungfloo - Tombloo Menu");

// }} ======================================================================= //
