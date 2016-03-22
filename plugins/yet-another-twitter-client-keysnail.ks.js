/**
 * @fileOverview Twitter Client Plugin for KeySnail
 * @name yet-another-twitter-client-keysnail.ks.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

// PLUGIN_INFO {{ =========================================================== //

const PLUGIN_INFO =
<KeySnailPlugin>
    <name>Yet Another Twitter Client KeySnail</name>
    <description>Make KeySnail behave like Twitter client</description>
    <description lang="ja">KeySnail を Twitter クライアントに</description>
    <version>3.2.3</version>
    <updateURL>https://github.com/mooz/keysnail/raw/master/plugins/yet-another-twitter-client-keysnail.ks.js</updateURL>
    <iconURL>https://github.com/mooz/keysnail/raw/master/plugins/icon/yet-another-twitter-client-keysnail.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.8.0</minVersion>
    <include>main</include>
    <require>
        <script>https://github.com/mooz/keysnail/raw/master/plugins/lib/oauth.js</script>
    </require>
    <detail><![CDATA[
=== Usage ===
==== Launching ====
Call twitter-client-display-timeline from ext.select() and twitter client will launch.

You can bind twitter client to some key like below.

>|javascript|
key.setViewKey("t",
    function (ev, arg) {
        ext.exec("twitter-client-display-timeline", arg);
    }, "Display your timeline", true);
||<

Your timeline will be displayed when &apos;t&apos; key is pressed in the browser window.

If you want to tweet directly, paste code like below to your .keysnail.js.

>|javascript|
key.setGlobalKey(["C-c", "t"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet", arg);
    }, "Tweet", true);
||<

You can tweet by pressing C-c t.

Next code allows you to tweet with the current page&apos;s title and URL by pressing C-c T.

>|javascript|
key.setGlobalKey(["C-c", "T"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet-this-page", arg);
    }, "Tweet with the title and URL of this page", true);
||<

==== Keybindings ====

By inserting the code below to PRESERVE area in your .keysnail.js, you can manipulate this client more easily.

>|javascript|
plugins.options["twitter_client.keymap"] = {
    "C-z"   : "prompt-toggle-edit-mode",
    "SPC"   : "prompt-next-page",
    "b"     : "prompt-previous-page",
    "j"     : "prompt-next-completion",
    "k"     : "prompt-previous-completion",
    "g"     : "prompt-beginning-of-candidates",
    "G"     : "prompt-end-of-candidates",
    "q"     : "prompt-cancel",
    // twitter client specific actions
    "t"     : "tweet",
    "r"     : "reply",
    "R"     : "retweet",
    "D"     : "delete-tweet",
    "f"     : "add-to-favorite",
    "v"     : "display-entire-message",
    "V"     : "view-in-twitter",
    "c"     : "copy-tweet",
    "s"     : "show-target-status",
    "@"     : "show-mentions",
    "/"     : "search-word",
    "o"     : "open-url"
};
||<

When you want to input the alphabet key, press C-z or click earth icon and switch to the edit mode.

==== Actions ====
Twitter client displays your time line. If you press **Enter** key, you can go to the **tweet** area.

You can select more actions like reply, retweet, search, et al by pressing the Ctrl + i key.

=== Customizing ===
You can set options through your .keysnail.js.

Here is the example settings. This makes twitter client plugin tweet-only.

>|javascript|
style.register("#keysnail-twitter-client-container{ display:none !important; }");
plugins.options["twitter_client.popup_new_statuses"]           = false;
plugins.options["twitter_client.automatically_begin"]          = false;
plugins.options["twitter_client.automatically_begin_list"]     = false;
plugins.options["twitter_client.timeline_count_beginning"]     = 0;
plugins.options["twitter_client.timeline_count_every_updates"] = 0;
||<
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===

==== 起動 ====

ステータスバーの Twitter アイコンを左クリックすることで Twitter の TimeLine が表示されます。

これは M-x などのキーから ext.select() を呼び出し twitter-client-display-timeline を選ぶのと同じことです。

次のようにして任意のキーへコマンドを割り当てておくことも可能です。

>|javascript|
key.setViewKey("t",
    function (ev, arg) {
        ext.exec("twitter-client-display-timeline", arg);
    }, "TL を表示", true);
||<

上記のようなコードを .keysnail.js へ記述しておくことにより (以下 「設定を行う」 と表記)、ブラウズ画面において t キーを押すことでこのクライアントを起動させることが可能となります。

タイムラインを表示させず即座につぶやきたいという場合には、次のような設定がおすすめです。

>|javascript|
key.setGlobalKey(["C-c", "t"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet", arg);
    }, "つぶやく", true);
||<

こうした設定を行っておくと C-c t を押すことで即座につぶやき画面を表示することが可能となります。

閲覧しているページのタイトルと URL をつぶやくことも可能です。以下のような設定を行っておきましょう。

>|javascript|
key.setGlobalKey(["C-c", "T"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet-this-page", arg);
    }, "このページのタイトルと URL を使ってつぶやく", true);
||<

==== キーバインドの設定 ====

次のような設定を .keysnail.js の PRESERVE エリアへ貼り付けておくと、格段に操作がしやすくなります。
(先ほどとは異なり .keysnail.js 先頭の PRESERVE エリアへ設定コードを記述しなければならないことに注意してください)

>|javascript|
plugins.options["twitter_client.keymap"] = {
    "C-z"   : "prompt-toggle-edit-mode",
    "SPC"   : "prompt-next-page",
    "b"     : "prompt-previous-page",
    "j"     : "prompt-next-completion",
    "k"     : "prompt-previous-completion",
    "g"     : "prompt-beginning-of-candidates",
    "G"     : "prompt-end-of-candidates",
    "q"     : "prompt-cancel",
    // twitter client specific actions
    "t"     : "tweet",
    "r"     : "reply",
    "R"     : "retweet",
    "d"     : "send-direct-message",
    "D"     : "delete-tweet",
    "f"     : "add-to-favorite",
    "v"     : "display-entire-message",
    "V"     : "view-in-twitter",
    "c"     : "copy-tweet",
    "*"     : "show-target-status",
    "@"     : "show-mentions",
    "/"     : "search-word",
    "o"     : "open-url",
    "+"     : "show-conversations",
    "h"     : "refresh-or-back-to-timeline",
    "s"     : "switch-to"
};
||<

どのようなキーバインドとなっているかは、設定を見ていただければ分かるでしょう。気に入らなければ変更することも可能です。

このままではアルファベットが入力できないので、もし絞り込み検索を行うためにアルファベットを入力したくなった場合は、 C-z キーを入力するか 「閉じる」 ボタン左の 「地球マーク」 をクリックし、編集モードへと切り替えてください。

==== Enter ではなく Ctrl + Enter でポストするように ====

Enter では誤爆が多いので Ctrl + Enter でポストするようにしたい、という方は次のような設定を .keysnail.js の PRESERVE エリアへ貼り付けておくとよいでしょう。

>|javascript|
plugins.options["twitter_client.tweet_keymap"] = {
    "C-RET" : "prompt-decide",
    "RET"   : ""
};
||<

==== ヘッダ ====

TL 上部の 「ヘッダ」 部分には、選択中ユーザのアイコンやメッセージなどが表示されます。ユーザ名やアイコンの上へマウスカーソルを持っていくことで、そのユーザの自己紹介文を見ることが可能です。

また、メッセージ中に @username といった表記や http:// といった URL があった場合は自動的にリンクが貼られます。このリンクをそのまま左クリックすると、リンク先へジャンプします。

また、リンクの上で右クリックをすることにより、様々な処理を選ぶことも可能となっています。例えば j.mp や bit.ly のリンク上で右クリックをすれば、その URL が何回クリックされたかを調査することができます。自分の紹介した URL が全然クリックされていなくても、気にしないようにしましょう。世の中そんなものです。

ヘッダ右上の 「閉じる」 ボタンは見落とされがちですが、有事の際には必ず役に立ってくれることでしょう。

==== リスト ====

リストの閲覧を行うためには .keysnail.js 内であらかじめ閲覧したいリストを登録しておく必要があります。

以下に設定例を示します。

>|javascript|
plugins.options["twitter_client.lists"] = ["stillpedant/js", "stillpedant/emacs"];
||<

twitter_client.lists には "ユーザ名/リスト名" といった文字列からなる配列を指定します。ゆえに、自分の作成したリストだけでなく他のユーザの作成したリストを登録することも可能です。

閲覧したいリストは、マウスを使いヘッダのリスト一覧をクリックするか、キーボードを使い switch-to (C-i と押して選択するか、上の設定を行った場合は単に s と押せばよい) を実行することで選択できます。

==== ステータスバーアイコン ====

ステータスバーには二種類のアイコンが追加されます。

「吹き出し」 アイコンを左クリックすると自分の TL が、 「封筒」 アイコンを左クリックすると自分宛のメッセージ (Mentions) が一覧表示されます。

また、それぞれのアイコンを右クリックすることで、それ以外にも様々なコマンドを実行することが可能です。

==== アクションの選択 ====

タイムライン一覧でそのまま Enter キーを入力すると、つぶやき画面へ移行することができます。

Enter ではなく Ctrl + i キーを押すことにより、様々なアクションを選ぶことも可能となっています。

==== ちょっと便利な使い方 ====

例えばみんながつぶやいているページを順番に見ていきたいというときは、次のようにします。

+ Ctrl + i を押して 「メッセージ中の URL を開く」にカーソルを合わせる
+ もう一度 Ctrl + i を押して TL 一覧へ戻る
+ http と打ち込んで URL の載っているつぶやきだけを一覧表示する
+ あとは Ctrl + Enter を押して (Ctrl がポイント！) 順番にページを開いていく

ね、簡単でしょう？

==== 自動更新  ====

このクライアントは起動時にタイマーをセットし Twitter のタイムラインを定期的に更新します。

twitter_client.update_interval に値を設定することにより、この間隔を変更することが可能となっています。

==== ポップアップ通知  ====

twitter_client.popup_new_statuses オプションが true に設定されていれば、新しいつぶやきが届いた際にポップアップで通知が行われるようになります。

また、クライアント実行中にもアクションからこの値を切り替えることが可能です。

=== つぶやき専用 ===

つぶやき専用で TL の表示はしない、自動更新とかもいらないよ、という方向けの設定を以下に示します。

>|javascript|
style.register("#keysnail-twitter-client-container{ display:none !important; }");
plugins.options["twitter_client.popup_new_statuses"]           = false;
plugins.options["twitter_client.automatically_begin"]          = false;
plugins.options["twitter_client.automatically_begin_list"]     = false;
plugins.options["twitter_client.timeline_count_beginning"]     = 0;
plugins.options["twitter_client.timeline_count_every_updates"] = 0;
||<

この設定は http://10sr.posterous.com/tltweetkeysnail-yatwitterclient を参考にさせていただいたものです。
]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

const LOG_LEVEL_DEBUG   = 0;
const LOG_LEVEL_MESSAGE = 10;
const LOG_LEVEL_WARNING = 20;
const LOG_LEVEL_ERROR   = 30;

let pOptions = plugins.setupOptions("twitter_client", {
    "retry_count"                  : { preset: 5 },
    "retry_interval"               : { preset: 2000 },
    "log_level"                    : { preset: LOG_LEVEL_MESSAGE },
    "update_interval"              : {
        preset: 60 * 1000      /* 1 minute  */,
        description: M({
            ja: "ステータスを更新する間隔",
            en: "Interval between status updates in mili-seconds"
        })
    },
    "mentions_update_interval"     : { preset: 60 * 1000 * 5  /* 5 minute  */ },
    "tracking_update_interval"     : { preset: 60 * 1000 * 5  /* 5 minute  */ },
    "dm_update_interval"           : { preset: 60 * 1000 * 20 /* 20 minute */ },
    "list_update_interval"         : { preset: 60 * 1000 * 5  /* 5 minute  */ },
    "list_update_intervals"        : { preset: null },
    "popup_new_statuses"           : {
        preset: false,
        description: M({
            ja: "TL へのつぶやきをポップアップ表示する",
            en: "Popup new statuses from timeline"
        })
    },
    "popup_new_replies"            : {
        preset: true,
        description: M({
            ja: "自分への返信だけポップアップ表示する",
            en: "Popup only new mentions"
        })
    },
    "popup_on_tweet"               : { preset: true },
    "main_column_width"            : {
        preset: [11, 70, 19],
        description: M({
            ja: "[ユーザ名, つぶやき, 情報] 各カラムの幅をパーセンテージ指定",
            en: "Each column width of [User name, Message, Info] in percentage"
        })
    },
    "timeline_count_beginning"     : {
        preset: 80,
        description: M({
            ja: "起動時に取得するステータス数",
            en: "Number of timelines this client fetches in the beginning"
        })
    },
    "timeline_count_every_updates" : {
        preset: 20,
        description: M({
            ja: "初回以降の更新で一度に取得するステータス数",
            en: "Number of timelines this client fetches at once"
        })
    },
    "unread_status_count_style"    : {
        preset: "color:#383838;font-weight:bold;",
        description: M({
            ja: "ステータスバーへ表示される未読ステータス数のスタイルを CSS で指定",
            en: "Specify style of the unread statuses count in the statusbar with CSS"
        })
    },
    "automatically_begin"          : {
        preset: true,
        description: M({
            ja: "プラグインロード時、自動的にステータスの取得を開始するかどうか",
            en: "Automatically begin fetching the statuses"
        })
    },
    "automatically_begin_list"     : {
        preset: true,
        description: M({
            ja: "プラグインロード時、自動的にリストのステータスの取得を開始するかどうか",
            en: "Automatically begin fetching the list statuses"
        })
    },
    "automatically_begin_tracking" : { preset: true },
    "tracking_langage"             : { preset: null },
    "prefer_screen_name": {
        preset: false,
        description: M({
            ja: "TL 一覧などでユーザ名の代わりに ID (screen name) を表示したい場合 true へ設定",
            en: "If you prefer screen name to user name to be displayed, set this value to true"
        })
    },
    "keymap": {
        preset: {
            "C-z"   : "prompt-toggle-edit-mode",
            "SPC"   : "prompt-next-page",
            "b"     : "prompt-previous-page",
            "j"     : "prompt-next-completion",
            "k"     : "prompt-previous-completion",
            "g"     : "prompt-beginning-of-candidates",
            "G"     : "prompt-end-of-candidates",
            "q"     : "prompt-cancel",
            // twitter client specific actions
            "t"     : "tweet",
            "r"     : "reply",
            "R"     : "retweet",
            "d"     : "send-direct-message",
            "D"     : "delete-tweet",
            "f"     : "add-to-favorite",
            "v"     : "display-entire-message",
            "V"     : "view-in-twitter",
            "c"     : "copy-tweet",
            "*"     : "show-target-status",
            "@"     : "show-mentions",
            "/"     : "search-word",
            "o"     : "open-url",
            "+"     : "show-conversations",
            "h"     : "refresh-or-back-to-timeline",
            "s"     : "switch-to"
        },
        description: M({
            ja: "メイン画面の操作用キーマップ",
            en: "Local keymap for manipulation"
        })
    },
    "tweet_keymap": {
        preset: null,
        description: M({
            ja: "つぶやき入力部分のローカルキーマップ",
            en: "Local keymap for tweet input box"
        })
    },
    "switch_to_keymap": {
        preset: {
            "C-z"   : "prompt-toggle-edit-mode",
            "SPC"   : "prompt-next-page",
            "b"     : "prompt-previous-page",
            "j"     : "prompt-next-completion",
            "k"     : "prompt-previous-completion",
            "g"     : "prompt-beginning-of-candidates",
            "G"     : "prompt-end-of-candidates",
            "q"     : "prompt-cancel",
            "o"     : "prompt-decide"
        }
    },
    "black_users": {
        preset: [],
        description: M({
            ja: "タイムラインに表示させたくないユーザの id を配列で指定",
            en: "Specify user id who you don't want to see in the timeline :)"
        })
    },
    // fancy mode settings
    "normal_tweet_style"                    : { preset: "color:black;" },
    "my_tweet_style"                        : { preset: "color:#0a00d5;" },
    "reply_to_me_style"                     : { preset: "color:#930c00;" },
    "retweeted_status_style"                : { preset: "color:#134f00;" },
    "unread_message_style"                  : { preset: "font-weight:bold;" },
    "selected_row_style"                    : { preset: "background-color:#93c6ff; color:black; outline: 1px solid #93c6ff !important;" },
    "selected_user_style"                   : { preset: "background-color:#ddedff; color:black;" },
    "selected_user_reply_to_style"          : { preset: "background-color:#ffd4ff; color:black;" },
    "selected_user_reply_to_reply_to_style" : { preset: "background-color:#ffe9d4; color:black;" },
    "search_result_user_name_style"         : { preset: "color:#003870;" },
    // j.mp settings
    "use_jmp"                               : {
        preset: false,
        description: M({en: "Use j.mp or not. If not, URLs will be automatically shortened by Twitter.",
                        ja: "j.mp をつかって URL を短縮するか指定します。しない場合、 Twitter が自動で短縮します。" })
    },
    "jmp_id"                                : {
        preset: "stillpedant",
        description: M({en: "Specify ID of your j.mp account if you want use your one",
                        ja: "j.mp の URL 短縮で独自アカウントを用いたい場合、その ID を指定" })
    },
    "jmp_key"                               : {
        preset: "R_168719821d1100c59352962dce863251",
        description: M({ ja: "j.mp の URL 短縮で独自アカウントを用いたい場合、その Key を指定",
                         en: "Specify Key of your j.mp account if you want use your one" })
    },
    "lists"                                 : { preset: [] },
    "show_sources"                          : { preset: true },
    "show_retweet_count"                    : { preset: false },
    "hide_profile_image_gif"                : {
        preset: false,
        description: M({ ja: "ユーザのアイコンが Gif 画像であった場合は隠す",
                         en: "When user icon is Gif, hide it" })
    },
    "show_screen_name_on_tweet": {
        preset: false,
        description: M({ ja: "ツイート入力時に自分のスクリーン名を表示する",
                         en: "Display your screen name in tweet box." })
    },
    "filters": {
        preset: [],
        description: M({ ja: "各 status (つぶやき) はこのオプションに登録された関数に渡され、関数が false, null, undefined など falsy な値を返した場合、一覧から削除されます。",
                         en: "Remove tweets when one of the functions returns falsy value." })
    },
    "list_include_rts": {
        preset: true,
        description: M({ ja: "リストのタイムラインに公式RTを含めるかどうか",
                         en: "When set to either true, t or 1, list timelines will contain native retweets (if they exist) in addition to the standard stream of tweets."})
    },
   "user_include_rts": {
        preset: true,
        description: M({ ja: "ユーザのタイムラインに公式RTを含めるかどうか",
                         en: "When set to either true, t or 1, user timelines will contain native retweets (if they exist) in addition to the standard stream of tweets."})
    }
}, PLUGIN_INFO);

// ============================================================ //
// Log
// ============================================================ //

function log() {
    let level = arguments[0];

    if (pOptions["log_level"] >= level)
        util.message.apply(util, Array.slice(arguments, 1));
}

// ============================================================ //
// $U
// ============================================================ //

const $U = {
    bind: function (f, self) {
        return function () { f.call(self); };
    },

    decodeJSON:
    function decodeJSON(json) {
        return JSON.parse(json);
    },

    quoteToUnicode: function (quote) {
        return quote.replace(/["']/g, function (s) ({
            "'" : "\u0027",
            '"' : "\u0022"
        }[s]));
    },

    toEscapedString: function (str) {
        return str.replace(/[^\\]'/g, "\\'").replace(/[\n\r]/g, "");
    },

    createElement: function (name, attrs, childs) {
        let elem = document.createElement(name);

        if (attrs)
            for (let [k, v] of util.keyValues(attrs))
                elem.setAttribute(k, v);

        if (childs)
            for (let v of childs)
                elem.appendChild(v);

        return elem;
    },

    linkClass: "ks-text-link",
    createLinkElement: function (url, text) {
        return $U.createElement("description", {
            "class"       : $U.linkClass,
            "tooltiptext" : url,
            "value"       : text
        });
    },

    insertAfter:
    function insertAfter(parent, node, referenceNode) {
        parent.insertBefore(node, referenceNode.nextSibling);
    },

    shortenURL:
    function shortenURL(aURL, next) {
        if (pOptions["use_jmp"]) {
            const id  = pOptions["jmp_id"];
            const key = pOptions["jmp_key"];

            var endPoint = "http://api.j.mp/shorten?" +
                util.format('version=2.0.1&login=%s&apiKey=%s&longUrl=%s',
                            id, key,
                            encodeURIComponent(aURL));

            util.httpGet(endPoint, false, function (xhr) {
                let response = $U.decodeJSON(xhr.responseText);

                let url = (response && response.results && response.results[aURL]) ?
                    response.results[aURL].shortUrl :
                    aURL;

                next(url);
            });
        } else {
            next(aURL);
        }

    },

    delayed: function (f) {
        return setTimeout(f, 0);
    },

    extractLinks: function (str) {
        return Array.slice(str.match(/(?:(?:http|ftp)s?\:\/\/|www\.)[^\s]+/g))
            .map(function (url) url.indexOf("www") ? url : "http://" + url);
    },

    encodeOAuth: function (str) {
        return encodeURIComponent(str)
            .replace(/\!/g, "%21")
            .replace(/\'/g, "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29")
            .replace(/\*/g, "%2A");
    }
};

// ============================================================ //
// Twitter: get tweet length
// ============================================================ //

/**
 * @license Copyright 2011 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this work except in compliance with the License.
 * You may obtain a copy of the License below, or at:
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var twttr = (function () {
  if (typeof twttr === "undefined" || twttr === null) {
    var twttr = {};
  }

  twttr.txt = {};
  twttr.txt.regexen = {};

  // Builds a RegExp
  function regexSupplant(regex, flags) {
    flags = flags || "";
    if (typeof regex !== "string") {
      if (regex.global && flags.indexOf("g") < 0) {
        flags += "g";
      }
      if (regex.ignoreCase && flags.indexOf("i") < 0) {
        flags += "i";
      }
      if (regex.multiline && flags.indexOf("m") < 0) {
        flags += "m";
      }

      regex = regex.source;
    }

    return new RegExp(regex.replace(/#\{(\w+)\}/g, function (match, name) {
      var newRegex = twttr.txt.regexen[name] || "";
      if (typeof newRegex !== "string") {
        newRegex = newRegex.source;
      }
      return newRegex;
    }), flags);
  }

  twttr.txt.regexSupplant = regexSupplant;

  // simple string interpolation
  function stringSupplant(str, values) {
    return str.replace(/#\{(\w+)\}/g, function (match, name) {
      return values[name] || "";
    });
  }

  twttr.txt.stringSupplant = stringSupplant;

  function addCharsToCharClass(charClass, start, end) {
    var s = String.fromCharCode(start);
    if (end !== start) {
      s += "-" + String.fromCharCode(end);
    }
    charClass.push(s);
    return charClass;
  }

  twttr.txt.addCharsToCharClass = addCharsToCharClass;

  // Space is more than %20, U+3000 for example is the full-width space used with Kanji. Provide a short-hand
  // to access both the list of characters and a pattern suitible for use with String#split
  // Taken from: ActiveSupport::Multibyte::Handlers::UTF8Handler::UNICODE_WHITESPACE
  var fromCode = String.fromCharCode;
  var UNICODE_SPACES = [
    fromCode(0x0020), // White_Space # Zs       SPACE
    fromCode(0x0085), // White_Space # Cc       <control-0085>
    fromCode(0x00A0), // White_Space # Zs       NO-BREAK SPACE
    fromCode(0x1680), // White_Space # Zs       OGHAM SPACE MARK
    fromCode(0x180E), // White_Space # Zs       MONGOLIAN VOWEL SEPARATOR
    fromCode(0x2028), // White_Space # Zl       LINE SEPARATOR
    fromCode(0x2029), // White_Space # Zp       PARAGRAPH SEPARATOR
    fromCode(0x202F), // White_Space # Zs       NARROW NO-BREAK SPACE
    fromCode(0x205F), // White_Space # Zs       MEDIUM MATHEMATICAL SPACE
    fromCode(0x3000)  // White_Space # Zs       IDEOGRAPHIC SPACE
  ];
  addCharsToCharClass(UNICODE_SPACES, 0x009, 0x00D); // White_Space # Cc   [5] <control-0009>..<control-000D>
  addCharsToCharClass(UNICODE_SPACES, 0x2000, 0x200A); // White_Space # Zs  [11] EN QUAD..HAIR SPACE

  var INVALID_CHARS = [
    fromCode(0xFFFE),
    fromCode(0xFEFF), // BOM
    fromCode(0xFFFF) // Special
  ];
  addCharsToCharClass(INVALID_CHARS, 0x202A, 0x202E); // Directional change

  twttr.txt.regexen.spaces_group = regexSupplant(UNICODE_SPACES.join(""));
  twttr.txt.regexen.invalid_chars_group = regexSupplant(INVALID_CHARS.join(""));
  twttr.txt.regexen.punct = /\!'#%&'\(\)*\+,\\\-\.\/:;<=>\?@\[\]\^_{|}~\$/;
  twttr.txt.regexen.non_bmp_code_pairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/mg;

  var latinAccentChars = [];
  // Latin accented characters (subtracted 0xD7 from the range, it's a confusable multiplication sign. Looks like "x")
  addCharsToCharClass(latinAccentChars, 0x00c0, 0x00d6);
  addCharsToCharClass(latinAccentChars, 0x00d8, 0x00f6);
  addCharsToCharClass(latinAccentChars, 0x00f8, 0x00ff);
  // Latin Extended A and B
  addCharsToCharClass(latinAccentChars, 0x0100, 0x024f);
  // assorted IPA Extensions
  addCharsToCharClass(latinAccentChars, 0x0253, 0x0254);
  addCharsToCharClass(latinAccentChars, 0x0256, 0x0257);
  addCharsToCharClass(latinAccentChars, 0x0259, 0x0259);
  addCharsToCharClass(latinAccentChars, 0x025b, 0x025b);
  addCharsToCharClass(latinAccentChars, 0x0263, 0x0263);
  addCharsToCharClass(latinAccentChars, 0x0268, 0x0268);
  addCharsToCharClass(latinAccentChars, 0x026f, 0x026f);
  addCharsToCharClass(latinAccentChars, 0x0272, 0x0272);
  addCharsToCharClass(latinAccentChars, 0x0289, 0x0289);
  addCharsToCharClass(latinAccentChars, 0x028b, 0x028b);
  // Okina for Hawaiian (it *is* a letter character)
  addCharsToCharClass(latinAccentChars, 0x02bb, 0x02bb);
  // Combining diacritics
  addCharsToCharClass(latinAccentChars, 0x0300, 0x036f);
  // Latin Extended Additional
  addCharsToCharClass(latinAccentChars, 0x1e00, 0x1eff);
  twttr.txt.regexen.latinAccentChars = regexSupplant(latinAccentChars.join(""));

  // URL related regex collection
  twttr.txt.regexen.validUrlPrecedingChars = regexSupplant(/(?:[^A-Za-z0-9@＠$#＃#{invalid_chars_group}]|^)/);
  twttr.txt.regexen.invalidUrlWithoutProtocolPrecedingChars = /[-_.\/]$/;
  twttr.txt.regexen.invalidDomainChars = stringSupplant("#{punct}#{spaces_group}#{invalid_chars_group}", twttr.txt.regexen);
  twttr.txt.regexen.validDomainChars = regexSupplant(/[^#{invalidDomainChars}]/);
  twttr.txt.regexen.validSubdomain = regexSupplant(/(?:(?:#{validDomainChars}(?:[_-]|#{validDomainChars})*)?#{validDomainChars}\.)/);
  twttr.txt.regexen.validDomainName = regexSupplant(/(?:(?:#{validDomainChars}(?:-|#{validDomainChars})*)?#{validDomainChars}\.)/);
  twttr.txt.regexen.validGTLD = regexSupplant(/(?:(?:aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|xxx)(?=[^0-9a-zA-Z@]|$))/);
  twttr.txt.regexen.validCCTLD = regexSupplant(RegExp(
    "(?:(?:ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|" +
      "ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|" +
      "ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|" +
      "ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|" +
      "na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|" +
      "sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|" +
      "ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)(?=[^0-9a-zA-Z@]|$))"));
  twttr.txt.regexen.validPunycode = regexSupplant(/(?:xn--[0-9a-z]+)/);
  twttr.txt.regexen.validDomain = regexSupplant(/(?:#{validSubdomain}*#{validDomainName}(?:#{validGTLD}|#{validCCTLD}|#{validPunycode}))/);
  twttr.txt.regexen.validAsciiDomain = regexSupplant(/(?:(?:[\-a-z0-9#{latinAccentChars}]+)\.)+(?:#{validGTLD}|#{validCCTLD}|#{validPunycode})/gi);
  twttr.txt.regexen.invalidShortDomain = regexSupplant(/^#{validDomainName}#{validCCTLD}$/);

  twttr.txt.regexen.validPortNumber = regexSupplant(/[0-9]+/);

  twttr.txt.regexen.validGeneralUrlPathChars = regexSupplant(/[a-z0-9!\*';:=\+,\.\$\/%#\[\]\-_~@|&#{latinAccentChars}]/i);
  // Allow URL paths to contain balanced parens
  //  1. Used in Wikipedia URLs like /Primer_(film)
  //  2. Used in IIS sessions like /S(dfd346)/
  twttr.txt.regexen.validUrlBalancedParens = regexSupplant(/\(#{validGeneralUrlPathChars}+\)/i);
  // Valid end-of-path chracters (so /foo. does not gobble the period).
  // 1. Allow =&# for empty URL parameters and other URL-join artifacts
  twttr.txt.regexen.validUrlPathEndingChars = regexSupplant(/[\+\-a-z0-9=_#\/#{latinAccentChars}]|(?:#{validUrlBalancedParens})/i);
  // Allow @ in a url, but only in the middle. Catch things like http://example.com/@user/
  twttr.txt.regexen.validUrlPath = regexSupplant('(?:' +
                                                 '(?:' +
                                                 '#{validGeneralUrlPathChars}*' +
                                                 '(?:#{validUrlBalancedParens}#{validGeneralUrlPathChars}*)*' +
                                                 '#{validUrlPathEndingChars}'+
                                                 ')|(?:@#{validGeneralUrlPathChars}+\/)'+
                                                 ')', 'i');

  twttr.txt.regexen.validUrlQueryChars = /[a-z0-9!?\*'@\(\);:&=\+\$\/%#\[\]\-_\.,~|]/i;
  twttr.txt.regexen.validUrlQueryEndingChars = /[a-z0-9_&=#\/]/i;
  twttr.txt.regexen.extractUrl = regexSupplant(
    '('                                                            + // $1 total match
    '(#{validUrlPrecedingChars})'                                + // $2 Preceeding chracter
    '('                                                          + // $3 URL
    '(https?:\\/\\/)?'                                         + // $4 Protocol (optional)
    '(#{validDomain})'                                         + // $5 Domain(s)
    '(?::(#{validPortNumber}))?'                               + // $6 Port number (optional)
    '(\\/#{validUrlPath}*)?'                                   + // $7 URL Path
    '(\\?#{validUrlQueryChars}*#{validUrlQueryEndingChars})?'  + // $8 Query String
    ')'                                                          +
      ')'
    , 'gi');

  twttr.txt.regexen.validTcoUrl = /^https?:\/\/t\.co\/[a-z0-9]+/i;
  twttr.txt.regexen.urlHasHttps = /^https:\/\//i;

  twttr.txt.extractUrlsWithIndices = function (text, options) {
    if (!options) {
      options = {extractUrlsWithoutProtocol: true};
    }

    if (!text || (options.extractUrlsWithoutProtocol ? !text.match(/\./) : !text.match(/:/))) {
      return [];
    }

    var urls = [];

    while (twttr.txt.regexen.extractUrl.exec(text)) {
      var before = RegExp.$2, url = RegExp.$3, protocol = RegExp.$4, domain = RegExp.$5, path = RegExp.$7;
      var endPosition = twttr.txt.regexen.extractUrl.lastIndex,
          startPosition = endPosition - url.length;

      // if protocol is missing and domain contains non-ASCII characters,
      // extract ASCII-only domains.
      if (!protocol) {
        if (!options.extractUrlsWithoutProtocol
            || before.match(twttr.txt.regexen.invalidUrlWithoutProtocolPrecedingChars)) {
          continue;
        }
        var lastUrl = null,
            lastUrlInvalidMatch = false,
            asciiEndPosition = 0;
        domain.replace(twttr.txt.regexen.validAsciiDomain, function (asciiDomain) {
          var asciiStartPosition = domain.indexOf(asciiDomain, asciiEndPosition);
          asciiEndPosition = asciiStartPosition + asciiDomain.length;
          lastUrl = {
            url: asciiDomain,
            indices: [startPosition + asciiStartPosition, startPosition + asciiEndPosition]
          };
          lastUrlInvalidMatch = asciiDomain.match(twttr.txt.regexen.invalidShortDomain);
          if (!lastUrlInvalidMatch) {
            urls.push(lastUrl);
          }
        });

        // no ASCII-only domain found. Skip the entire URL.
        if (lastUrl == null) {
          continue;
        }

        // lastUrl only contains domain. Need to add path and query if they exist.
        if (path) {
          if (lastUrlInvalidMatch) {
            urls.push(lastUrl);
          }
          lastUrl.url = url.replace(domain, lastUrl.url);
          lastUrl.indices[1] = endPosition;
        }
      } else {
        // In the case of t.co URLs, don't allow additional path characters.
        if (url.match(twttr.txt.regexen.validTcoUrl)) {
          url = RegExp.lastMatch;
          endPosition = startPosition + url.length;
        }
        urls.push({
          url: url,
          indices: [startPosition, endPosition]
        });
      }
    }

    return urls;
  };

  twttr.txt.modifyIndicesFromUTF16ToUnicode = function (text, entities) {
    twttr.txt.convertUnicodeIndices(text, entities, true);
  };

  twttr.txt.getUnicodeTextLength = function (text) {
    return text.replace(twttr.txt.regexen.non_bmp_code_pairs, ' ').length;
  };

  twttr.txt.convertUnicodeIndices = function (text, entities, indicesInUTF16) {
    if (entities.length == 0) {
      return;
    }

    var charIndex = 0;
    var codePointIndex = 0;

    // sort entities by start index
    entities.sort(function (a,b){ return a.indices[0] - b.indices[0]; });
    var entityIndex = 0;
    var entity = entities[0];

    while (charIndex < text.length) {
      if (entity.indices[0] == (indicesInUTF16 ? charIndex : codePointIndex)) {
        var len = entity.indices[1] - entity.indices[0];
        entity.indices[0] = indicesInUTF16 ? codePointIndex : charIndex;
        entity.indices[1] = entity.indices[0] + len;

        entityIndex++;
        if (entityIndex == entities.length) {
          // no more entity
          break;
        }
        entity = entities[entityIndex];
      }

      var c = text.charCodeAt(charIndex);
      if (0xD800 <= c && c <= 0xDBFF && charIndex < text.length - 1) {
        // Found high surrogate char
        c = text.charCodeAt(charIndex + 1);
        if (0xDC00 <= c && c <= 0xDFFF) {
          // Found surrogate pair
          charIndex++;
        }
      }
      codePointIndex++;
      charIndex++;
    }
  };

  // Returns the length of Tweet text with consideration to t.co URL replacement
  // and chars outside the basic multilingual plane that use 2 UTF16 code points
  twttr.txt.getTweetLength = function (text, options) {
    if (!options) {
      options = {
        // These come from https://api.twitter.com/1/help/configuration.json
        // described by https://dev.twitter.com/docs/api/1/get/help/configuration
        short_url_length: 22,
        short_url_length_https: 23
      };
    }
    var textLength = twttr.txt.getUnicodeTextLength(text),
        urlsWithIndices = twttr.txt.extractUrlsWithIndices(text);
    twttr.txt.modifyIndicesFromUTF16ToUnicode(text, urlsWithIndices);

    for (var i = 0; i < urlsWithIndices.length; i++) {
      // Subtract the length of the original URL
      textLength += urlsWithIndices[i].indices[0] - urlsWithIndices[i].indices[1];

      // Add 23 characters for URL starting with https://
      // Otherwise add 22 characters
      if (urlsWithIndices[i].url.toLowerCase().match(twttr.txt.regexen.urlHasHttps)) {
        textLength += options.short_url_length_https;
      } else {
        textLength += options.short_url_length;
      }
    }

    return textLength;
  };

  return twttr;
})();

// Notifier {{ ============================================================== //

const Notifier = {
    getBrowserWindows:
    function getBrowserWindows() {
        var windows = [];

        var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
            .getService(Ci.nsIWindowMediator);
        var enumerator = wm.getEnumerator("navigator:browser");

        while (enumerator.hasMoreElements())
            windows.push(enumerator.getNext());

        return windows;
    },

    notifyWindows:
    function notifyWindows(aNotifier, aArg) {
        this.getBrowserWindows().forEach(function (win) aNotifier(win, aArg));
    },

    updateAllStatusbars:
    function updateAllStatusbars() {
        this.notifyWindows(function (win) {
            try {
                let { twitterClient } = win.KeySnail.modules.plugins;
                twitterClient.updateStatusbar();
            } catch (x) {}
        });
    },

    updateAllListButtons:
    function updateAllListButtons() {
        this.notifyWindows(function (win) {
            try {
                let { twitterClient } = win.KeySnail.modules.plugins;
                twitterClient.updateListButton();
            } catch (x) {}
        });
    },

    updateAllTrackingButtons:
    function updateAllTrackingButtons() {
        this.notifyWindows(function (win) {
            try {
                let { twitterClient } = win.KeySnail.modules.plugins;
                twitterClient.updateTrackingButton();
            } catch (x) {}
        });
    }
};

// ============================================================ //
// OAuth Class
// ============================================================ //

function OAuth(info, tokens) {
    this.info   = info;
    this.tokens = tokens;

    let context = {};

    if (!userscript.require("oauth.js", context)) {
        display.notify(PLUGIN_INFO.name + " : " +
                       M({ja: "このプラグインの動作には oauth.js が必要です。 oauth.js をプラグインディレクトリ内に配置した上でお試し下さい。",
                          en: "This plugin requires oauth.js but not found. Please locate oauth.js to the plugin directory."}));
    }

    this._oauth = new context.OAuth();
}

OAuth.prototype = {
    asyncRequest:
    function asyncRequest(options, callback, onprogress) {
        var xhr = new XMLHttpRequest();

        let { responsePeeker } = this;

        xhr.onreadystatechange = function (ev) {
            if (xhr.readyState !== 4)
                return;

            if (typeof responsePeeker === "function")
                responsePeeker(xhr);

            callback(ev, xhr);
        };

        if (typeof onprogress === "function")
            xhr.onprogress = onprogress;

        var accessor = options.accessor ||
            {
                consumerSecret : this.info.consumerSecret,
                tokenSecret    : this.tokens.oauth_token_secret
            };

        var message = {
            action     : options.action,
            method     : options.method,
            parameters : [
                ["oauth_consumer_key"     , this.info.consumerKey],
                ["oauth_signature_method" , this.info.signatureMethod],
                ["oauth_version"          , "1.0"]
            ]
        };

        if (this.tokens.oauth_token)
            message.parameters.push(["oauth_token", this.tokens.oauth_token]);

        if (options.parameters && message.method === "POST")
        {
            outer:
            for (let params of options.parameters)
            {
                for (let i = 0; i < message.parameters; ++i)
                {
                    if (params[0] === message.parameters[i][0])
                    {
                        // override
                        message.parameters[i][1] = params[1];
                        // process next params
                        continue outer;
                    }
                }

                // append
                message.parameters.push(params);
            }
        }

        this._oauth.setTimestampAndNonce(message);
        this._oauth.SignatureMethod.sign(message, accessor);

        var oAuthArgs  = this._oauth.getParameterMap(message.parameters);
        var endPoint = this._oauth.addToURL(message.action, oAuthArgs);

        xhr.mozBackgroundRequest = true;
        xhr.open(message.method, endPoint, true);
        xhr.send(null);
    }
};

const Commands = {
    openLink: function (url) {
        return 'openUILinkIn("' + url + '", "tab")';
    },

    openLinkBackground: function (url) {
        return 'openUILinkIn("' + url + '", "tabshifted")';
    },

    execExt: function (extName) {
        return util.format('KeySnail.modules.ext.exec("%s")', extName);
    }
};

// ============================================================ //
// Twitter API
// ============================================================ //

const twitterAPI = {
    get:
    function get(name, params, args) {
        if (!this._holder[name])
            return null;

        return this.getByProto(this._holder[name], params, args);
    },

    getByProto:
    function getByProto(proto, params, args) {
        params = params || {};
        args   = args   || {};

        let action = proto.action;

        for (let [k, v] of util.keyValues(args))
            if (typeof v !== "undefined")
                action = action.replace(util.format("{%s}", k), $U.encodeOAuth(v), "g");

        let query = [for (kv of util.keyValues(params))
                     if (typeof kv[1] !== "undefined")
                       kv[0] + "=" + $U.encodeOAuth(kv[1])].join("&");
        if (query.length)
            action += (action.indexOf("?") < 0 ? "?" : "&") + query;

        let requestArg = {
            action     : action,
            host       : proto.host,
            method     : proto.method
        };

        return requestArg;
    },

    /*
     twitterAPI.request("template", {
         args: {
         },
         params: {
         },
         ok: function (res, xhr) {
         },
         ng: function (res, xhr) {
         }
     });
    */
    request:
    function request(name, context) {
        let caller = arguments.callee.caller;

        let { requester } = this;

        if (!requester)
            return;

        let requestArg = this.get(name, context.params, context.args);

        let retryCount = pOptions["retry_count"];
        let retryInterval = pOptions["retry_interval"];
        function retry() {
            if (--retryCount)
                return;

            setTimeout(function () {
                log(LOG_LEVEL_DEBUG, "Retry (%s) [remains %s]", caller.name, retryCount);
                caller.apply(null, caller.arguments);
            }, retryInterval);
        }

        requester.asyncRequest(requestArg, function (ev, xhr) {
            if (xhr.readyState === 4) {
                let res = xhr.responseText;

                if (xhr.status === 200) {
                    context.ok(res, xhr);
                } else {
                    if (twitterAPI.isRetryable(xhr)) {
                        retry();
                    } else if (twitterAPI.ensureReauthorizationNotRequired(xhr)) {
                        if (typeof context.ng === "function")
                            context.ng(res, xhr);
                    }
                }
            }
        });
    },

    _holder: pOptions["twitter_api"] || {
        // ============================================================ //
        // OAuth
        // ============================================================ //

        "oauth/request_token": {
            action : "https://api.twitter.com/oauth/request_token",
            method : "GET"
        },

        "oauth/access_token": {
            action : "https://api.twitter.com/oauth/access_token",
            method : "GET"
        },

        // ============================================================ //
        // Timeline
        // ============================================================ //

        "statuses/home_timeline": {
            action : "https://api.twitter.com/1.1/statuses/home_timeline.json",
            method : "GET"
        },

        "statuses/user_timeline": {
            action : "https://api.twitter.com/1.1/statuses/user_timeline.json",
            method : "GET"
        },

        "statuses/mentions": {
            action : "https://api.twitter.com/1.1/statuses/mentions_timeline.json",
            method : "GET"
        },

        // ============================================================ //
        // Tweets
        // ============================================================ //

        "statuses/update": {
            action : "https://api.twitter.com/1.1/statuses/update.json",
            method : "POST"
        },

        "statuses/destroy": {
            action : "https://api.twitter.com/1.1/statuses/destroy/{id}.json",
            method : "DELETE"
        },

        "statuses/retweet": {
            action : "https://api.twitter.com/1.1/statuses/retweet/{id}.json",
            method : "POST"
        },

        "statuses/show": {
            action : "https://api.twitter.com/1.1/statuses/show/{id}.json",
            method : "GET"
        },

        // ============================================================ //
        // Favorites
        // ============================================================ //

        "favorites": {
            action : "https://api.twitter.com/1.1/favorites/list.json",
            method : "GET"
        },

        "favorites/user": {
            action : "https://api.twitter.com/1.1/favorites/list.json?user_id={user}",
            method : "GET"
        },

        "favorites/create": {
            action : "https://api.twitter.com/1.1/favorites/create.json",
            method : "POST"
        },

        "favorites/destroy": {
            action : "https://api.twitter.com/1.1/favorites/destroy.json",
            method : "POST"
        },

        // ============================================================ //
        // Lists
        // ============================================================ //

        "lists/index": {
            action : "https://api.twitter.com/1.1/lists/list.json",
            method : "GET"
        },

        "lists/statuses": {
            action : "https://api.twitter.com/1.1/lists/statuses.json",
            host   : "https://api.twitter.com/",
            method : "GET"
        },

        // ============================================================ //
        // Search
        // ============================================================ //

        "search": {
            action : "https://api.twitter.com/1.1/search/tweets.json",
            method : "GET"
        },

        // ============================================================ //
        // Direct messages
        // ============================================================ //

        "direct_messages": {
            action : "https://api.twitter.com/1.1/direct_messages.json",
            method : "GET"
        },

        "direct_messages/sent": {
            action : "https://api.twitter.com/1.1/direct_messages/sent.json",
            method : "GET"
        },

        // ============================================================ //
        // Account
        // ============================================================ //

        "account/verify_credentials": {
            action: "https://api.twitter.com/1.1/account/verify_credentials.json",
            method: "GET"
        },

        // ============================================================ //
        // Friends
        // ============================================================ //

        "statuses/friends": {
            action: "https://api.twitter.com/1.1/friends/list.json",
            method: "GET"
        }
    },

    ERROR_CODES: {
        DOES_NOT_HAVE_DM_PRIVILEGE: 93
    },

    isRetryable:
    function isRetryable(xhr) {
        return false;
    },

    isDMManipulationNotAllowed:
    function isDMManipulationNotAllowed(xhr) {
        let res = $U.decodeJSON(xhr.responseText);

        return res && res.errors && res.errors.some(function (error) {
            return error && error.code === twitterAPI.ERROR_CODES.DOES_NOT_HAVE_DM_PRIVILEGE;
        });
    },

    isTokenExpired:
    function isTokenExpired(xhr) {
        let res = $U.decodeJSON(xhr.responseText);

        return res && res.error &&
            (res.error.indexOf("Could not authenticate with OAuth") !== -1 ||
             res.error.indexOf("expired") !== -1);
    },

    ensureReauthorizationNotRequired:
    function ensureReauthorizationNotRequired(xhr) {
        if ((twitterAPI.isDMManipulationNotAllowed(xhr) || twitterAPI.isTokenExpired(xhr)) &&
            !share.reauthorizeRequisitionShowed) {
            display.showPopup(M({
                ja: "再認証が必要です",
                en: "Reauthorization Required"
            }), M({
                ja: "以前に認証したトークンが無効ないし古くなってしまっています．再認証を行なって下さい．",
                en: "Your access token is no longer valid. Please reauthorize this application."
            }));
            ext.exec("twitter-client-reauthorize");
            share.reauthorizeRequisitionShowed = true;
            return false;
        } else {
            return true;
        }
    }
};

plugins.twitterAPI = twitterAPI;

// ============================================================ //
// Object : Twitter Client (Main)
// ============================================================ //

var twitterClient =
    (function () {
        // Global variables {{ ====================================================== //

        const root = "KeySnail.modules.plugins.twitterClient";

        // ============================================================ //
        // Crawler Class
        // ============================================================ //

        function Crawler(arg) {
            if (!share.twitterCache)
                share.twitterCache = {};
            if (!share.twitterUpdater)
                share.twitterUpdater = {};
            if (!share.twitterDelegator)
                share.twitterDelegator = {};
            if (!share.twitterInterval)
                share.twitterInterval = {};

            this.action       = arg.action;
            this.name         = arg.name;
            this.interval     = arg.interval;
            this.oauth        = arg.oauth;
            this.lastKey      = arg.lastKey;
            this.startNext    = arg.startNext;
            this.mapper       = arg.mapper;
            this.countName    = arg.countName || "count";
            this.maxIDName    = arg.maxIDName || "max_id";
            this.getLastID    = arg.getLastID;
            this.setLastID    = arg.setLastID;
            this.lastIDHook   = arg.lastIDHook;
            this.beginCount   = arg.beginCount;
            this.params       = arg.params;
        }

        Crawler.prototype = {
            set interval(interval) { share.twitterInterval[this.action] = interval; },
            get interval() share.twitterInterval[this.action],

            set updater(updater) { share.twitterUpdater[this.action] = updater; },
            get updater() share.twitterUpdater[this.action],

            set cache(cache) { share.twitterCache[this.action] = cache; },
            get cache() share.twitterCache[this.action],

            set delegator(delegator) { share.twitterDelegator[this.action] = delegator; },
            get delegator() share.twitterDelegator[this.action],

            get lastID() this.getLastID ? this.getLastID()
                : this.lastKey ? util.getUnicharPref(this.lastKey) : this._lastID,
            set lastID(id) this.setLastID ? this.setLastID(id)
                : this.lastKey ? util.setUnicharPref(this.lastKey, id) : this._lastID = id,

            get nameEscaped() $U.toEscapedString(this.name),

            createParams: function () {
                let params = {};
                if (this.params)
                    [for (kv of util.keyValues(this.params)) kv].forEach(
                        function ([k, v]) params[k] = v
                    );
                return params;
            },

            stop:
            function stop() {
                if (this.updater)
                {
                    this.updater.window.clearTimeout(this.updater.timer);
                    log(LOG_LEVEL_DEBUG, "Updater removed (%s)", this.name);
                }

                this.updater = null;
            },

            hasTwitterClient:
            function hasTwitterClient(win) {
                return win.KeySnail
                    && win.KeySnail.modules
                    && win.KeySnail.modules.plugins
                    && win.KeySnail.modules.plugins.twitterClient;
            },

            combineCache:
            function combineCache(aNew) {
                var aOld = this.cache;

                if (!aOld || (aOld && !aOld.length))
                    return aNew;

                if (share.twitterImmediatelyAddedStatuses.length)
                {
                    // remove immediately added statuses
                    var removeCount = aOld.indexOf(share.twitterImmediatelyAddedStatuses[0]) + 1;

                    if (removeCount > 0)
                        aOld.splice(0, removeCount);
                }

                share.twitterImmediatelyAddedStatuses = [];

                // search
                var oldid = aOld[0].id_str;
                var newStatusCount = aNew.map(function (status) status.id_str).indexOf(oldid);

                var newStatuses;

                if (newStatusCount === -1)
                    newStatuses = aNew; // all statuses in aNew is updated status
                else
                    newStatuses = aNew.slice(0, newStatusCount);

                var latestTimeline = newStatuses.concat(aOld);

                if (newStatuses.length && (pOptions["popup_new_statuses"] || pOptions["popup_new_replies"]))
                    popUpNewStatuses(newStatuses);

                return latestTimeline;
            },

            request:
            function request(context) {
                context = context || {};

                let { action } = this;

                if (context.params) {
                    let query = [for (kv of util.keyValues(context.params))
                                 if (typeof kv[1] !== "undefined")
                                 kv[0] + "=" + $U.encodeOAuth(kv[1])].join("&");
                    if (query.length)
                        action += (action.indexOf("?") < 0 ? "?" : "&") + query;
                }

                log(LOG_LEVEL_DEBUG, this.name + " => " + action);

                this.oauth.asyncRequest({
                    action: action,
                    method: "GET"
                }, function (ev, xhr) {
                    if (xhr.readyState !== 4)
                        return;

                    switch (xhr.status) {
                    case 200:
                        if (typeof context.ok === "function")
                            context.ok(xhr.responseText, xhr);
                        break;
                    default:
                        if (twitterAPI.ensureReauthorizationNotRequired(xhr))
                            context.ng(xhr.responseText, xhr);
                        break;
                    }
                });
            },

            update:
            function update(after, noRepeat, fromTimer) {
                this.pending = true;

                let self = this;

                let params = this.createParams();

                if (!this.cache)
                    params[this.countName] = this.beginCount;

                this.request({
                    params : params,
                    ok: function (res, xhr) {
                        self.pending = false;

                        let statuses = $U.decodeJSON(xhr.responseText);
                        self.cache   = self.combineCache(self.mapper ? self.mapper(statuses) : statuses);

                        if (self.lastIDHook)
                            self.lastIDHook();

                        if (self.interval && (!noRepeat && (!self.updater || fromTimer))) {
                            self.updater = {
                                window : window,
                                timer  : setTimeout(function () {
                                    self.update(null, false, true);
                                }, self.interval)
                            };

                            if (!self.delegator)
                                self.setDelegator();
                        }

                        if (typeof after === "function")
                            after();
                    },
                    ng: function (res, xhr) {
                        self.pending = false;
                        log(LOG_LEVEL_DEBUG,
                            self.name + " => Crawler#update: retry (noRepeat: %s, fromTimer: %s) %s => %s",
                            noRepeat, fromTimer, new Date(), xhr.responseText);
                        if (self.interval > 0 || twitterAPI.isRetryable(xhr)) {
                            setTimeout(function () {
                                self.update(after, noRepeat, fromTimer);
                            }, self.interval);
                        }
                    }
                });
            },

            updatePrevious: function (status, after) {
                this.pending = true;

                let self = this;

                let params = this.createParams();
                params[this.maxIDName] = status.id_str;
                params[this.countName] = this.beginCount;

                this.request({
                    params : params,
                    ok: function (res, xhr) {
                        self.pending = false;

                        let statuses = $U.decodeJSON(res);

                        if (statuses) {
                            statuses = self.mapper ? self.mapper(statuses) : statuses;
                            statuses.shift();
                            self.cache = self.cache.concat(statuses);
                        }

                        if (typeof after === "function")
                            after(statuses);
                    },
                    ng: function (res, xhr) {
                        self.pending = false;

                        if (twitterAPI.isRetryable(xhr)) {
                            log(LOG_LEVEL_DEBUG, self.name + " => Crawler#updatePrevious: retry %s", new Date());
                            self.updatePrevious(status, after);
                        }
                    }
                });
            },

            setDelegator:
            function setDelegator() {
                let self = this;

                self.delegator = true; // avoid duplication

                window.addEventListener("unload", function () {
                    self.stop();

                    for (let win of Notifier.getBrowserWindows())
                    {
                        try
                        {
                            if (win !== window && self.hasTwitterClient(win)) // exclude current window
                            {
                                if (typeof self.startNext === "function")
                                    self.startNext();
                                else
                                    self.update();

                                log(LOG_LEVEL_DEBUG, self.name + " => Delegated");

                                break;
                            }
                        }
                        catch (x)
                        {
                            log(LOG_LEVEL_WARNING, x);
                        }
                    }

                    window.removeEventListener("unload", arguments.callee, false);
                }, false);
            }
        };

        // OAuth {{ ================================================================= //

        var _oauthInfo = pOptions["oauth_info"] || {
            signatureMethod : "HMAC-SHA1",
            consumerKey     : "q8bLrmPJJ54hv5VGSXUfvQ",
            consumerSecret  : "34Xtbtmqikl093nzaXg6ePay5EJJMu0cm3qervD4",
            requestToken    : "https://twitter.com/oauth/request_token",
            accessToken     : "https://twitter.com/oauth/access_token",
            authorizeURL    : "https://twitter.com/oauth/authorize",
            authHeader      : "https://twitter.com/"
        };

        var gPrefKeys = {
            oauth_token        : "extensions.keysnail.plugins.twitter_client.oauth_token",
            oauth_token_secret : "extensions.keysnail.plugins.twitter_client.oauth_token_secret"
        };

        var _oauthTokens = {
            get oauth_token() util.getUnicharPref(gPrefKeys.oauth_token, ""),
            set oauth_token(v) util.setUnicharPref(gPrefKeys.oauth_token, v),
            get oauth_token_secret() util.getUnicharPref(gPrefKeys.oauth_token_secret, ""),
            set oauth_token_secret(v) util.setUnicharPref(gPrefKeys.oauth_token_secret, v)
        };

        var gOAuth = new OAuth(_oauthInfo, _oauthTokens);

        twitterAPI.requester = gOAuth;

        gOAuth.responsePeeker = function (xhr) {
            try {
                let headers = {};

                xhr.getAllResponseHeaders().split(/\r?\n/).forEach(function (h) {
                    let pair = h.split(': ');
                    if (pair && pair.length > 1)
                        headers[pair.shift()] = pair.join('');
                });

                if ("X-RateLimit-Remaining" in headers) {
                    let remain = +headers["X-RateLimit-Remaining"];
                    let limit  = +headers["X-RateLimit-Limit"];
                    let reset  = +headers["X-RateLimit-Reset"];

                    share.twitterAPIUsage.set(remain, limit, reset * 1000);
                }
            }
            catch (x) {}
        };

        // }} ======================================================================= //

        function normalizeCount(n) {
            if (n <= 0)
                n = 20;
            if (n > 200)
                n = 200;

            return n;
        }

        var gTimelineCountBeginning    = pOptions["timeline_count_beginning"];
        var gTimelineCountEveryUpdates = pOptions["timeline_count_every_updates"];

        gTimelineCountBeginning    = normalizeCount(gTimelineCountBeginning);
        gTimelineCountEveryUpdates = normalizeCount(gTimelineCountEveryUpdates);

        // Lists {{ ================================================================= //

        var gLists = {};

        pOptions["lists"].forEach(
            function (name) {
                let [user, listName] = name.split("/");

                // list
                let listAction = twitterAPI.get("lists/statuses", {
                    owner_screen_name : user,
                    slug              : listName
                });

                gLists[name] = new Crawler(
                    {
                        action     : listAction.action,
                        name       : name,
                        interval   : (pOptions["list_update_intervals"] && pOptions["list_update_intervals"][name])
                            || pOptions["list_update_interval"],
                        lastKey    : "extensions.keysnail.plugins.twitter_client.last_id." + name.replace("/", "_"),
                        oauth      : gOAuth,
                        countName  : "per_page",
                        lastIDHook : $U.bind(Notifier.updateAllListButtons, Notifier),
                        beginCount : gTimelineCountBeginning,
                        params     : {
                            include_rts: !!pOptions["list_include_rts"],
                            include_entities : true
                        }
                    }
                );
            });

        // }} ======================================================================= //

        // Searches {{ ============================================================== //

        var gTrackings = {};

        function addTrackingCrawler(query, infoHolder) {
            let params = { q : query },
                lang   = pOptions["tracking_langage"];
            if (lang) params[lang] = lang;
            let searchAction = twitterAPI.get("search", params);

            return gTrackings[query] = new Crawler(
                {
                    action       : searchAction.action,
                    name         : query,
                    interval     : infoHolder["interval"] || pOptions["tracking_update_interval"],
                    oauth        : gOAuth,
                    mapper       : function (response) response.statuses,
                    getLastID    : function () infoHolder["lastID"],
                    setLastID    : function (v) {
                        infoHolder["lastID"] = v;
                        persist.preserve(share.twitterTrackingInfo, "yatck_tracking_info");
                    },
                    lastIDHook   : $U.bind(Notifier.updateAllTrackingButtons, Notifier),
                    beginCount   : gTimelineCountBeginning,
                    params : {
                        include_rts: !!pOptions["list_include_rts"],
                        include_entities : true
                    }
                }
            );
        }

        if (!share.twitterTrackingInfo)
            share.twitterTrackingInfo = persist.restore("yatck_tracking_info") || {};

        for (let [name, info] of util.keyValues(share.twitterTrackingInfo))
        {
            if (!share.twitterTrackingInfo[name])
                share.twitterTrackingInfo[name] = {};

            addTrackingCrawler(name, share.twitterTrackingInfo[name]);

            // {
            //     "#emacs": {
            //         lastID   : "123432",
            //         interval : 1000 * 60 * 10
            //     }, ...
            // };
        }

        // }} ======================================================================= //

        var gStatuses = new Crawler(
            {
                action     : twitterAPI.get("statuses/home_timeline").action,
                name       : M({ en: "Timeline", ja: "タイムライン" }),
                interval   : pOptions["update_interval"],
                lastKey    : "extensions.keysnail.plugins.twitter_client.last_status_id",
                oauth      : gOAuth,
                lastIDHook : $U.bind(Notifier.updateAllStatusbars, Notifier),
                beginCount : gTimelineCountBeginning,
                params     : {
                    include_entities : true
                }
            }
        );

        var gMentions = new Crawler(
            {
                action     : twitterAPI.get("statuses/mentions").action,
                name       : M({ en: "mentions", ja: "言及一覧" }),
                interval   : pOptions["mentions_update_interval"],
                lastKey    : "extensions.keysnail.plugins.twitter_client.last_mention_id",
                oauth      : gOAuth,
                lastIDHook : $U.bind(Notifier.updateAllStatusbars, Notifier),
                beginCount : gTimelineCountEveryUpdates,
                params     : {
                    include_entities : true
                }
            }
        );

        var gDMs = new Crawler(
            {
                action     : twitterAPI.get("direct_messages").action,
                name       : M({ en: "DMs", ja: "DMs" }),
                interval   : pOptions["dm_update_interval"],
                lastKey    : "extensions.keysnail.plugins.twitter_client.last_dm_id",
                oauth      : gOAuth,
                mapper     : function (statuses) statuses.map(function (status) (status.user = status.sender, status)),
                lastIDHook : $U.bind(Notifier.updateAllStatusbars, Notifier),
                beginCount : gTimelineCountEveryUpdates,
                params     : {
                    include_entities : true
                }
            }
        );

        var gSentDMs = new Crawler(
            {
                action     : twitterAPI.get("direct_messages/sent").action,
                name       : M({ en: "Sent DMs", ja: "Sent DMs" }),
                interval   : pOptions["dm_update_interval"],
                oauth      : gOAuth,
                mapper     : function (statuses) statuses.map(function (status) (status.user = status.sender, status)),
                beginCount : gTimelineCountEveryUpdates,
                params     : {
                    include_entities : true
                }
            }
        );

        if (!share.twitterImmediatelyAddedStatuses)
            share.twitterImmediatelyAddedStatuses = [];

        // }} ======================================================================= //

        // Styles {{ ================================================================ //

        if (!share.ksTextLinkStyleRegistered)
        {
            style.register('                              \
                description.ks-text-link {                \
                    color           : #0800ab;            \
                    text-decoration : underline;          \
                    cursor          : pointer !important; \
                }                                         \
                                                          \
                description.ks-text-link:hover {          \
                    color : #616161;                      \
                }                                         \
                                                          \
                .ks-loading-message {                     \
                    text-align  : center;                 \
                    font-weight : bold;                   \
                    font-size   : 130%;                   \
                }');

            share.ksTextLinkStyleRegistered = true;
        }

        // }} ======================================================================= //

        // Actions {{ =============================================================== //

        var gTwitterCommonActions = [
            [function (status) {
                 if (status) tweet();
             }, M({ja: "つぶやく : ", en: ""}) + "Tweet",
             "tweet"],
            // ======================================== //
            [function (status) {
                 if (status) reply(status);
             }, M({ja: "このつぶやき => 返信 : ", en: ""}) + "Send reply message",
             "reply"],
            // ======================================== //
            [function (status) {
                 if (status)
                 {
                     if (status.raw && status.raw.user && status.raw.user.protected &&
                         !window.confirm(M({ ja: "このユーザはつぶやきを非公開にしています。それでも非公式 RT を行いますか？",
                                             en: "This user is protected. Are you sure to RT this tweet?"})))
                         return;

                     gPrompt.forced = true;
                     quoteTweet(status.screen_name, html.unEscapeTag(status.text));
                 }
             }, M({ja: "このつぶやき => コメント付き ", en: ""}) + "RT (QT): Quote tweet",
             "retweet,c"],
            // ======================================== //
            [function (status) {
                 if (status) retweet(status.id_str);
             }, M({ja: "このつぶやき => 公式 ", en: ""}) + "RT : Official Retweet",
             "official-retweet,c"],
            // ======================================== //
            [function (status) {
                 if (status) deleteStatus(status.id_str);
             }, M({ja: "このつぶやき => 削除 : ", en: ""}) + "Delete this status",
             "delete-tweet"],
            // ======================================== //
            [function (status) {
                 if (status) addFavorite(status.id_str, status.favorited);
             }, M({ja: "このつぶやき => お気に入りへ追加 / 削除 : ", en: ""}) + "Add / Remove this status to favorites",
             "add-to-favorite,c"],
            // ======================================== //
            [function (status) {
                 if (status) gBrowser.loadOneTab("http://twitter.com/" + status.screen_name
                                                 + "/status/" + status.id_str, null, null, null, false);
             }, M({ja: "このつぶやき => Twitter で見る : ", en: ""}) + "Show status in web page",
             "view-in-twitter,c"],
            // ======================================== //
            [function (status) {
                 if (status) copy(html.unEscapeTag(status.text));
             }, M({ja: "このつぶやき => クリップボードにコピー : ", en: ""}) + "Copy selected message",
             "copy-tweet,c"],
            // ======================================== //
            [function (status) {
                 if (status) display.prettyPrint(html.unEscapeTag(status.text), {timeout: 6000, fade: 200});
             }, M({ja: "このつぶやき => 全文表示 : ", en: ""}) + "Display entire message",
             "display-entire-message,c"],
            // ======================================== //
            [function (status) {
                 if (status) {
                     gPrompt.forced = true;
                     showTargetStatus(status.screen_name);
                 }
             }, M({ja: "このユーザ => 最近のつぶやき : ", en: ""}) + "Show Target status",
             "show-target-status,c"],
            // ======================================== //
            [function (status) {
                 if (status) sendDM(status.screen_name, status.id_str);
             }, M({ja: "このユーザ => ダイレクトメッセージ (DM) を送信 : ", en: ""}) + "Send Direct Message (DM)",
             "send-direct-message"],
            // ======================================== //
            [function (status) {
                 if (status) showFavorites(status.user_id);
             }, M({ja: "このユーザ => ふぁぼり一覧を表示 : ", en: ""}) + "Show this user's favorites",
             "show-user-favorites"],
            // ======================================== //
            [function (status) {
                 if (!status) return;
                 showLists(status.screen_name);
             }, M({ja: "このユーザ => リストを一覧表示 : ", en: ""}) + "Show selected user's lists",
             "show-selected-users-lists"],
            // ======================================== //
            [function (status) {
                 if (status) addUserToBlacklist(status.screen_name);
             }, M({ja: "このユーザ => ブラックリストへ追加 : ", en: ""}) + "Add this user to the blacklist",
             "add-user-to-blacklist,c"],
            // ======================================== //
            [function (status) {
                 if (status) showMentions();
             }, M({ja: "自分に関連したつぶやき @ を一覧表示 : ", en: ""}) + "Show mentions",
             "show-mentions"],
            // ======================================== //
            [function (status) {
                 if (status) self.showDMs();
             }, M({ja: "自分宛の DM を一覧表示: ", en: ""}) + "Show DMs",
             "show-dms"],
            // ======================================== //
            [function (status) {
                 if (status) self.tweetWithTitleAndURL();
             }, M({ja: "現在のページのタイトルと URL を使ってつぶやく : ", en: ""}) + "Tweet with the current web page URL",
             "tweet-current-page"],
            // ======================================== //
            [function (status) {
                 if (status) search();
             }, M({ja: "単語を検索 : ", en: ""}) + "Search keyword",
             "search-word"],
            // ======================================== //
            [function (status) {
                 if (status) openAllURLs(status.raw);
             }, M({ja: "メッセージ中の URL を開く : ", en: ""}) + "Visit URL in the message",
             "open-url,c"],
            // ======================================== //
            [function (status) {
                 if (status.raw.in_reply_to_status_id_str)
                     showConversations(status.raw.in_reply_to_status_id_str, status.raw);
                 else
                     display.echoStatusBar("Oops. No conversations found.", 2000);
             }, M({ja: "会話を表示 : ", en: ""}) + "Show conversations",
             "show-conversations,c"],
            [function (status) {
                $U.delayed(function () { self.showTimeline(); });
             }, M({ja: "更新 / TL へ戻る", en: "Refresh / Display TL"}),
             "refresh-or-back-to-timeline"],
            [function (status) {
                 switchTo();
             }, M({ja: "移動 (リスト, Home, Mentions, ...)", en: "Switch to (Lists, Home, Mentions, ...)"}),
             "switch-to"],
            [function (status) {
                if (gStatuses.updater) {
                    gStatuses.stop();
                } else {
                    gStatuses.update(0, false, false);
                }
             }, M({ja: "home timeline の自動読み込みきりかえ", en: "Toggle auto-update of home timeline"}),
             "toggle-homeline-updating"]
        ];

        // }} ======================================================================= //

        // Prompt handling {{ ======================================================= //

        let gPrompt = {
            get visible() !document.getElementById("keysnail-prompt").hidden,
            forced : false,
            close  : function () {
                if (!gPrompt.forced)
                    return;

                gPrompt.forced = false;

                if (gPrompt.visible)
                    prompt.finish(true);
            }
        };

        // }} ======================================================================= //

        if (!share.twitterClientSettings)
        {
            share.twitterClientSettings = {};
            share.twitterClientSettings.blackUsers = persist.restore("blackusers") || [];
        }

        // Black user handling {{ =================================================== //

        var gBlackUsers = share.twitterClientSettings.blackUsers;

        function addUserToBlacklist(id) {
            if (gBlackUsers.indexOf(id) >= 0)
            {
                display.echoStatusBar("%s is already in the blacklist", id);
                return;
            }

            if (!util.confirm("Add user to the blacklist",
                              util.format("Are you sure to add \"%s\" to blacklist?", id)))
                return;

            gBlackUsers.push(id);

            let msg = util.format("added %s to the black list", id);
            log(LOG_LEVEL_DEBUG, msg);
            display.echoStatusBar(msg);

            persist.preserve(gBlackUsers, "blackusers");
        }

        function blackUsersManager() {
            if (!gBlackUsers.length)
                return;

            let collection = gBlackUsers;
            let modified   = false;

            prompt.selector(
                {
                    message    : M({ja: "ユーザの管理", en: "Manage users"}) +
                        " [ j/k: scroll | d: delete from blacklist | q: quit manager ] :",
                    collection : collection,
                    onFinish   : function () { if (modified) persist.preserve(gBlackUsers, "blackusers"); },
                    keymap     : {
                        "C-z"   : "prompt-toggle-edit-mode",
                        "SPC"   : "prompt-next-page",
                        "b"     : "prompt-previous-page",
                        "j"     : "prompt-next-completion",
                        "k"     : "prompt-previous-completion",
                        "g"     : "prompt-beginning-of-candidates",
                        "G"     : "prompt-end-of-candidates",
                        "q"     : "prompt-cancel",
                        // local
                        "d"    : "delete-this-user-from-blacklist"
                    },
                    actions : [
                        [function (i) {
                             if (i < 0)
                                 return;

                             let name = collection[i];

                             if (util.confirm("Delete user from blacklist",
                                              util.format("Are you sure to delete \"%s\" from blacklist?", name)))
                             {
                                 collection.splice(i, 1);
                                 prompt.refresh();
                                 modified = true;

                                 display.echoStatusBar(util.format("%s is deleted from the blacklist", name));
                             }
                         },
                         "Delete this user from blacklist",
                         "delete-this-user-from-blacklist,c"]
                    ]
                });
        }

        // }} ======================================================================= //

        // Element / Menu {{ ======================================================== //

        function applyMenu(aMenu, aMenuSeed) {
            function genMenuItem([label, accessKey, command, checked]) {
                let item;

                if (command instanceof Array) {
                    item = $U.createElement("menu", {
                        "label"     : label,
                        "accesskey" : accessKey
                    }, [
                        $U.createElement("menupopup", null, command.map(genMenuItem))
                    ]);
                } else if (label) {
                    item = $U.createElement("menuitem", {
                        "label"     : label,
                        "accesskey" : accessKey
                    });

                    if (command)
                        item.setAttribute("oncommand", command);
                    else
                        item.disabled = true;
                } else {
                    item = $U.createElement("menuseparator");
                }

                if (typeof checked === "boolean")
                    item.setAttribute("checked", checked);

                return item;   // menu, menuitem, menuseparator
            }

            aMenuSeed.forEach(function (r) { aMenu.appendChild(genMenuItem(r)); });

            return aMenu;
        }

        function createMenu(aMenuSeed) {
            return applyMenu($U.createElement("menupopup"), aMenuSeed);
        }

        // }} ======================================================================= //

        // Statusbar {{ ============================================================= //

        const TWITTER_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A' +
            '/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9oFFg04EbcUHYAAAAKWSURBVDjL' +
            'jZNNSFRRHMV/974Zv7WmMUapxbgpywyiNloUFbQKrGbRMlxFRIuIJArcSNhKSjctcqfSJy1qYRRB' +
            'iOUE1limE2aOIqnlzDgfjqPz3vu3GJ0iCzpwuHC59/zPOZcLq+jo6PCMjo7cmJ+beTc/N+sfGxu7' +
            '3NTUVML/wOfzFUTC4W4RkYklkellERGRvr6+6/8l0NPTc1BsK/EmKnJp2JRrI6aMpUTSycT0jdbW' +
            'XQChUCivv7/f8eddDVBWWlKZMa2irylIWRDNwNekkF9UWHn+3Nnby6nFx55y96Od1dvvfw4GL7S0' +
            'tJSuCTgALNsWREQrMBRoBdEVm6m0oSlw7bdtEA1lZSVs2+Q+eaKhYVswGLzY3d1trrOkAKeCwRgE' +
            '4lZu3xbI1+DbalBbvf1MTU3NQ+CV/lcvpmTjrDFtw0waPsUBbZRucrmqchH+hAAFOjtRfnPgyVfs' +
            'dYFtZpKjweD0XwVkdfoBl+KwW2Hav0QKHYp8a8W8e+9BT1dX15ucgKE1wq+DIlBswEanWueur3/g' +
            '6a329uZwOLyYe8ZYPJ40lLIKVxtRCoIJmE3Dsg1LVpYrNtTX1x1qb791ek3QAPB6vfaxo0d8OBwb' +
            'hhayPmIZGE5AIC68XRD8UWEoJlSUOAprtnj2xOKJl36/f1YDtLW1jQ8Ghp7sKIY6t8YUsIBIRphM' +
            'CVMpYXpJ+JAQBsKA1hW7a2trcxEA7nR23oyE59+fqlQcrzRwOxVOBXk6S4cGlxOqikEjmYlQKLau' +
            'oMbGxn2TExOvRUTitsjnlMjHhMhwIrtOprOfzD8w8Mzr9W7OdbCGQCDw7cv4eO9iMvkjTyxHubaW' +
            'PHn2wkZJR1yyHM1Evs89f/Gi98rVq82jIyMhgJ++3VNmULtdEQAAAABJRU5ErkJggg==';

        const MENTIONS_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0' +
            'U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAG/SURBVDjLjZK9T8JQFMVZTUyc3IyJg4mD' +
            'i87+GyYu6qB/gcZdFxkkJM66qJMGSNRBxDzigJMRQ1jQ4EcQ+SgVKB+FtuL13EdJxNDq8Ev7Xu85' +
            '797T51nwhqeAH5w6cAxWwDgReX7jwYfdaCIraroptB7NLlVQrOoiGEsL1G06GZyxuILicsMUH3VT' +
            'lOqGKNUMUdTacj+j1Nng0NGAT2WxYosK1bbIVVoiW27J9V8G57WWKVSczMV5iK+Tudv1vVh5yXdl' +
            'LQN+os4AFZss2Ob82CCgQmhYHSnmkzf2b6rIhTAaaT2aXZALIRdCLgRtkA1WfYG4iKcVYX52JIs7' +
            'EYvFmJ8wGiEXQi6EXAhdyn2MxQaPcg68zIETTvzyLsPzWnwqixVbhFwI3RFykes+A9vkIBKX4jCo' +
            'IxdCLrI4/0OcUXXK4/1dbbDBS088xGGCCzAJCsiF2lanT8xdKNhHXvRarLFBqmcwCrbAhL32+kP3' +
            'lHguETKRsNlbqUFPeY2OoikW62DNM+jf2ibzQNN0g5ALC75AGiT59oIReQ+cDGyTB+TC4jaYGXiR' +
            'XMTD3AFogVmnOjeDMRAC025duo7wH74BwZ8JlHrTPLcAAAAASUVORK5CYII=';

        const HOME_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAY1BMVEUAAAB7QylRU1AsbCZAcDxR' +
            'bUuVYDQ+gDhub221by56fHmmdkO4dy5OlUJcj1WwfTi7gTOKioi6hT5XplK3jlrGkU7ElVaanJlw' +
            'tWOkpqOqrKnSq3ODxHany6HJy8ja2tfu8O0sQw6vAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgA' +
            'AAAJcEhZcwAACxMAAAsTAQCanBgAAACLSURBVBjTbc/bDoMgEEVRLBXtACJXL2CZ///KjvWhNO15' +
            'WzsTEhj7v4dSqrWKOcf52zkn1zg6l3IyjWt1IQdxeo50/ESsUgYpPqYiZBAdlWQqvle704wZizgC' +
            'AKLtrlcpwLJQANaEjcJ42U8HwrZZPLzWxLWsE8K+21pK8Zx5Pdz70dJu/TBw/vPvFwypDHUFCMVW' +
            'AAAAAElFTkSuQmCC';

        const FAVORITED_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0' +
            'U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLlZLNS5RRFMafe9/3vjPOjI1j' +
            'aKKEVH40tGgRBWEibfoPQoKkVdtoEQQF4T/QqkVtWrSTFrVsF1FgJbWpIAh1k2PNh+PrfL4f95zT' +
            'Qk0HHKkDD/cc7vP8uHCuEhF0q/KnmXNgGR248PZFN4/GISXMC8L89DBPV0Dp4/SsazJjrtfb9/vd' +
            'xfn/BgjzY5M8Aq8nBya+V3h93vtnQHFxat4kszntJAAAxus1YvnZQV5V/jyTEZarwnwFLGeFZdT0' +
            'ZFOJdD84qoCDOpQ7grZfRNj020JSEOKvwvxGiF+q0tL0N5PuO+Mk0nC0B0BDsYCCImyzAIktBBlo' +
            'MwKJLSgKYcMAcdhC2KpVlIig+H5qxcv0n0xmj4Gbq+BwC2wtJLbgHUlMEFJwUpMIGpto16u+kJzS' +
            'ACAk+WCzvNbe+AVljkOYIcQQou3TbvdOJo+g4aNdqzaF+PT43HJVA8DQpcVIiPPtaqlEUQzlDELs' +
            'TpgYwgTAQIjQqlUCtpQfn1spdmxh+PJSQyw9CrbKgM7tvcISQAxlBhC3GuCYXk3cWP25m3M7dk88' +
            'qbWBRDVApaATOSjPBdXXwYEP5QyCgvjE/kwHgInHtHYBnYA2owhrPiiuw0sOw3EZFEagIB7qChDi' +
            'YaUcNIoFtP1KxCTPhWiDw7WbXk9vKpnOgsI4exjg6Mbq96YQPxm79uPOvqvbXx4O3KrF6w8osv2d' +
            'f17kr5YXJq7vnw/S0v3k7Ie7xtud/wAaRnP+Cw8iKQAAAABJRU5ErkJggg==';

        const REFRESH_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAAj9JRE'+
            'FUOMuNk9tL02Ecxgf7M2J20JJCurBC1jnLZC1PZAatNl/XdOShgWXOxZr+3NyhHdxJzbFhSUYl'+
            '/MBohGW1jQ3XYfkj6No7EbwN756+G104/WG7eG/ew/M87/PhKwEg+d+68bxxsGVaIRU7k5Qi0D'+
            'RVLyjGL0R2Fej7rJXdXdQYdG9Vcc182/rNF824FlWiIVwH/ct2dDxT4aT5uE9UoHepQ65/r+a5'+
            'pBH+rAORn0FEV0KYyvkQ/PoE3uUxjKUsaA01oqq3crRIoOdDu6zr3S3es2zF7K9pTP7w4mnOj9'+
            'A3N3xZO1xpDtaUGY+/GHHVXY+DugPOIgGKbDB/eoAZYRKRXBDujA26OTXO2+T5yDg2cBRNPgWu'+
            'uOpQod0X2PEF9evWuCNpKTg6Uxwuuc6snuVq3FsvVXaWC+Vsb0y0xOszDWvU8ia1/KfWfmrjtO'+
            'UEt/3Sfk2ZqUy1R0pmjJAyQsqUgYuMzJiEWmaXPecYRWYUmVFk1p/ukhoSd0zbhciMI7ONf2ab'+
            'ZLYmyp2QxgipsHWPkLrJbNWTthEVOwYW7uX7ie94TEgD1owJw4mHoMigyKDI6H6jhSvJFZA60i'+
            'Nom2jOIzUUPSakTi5lxNzvaAFpTJgoQjqSGCog1c7expHuQzwhlRUJENLRRx/7EVsJF5CGv3sx'+
            'nnXClbFieGkIPfM6tPiVOKyv4AmpXHQWKLKvj++E/hXLIwUhRY2pGtX3q9YpcpyQGgipbNdhyg'+
            '8OtSyUMmiim4RUSkgHSxH4C4SsiJno6owoAAAAAElFTkSuQmCC';

        const TAG_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0' +
            'U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHpSURBVDjLhZNbbxJhEIb3T/RWw78g2fjL' +
            'vLE2ppe1TYNtvGuNRo6BcA4kIBBOgXCU3QXploCAmNQE/VY55PWbj7CWcPBibuab95l3ZmelZrOJ' +
            'RqOBWq2GarWKSqWCcrmMUqmEYrF4BEA6FFK9XsdyudyKfr8vILlc7iBEos4k6PV6orOu6yaEctwF' +
            '0un0XohElqmYulGiUCiUptMp5vO5yBMwm80ikUjshEjUdV3IxX+45Z5hGPj29RcykbF463a7SKVS' +
            'iMfjWxCJOq8tLxYLkPj72MCbEw3nz1WkwytIp9MhF4hEIhsQic/IJpOJKJrNZqKz7aWGm7Mu3l/q' +
            'uDppmxBN08gFAoGACZHy+fwzPiMbj1dFSvVBdL49v8PHq/stiKqq5AJer1dABCWTych8RjYajURR' +
            'u/EDtmMV7y7+QWzHGj4FV++tVotcwO12H5mzJJNJmc/IhsPhFuSDTcfb0w6uTz/zr7MQLkKhEJxO' +
            '59ONjfL55FgsxgaDgQm5fKHg+lUbtxdt/Jwaj8UWc4THEY1G5XA4zOgSxeLqD7h5/QW/jbkpdjgc' +
            'FnOJu44jGAzKfr+f0SWuPzGJeX5DvBdA4fP5rHzTjA5MUZSd4oMACo/HY3W5XIzEdrvdsvOU//e7' +
            '8q5WLn6y7/0viZYv/mL7AwwAAAAASUVORK5CYII=';

        const LIMIT_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAAn9JREFU' +
            'OMttUkFrE0EYfZukSRObGLU1NEpNm2hBQcRbPQiCPYjiQb15U1CEQE7tsQdz7K/wkCIeevYHiAWp' +
            'WtBGE5uWNCiUFJMmpkl2dmZ9s2vatTrwMTPffN+b996MYds2vGNpaWlEKTUnpZxhnGSA8ZOxYlnW' +
            'Yi6X++WtN7wAhULhCpuXk8nkZCwWg8/nA/fo9Xqo1+vY4iDQvfn5+bV/ANg8wsOP6XQ6Y5omarUa' +
            'Op2Ovh2BQACJRMKpKxaLG8xdXlhY6Oq9b4DE5LPx8fGMEALlcnmz3W6nuA7q0OtSqfRDA5NdhlKy' +
            'g77AYMHkTCQSQaVSAZvuZLPZqkdqNZ/P36xWq8VUKuXU/g9gTGvmbXq9hSND5zQ7XUO2Y395sP3m' +
            'kb1SmcbOXtjRfPfSKvy2gC0t2JYbQki8WLvqmJoYbuD2mVVMP/lguAwI8uD+DRi0xPCHOd8ClEF+' +
            'w/qQBglIq43nsx3mhdOy8fLtoQR9ky60dl8hEBqFYYywcAgIx5lWwP4eZOsbzO53KGsf4cksbLPv' +
            'ASBFKH2Tieb6e+o8hvjFa6i9XmT/aUxcn0Xz6zoBGoimTpCwhC1ML4BwZNikGp++AF9wlO4oyL7E' +
            'p90wJmAinp5ErxNi7b7DagDg/AOb7mpUrbXxeY0s3vHEguop9LukapNZ6Qua5W1XrlJOzyEDvdGo' +
            'lBA/n4I/cooAJqYePsWUYENrB8fTSQRbQy4Dyj0CYDqoytIerBMgCgzTyECQeQ3QRLdRh+i0EZ2I' +
            '0W7lyvYCaAmhs48RPueHEQy5T+jjSyhKM7uIdttU2CdR6fqljT8A4JNsLs+5XjgfR/wJ62DmD3M/' +
            'lpTuWgNx/AZysrLNh2/BRQAAAABJRU5ErkJggg==';

        const MESSAGE_ICON = 'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0' +
            'U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAITSURBVBgZpcHLThNhGIDh9/vn7/RApwc5' +
            'VCmFWBPi1mvwAlx7BW69Afeu3bozcSE7E02ILjCRhRrds8AEbKVS2gIdSjvTmf+TYqLu+zyiqszD' +
            'MCf75PnnnVwhuNcLpwsXk8Q4BYeSOsWpkqrinJI6JXVK6lSRdDq9PO+19vb37XK13Hj0YLMUTVVy' +
            'WY//Cf8IVwQEGEeJN47S1YdPo4npDpNmnDh5udOh1YsZRcph39EaONpnjs65oxsqvZEyTaHdj3n2' +
            'psPpKDLBcuOOGUWpZDOG+q0S7751ObuYUisJGQ98T/Ct4Fuo5IX+MGZr95jKjRKLlSxXxFxOEmaa' +
            'N4us1Upsf+1yGk5ZKhp8C74H5ZwwCGO2drssLZZo1ouIcs2MJikz1oPmapHlaoFXH1oMwphyTghy' +
            'Qj+MefG+RblcoLlaJG/5y4zGCTMikEwTctaxXq/w9kuXdm9Cuzfh9acujXqFwE8xmuBb/hCwl1GK' +
            'AnGccDwIadQCfD9DZ5Dj494QA2w2qtQW84wmMZ1eyFI1QBVQwV5GiaZOpdsPaSwH5HMZULi9UmB9' +
            'pYAAouBQbMHHrgQcnQwZV/KgTu1o8PMgipONu2t5KeaNiEkxgAiICDMCCFeEK5aNauAOfoXx8KR9' +
            'ZOOLk8P7j7er2WBhwWY9sdbDeIJnwBjBWBBAhGsCmiZxPD4/7Z98b/0QVWUehjkZ5vQb/Un5e/DI' +
            'sVsAAAAASUVORK5CYII=';

        const SEARCH_ICON =
            'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0' +
            'U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJGSURBVDjLjdJLSNRBHMDx78yqLZaKS75D' +
            'PdgDDaFDbdJmde5QlhCJGxgpRJfqEEKnIsJLB7skQYQKZaSmdLaopPCgEvSCShCMzR5a7oq7/3l1' +
            '2RVtjfzBMA/4fWZ+MyOccwBM3g8HEbIdfCEhfAFnLVapOa28Uevpjrqz/WOsERJgsu9Uq5CZQzgq' +
            'rJfo9BajNd5irEYn4p3OUiFExtCLmw2tawFi4l5zUMjMIau9u7K+qxeoAcoAA0wDb2OPwmfA16Li' +
            'iaOHLj1edRLpkO3WmIis7+oBDgJbgQ2AH6gC6jY19N62RkcctKeVIJAhp9QgUA3kJXdONZVcq9Jx' +
            'PSgQoXRAyIDRth8oAXQyKdWnoCKrTD9CBv4GMqx1WGNZkeRWJKbG2hiD1Cb9FbTnzWFdY/LCdLKl' +
            'gNQ84gyNKqHm0gDjqVHnxDHgA/B9RQkpaB6YklkZl62np9KBhOqwjpKFgeY2YAz4BESBWHI8Hhs6' +
            'PVVSvc3v98ye4fP7T676B845nt040ip98qpWJmI9PWiU6bfWgXGN2YHcKwU7tsuc4kpUPMbU0+f8' +
            '+vKt+Pitl7PLAMDI9cNBoB0hQwICzjqUp6MZvsy8yvp95BRuQUjJ75mPvH4wYo1NlJ64Mza7DPwr' +
            'hi8cCOeXl/aUB4P4c/NJxKLMvpngycCrzxVFG2v/CwAMnguF80oLe8p27cQh+fnpPV/fTc95S6pi' +
            'XQDAw7a9YbWkezZXFbAwMx/xPFXb1D3+Y90AQF/L7kAsri9mZ4lrTd0TcYA/Kakr+x2JSPUAAAAA' +
            'SUVORK5CYII=';

        const SEARCH_ADD_ICON =
            'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0' +
            'U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJnSURBVDjLpZLvSxNxHMf9C3rqw6QHcVaI' +
            'KHVEKQQuVtuaOrelbldTj5mrliQjYUtreqUrbYaObf6k9oOmTAIz8TbS6c7FdqPChBCLIq64hz0+' +
            'Pn2/MaI6C6EHLziO7+f1eX8+328RABT9Dz8/+LCJ5CNUnI9YxHy0TeLDLVJ2xixujBvj6TEd+U8B' +
            'HzHT+ahF4MMUn51pcmYmjMRG0EBsBPROLmDkOZ9RWPXW0rsKcGdcnHvczOQ/fitFNCDsiMsIDeJA' +
            'ylvLpLw6ITmgliUpyoWpeC5E8egggbiE6EY4EF2ITkQzomRlSMsnBtTxXRJcFLPTjU50qB5xo1B8' +
            'vVCMU3QgahKMypkc0IgyQT7SImXGjbi77ZeuP0awPjOBZd4Ipmg9LN9SEslBrSQfIWSROL8eC6yF' +
            'wqsFWfuFOQOENydAN6mC5zcVRIJRywWZqWaR8zXgEZSFwo7Wp41AxRrAsXgFJl+Ngm22FWo8VVDt' +
            'xjv8Q5D2G9A96/ESSxAGBI0jT732QSA/Asy6Cx68vAuetBuOdpfLBamROnJtVC+sDGvxNe5HnMKR' +
            'NWMKoCMUeLh+aArqoNJRBmX2Upi3n2yUPaQX987Rq8O1QnJQw7N9Z5xLPaeJRZeCwJFvr7qgousI' +
            'fMr6YWftPrBuLcy2Hy+WPWW2/yyJiLOMWsTLYvtUEo5c3nkYDtkOwpfNR/B1KwTvlnsh1lYlRVuO' +
            'Ff8m+Bvz16rNK0Pn4f36MAhvpuED9xAyQQvcURLbexJg5jpOmNm+OthacMHbhR5IeQ0Qs5I7exZg' +
            'ntBkU8hU+XmpV4lGILdDVMU+/P87L+2y1u3sopMAAAAASUVORK5CYII=';

        const CONTAINER_ID      = "keysnail-twitter-client-container";
        const UNREAD_STATUS_ID  = "keysnail-twitter-client-unread-status";
        const UNREAD_MENTION_ID = "keysnail-twitter-client-unread-mention";
        const UNREAD_DM_ID      = "keysnail-twitter-client-unread-dm";

        var statusbar           = document.getElementById("status-bar");
        var statusbarPanel      = document.getElementById("keysnail-status");
        var container           = document.getElementById(CONTAINER_ID);
        var unreadStatusLabel   = document.getElementById(UNREAD_STATUS_ID);
        var unreadMentionLabel  = document.getElementById(UNREAD_MENTION_ID);
        var unreadDMLabel       = document.getElementById(UNREAD_DM_ID);

        var unreadStatusLabelStyle = pOptions["unread_status_count_style"];

        // create statusbar icon
        if (!container) {
            // create a new one
            container = $U.createElement("statusbarpanel", {
                align : "center",
                id    : CONTAINER_ID
            });

            let box, icon;

            // ================================================== //
            // Statuses
            // ================================================== //

            box = $U.createElement("hbox", {
                align : "center",
                flex : 1
            }, [
                icon = $U.createElement("image", {
                    src : TWITTER_ICON
                }),
                unreadStatusLabel = $U.createElement("label", {
                    id    : UNREAD_STATUS_ID,
                    flex  : 1,
                    value : "-"
                })
            ]);

            container.appendChild(box);

            // ================================================== //
            // Mentions
            // ================================================== //

            box = box.cloneNode(true);
            box.childNodes[0].setAttribute("src", MENTIONS_ICON);
            unreadMentionLabel = box.childNodes[1];
            unreadMentionLabel.setAttribute("id", UNREAD_MENTION_ID);
            container.appendChild(box);

            // ================================================== //
            // DMs
            // ================================================== //

            box = box.cloneNode(true);
            box.childNodes[0].setAttribute("src", MESSAGE_ICON);
            unreadDMLabel = box.childNodes[1];
            unreadDMLabel.setAttribute("id", UNREAD_DM_ID);
            container.appendChild(box);

            // ================================================== //

            $U.insertAfter(statusbar, container, statusbarPanel);

            let menu = my.twitterClientStatusBarMenu = createMenu([
                [M({ja: "お気に入り一覧", en: "Display favorites"}), "f",
                 Commands.execExt("twitter-client-show-favorites")],
                [M({ja: "自分のステータス一覧", en: "Display my statuses"}), "m",
                 Commands.execExt("twitter-client-show-my-statuses")],
                [M({ja: "自分のリスト一覧", en: "Display my lists"}), "l",
                 Commands.execExt("twitter-client-show-my-lists")],
                [M({ja: "ブラックリストの管理", en: "Launch blacklist manager"}), "b",
                 Commands.execExt("twitter-client-blacklist-manager")],
                [M({ja: "再認証", en: "Reauthorize"}), "r",
                 Commands.execExt("twitter-client-reauthorize")]
            ]);

            container.appendChild(menu);
        }

        [[unreadStatusLabel  , function () { self.showTimeline(); }],
         [unreadMentionLabel , function () { self.showMentions(); }],
         [unreadDMLabel      , function () { self.showDMs(); }]]
            .forEach(function ([label, action]) {
                label.setAttribute("style", unreadStatusLabelStyle);
                label.parentNode.onclick = function (ev) {
                    if (ev.button === 2)
                        my.twitterClientStatusBarMenu.openPopupAtScreen(ev.screenX, ev.screenY, true);
                    else
                        action();
                };
            });

        // }} ======================================================================= //

        // Header {{ ================================================================ //

        const HEAD_CONTAINER_ID  = "keysnail-twitter-client-head-container";
        const HEAD_USER_ICON     = "keysnail-twitter-client-user-icon";
        const HEAD_USER_INFO     = "keysnail-twitter-client-user-info";
        const HEAD_USER_NAME     = "keysnail-twitter-client-user-name";
        const HEAD_USER_TWEET    = "keysnail-twitter-client-user-tweet";

        const HEAD_API_USAGE = "keysnail-twitter-client-api-usage";
        const HEAD_REFRESH_BUTTON = "keysnail-twitter-client-refresh-button";

        const HEAD_USER_BUTTON_HOME    = "keysnail-twitter-client-user-button-home";
        const HEAD_USER_BUTTON_TWITTER = "keysnail-twitter-client-user-button-twitter";

        const HEAD_MENU         = "keysnail-twitter-client-header-menu";
        const HEAD_DYNAMIC_MENU = "keysnail-twitter-client-header-dynamic-menu";

        const HEAD_LIST_ORIGIN   = "keysnail-twitter-client-header-search-origin";
        const HEAD_SEARCH_ORIGIN = "keysnail-twitter-client-header-list-origin";
        const HEAD_ADD_SEARCH    = "keysnail-twitter-client-header-add-search";
        const HEAD_CRAWLER_BUTTON_CONTAINER = "keysnail-twitter-client-header-crawler-button-container";

        if (!my.twitterClientHeader)
        {
            let tooltipTextTwitter     = M({ja: "このユーザの Twitter ページへ", en: "Visit this user's page on twitter"});
            let tooltipTextHome        = M({ja: "このユーザのホームページへ", en: "Visit this user's homepage"});
            let tooltipTextRefresh     = M({ja: "更新", en: "Refresh"});
            let tooltipTextClose       = M({ja: "閉じる", en: "Close"});
            let tooltipTextAddTracking = M({ ja: 'トラッキングワードを追加', en: 'Add new tracking word' });

            let labelTimeline = M({ja: "タイムライン", en: "Timeline"});

            if (!share.ksYatckStyleRegistered)
            {
                style.register(_.template('                           \
                    #yatck-header {                                   \
                        margin-left  : 4px;                           \
                        margin-right : 4px;                           \
                        overflow:auto;                                \
                    }                                                 \
                                                                      \
                    #<%= HEAD_USER_NAME %> {                          \
                        font-weight : bold;                           \
                        margin      : 0px 4px;                        \
                    }                                                 \
                                                                      \
                    #<%= HEAD_USER_ICON %> {                          \
                        border-left   : 1px solid ThreeDShadow;       \
                        border-top    : 1px solid ThreeDShadow;       \
                        border-right  : 1px solid ThreeDHighlight;    \
                        border-bottom : 1px solid ThreeDHighlight;    \
                        width         : 46px;                         \
                        height        : 46px;                         \
                        margin-left   : 4px;                          \
                        margin-right  : 4px;                          \
                    }                                                 \
                                                                      \
                    #<%= HEAD_USER_TWEET %> {                         \
                        background-color : white;                     \
                        height           : 50px;                      \
                        margin           : 0 4px 4px 4px;             \
                        border-left      : 1px solid ThreeDShadow;    \
                        border-top       : 1px solid ThreeDShadow;    \
                        border-right     : 1px solid ThreeDHighlight; \
                        border-bottom    : 1px solid ThreeDHighlight; \
                        resize           : vertical;                  \
                        overflow         : auto;                      \
                    }                                                 \
                                                                      \
                    #yatck-header toolbarseparator {                  \
                        height  : 16px;                               \
                        margin  : 0 4px;                              \
                        padding : 0;                                  \
                    }                                                 \
                                                                      \
                    #yatck-header toolbarseparator[id] {              \
                        margin : 0 2px;                               \
                    }')({
                  HEAD_USER_NAME  : HEAD_USER_NAME,
                  HEAD_USER_ICON  : HEAD_USER_ICON,
                  HEAD_USER_TWEET : HEAD_USER_TWEET
                }));

                share.ksYatckStyleRegistered = true;
            }

            let containerXML = '<vbox id="yatck-header">                                                                                       \
                    <hbox align="center" flex="1">                                                                                             \
                        <description id="' + html.escapeTag(HEAD_USER_NAME) + '" />                                                            \
                        <spacer flex="1" />                                                                                                    \
                        <!-- misc -->                                                                                                          \
                        <toolbarbutton label="Home"                                                                                            \
                                       image="' + html.escapeTag(TWITTER_ICON) + '"                                                            \
                                       oncommand="' + html.escapeTag("KeySnail.modules.prompt.finish(true);" + root + ".showTimeline();") + '" \
                                       />                                                                                                      \
                        <toolbarbutton label="Mentions"                                                                                        \
                                       image="' + html.escapeTag(MENTIONS_ICON) + '"                                                           \
                                       oncommand="' + html.escapeTag("KeySnail.modules.prompt.finish(true);" + root + ".showMentions();") + '" \
                                       />                                                                                                      \
                        <toolbarbutton label="Favorites"                                                                                       \
                                       image="' + html.escapeTag(FAVORITED_ICON) + '"                                                          \
                                       oncommand="' + html.escapeTag(root + ".showFavorites();") + '"                                          \
                                       />                                                                                                      \
                        <toolbarbutton label="DM"                                                                                              \
                                       image="' + html.escapeTag(MESSAGE_ICON) + '"                                                            \
                                       oncommand="' + html.escapeTag(root + ".showDMs();") + '"                                                \
                                       />                                                                                                      \
                        <toolbarseparator />                                                                                                   \
                        <!-- limit -->                                                                                                         \
                        <image src="' + html.escapeTag(LIMIT_ICON) + '" style="margin-right: 4px;"/>                                           \
                        <description style="margin:auto 4px;" id="' + html.escapeTag(HEAD_API_USAGE) + '" />                                   \
                        <toolbarseparator />                                                                                                   \
                        <!-- misc -->                                                                                                          \
                        <toolbarbutton tooltiptext="' + html.escapeTag(tooltipTextClose) + '" class="tab-close-button"                         \
                                       oncommand="KeySnail.modules.prompt.finishhtml.escapeTag(true);" />                                      \
                    </hbox>                                                                                                                    \
                    <hbox id="' + html.escapeTag(HEAD_CRAWLER_BUTTON_CONTAINER) + '">                                                          \
                        <spacer flex="1" />                                                                                                    \
                        <toolbarseparator id="' + html.escapeTag(HEAD_LIST_ORIGIN) + '" />                                                     \
                        <toolbarseparator id="' + html.escapeTag(HEAD_SEARCH_ORIGIN) + '" />                                                   \
                        <toolbarbutton id="' + html.escapeTag(HEAD_ADD_SEARCH) + '"                                                            \
                                       image="' + html.escapeTag(SEARCH_ADD_ICON) + '"                                                         \
                                       tooltiptext="' + html.escapeTag(tooltipTextAddTracking) + '"                                            \
                                       oncommand="' + html.escapeTag(root + ".addTracking();") + '" />                                         \
                    </hbox>                                                                                                                    \
                    <hbox align="center" flex="1">                                                                                             \
                        <vbox align="center">                                                                                                  \
                            <image id="' + html.escapeTag(HEAD_USER_ICON) + '" />                                                              \
                        </vbox>                                                                                                                \
                        <vbox align="center" id="' + html.escapeTag(HEAD_USER_INFO) + '" >                                                     \
                            <vbox align="center">                                                                                              \
                                <toolbarbutton tooltiptext="' + html.escapeTag(tooltipTextTwitter) + '"                                        \
                                               id="' + html.escapeTag(HEAD_USER_BUTTON_TWITTER) + '"                                           \
                                               image="' + html.escapeTag(TWITTER_ICON) + '" />                                                 \
                                <toolbarbutton tooltiptext="' + html.escapeTag(tooltipTextHome) + '"                                           \
                                               id="' + html.escapeTag(HEAD_USER_BUTTON_HOME) + '"                                              \
                                               image="' + html.escapeTag(HOME_ICON) + '" />                                                    \
                            </vbox>                                                                                                            \
                        </vbox>                                                                                                                \
                        <vbox flex="1"                                                                                                         \
                              onclick="' + html.escapeTag(root + ".tweetBoxClicked(event);") + '"                                              \
                              id="' + html.escapeTag(HEAD_USER_TWEET) + '">                                                                    \
                            <description />                                                                                                    \
                        </vbox>                                                                                                                \
                    </hbox>                                                                                                                    \
                    <menupopup id="' + html.escapeTag(HEAD_MENU) + '" />                                                                       \
                    <menupopup id="' + html.escapeTag(HEAD_DYNAMIC_MENU) + '" />                                                               \
                </vbox>';

            let container = util.xmlToDom(containerXML);

            container.setAttribute("hidden", true);

            document.getElementById("browser-bottombox").insertBefore(
                container, document.getElementById("keysnail-completion-list")
            );

            let crawlerButtonContainer = document.getElementById(HEAD_CRAWLER_BUTTON_CONTAINER);

            // Lists {{ ================================================================= //

            let listOrigin  = document.getElementById(HEAD_LIST_ORIGIN);
            let listButtons = {};

            for (let crawler of util.values(gLists))
            {
                let button = document.createElement("toolbarbutton");

                let [id, name] = crawler.nameEscaped.split("/");
                button.setAttribute("label", name);
                button.setAttribute("tooltiptext", crawler.name);
                button.setAttribute("image", TAG_ICON);
                button.setAttribute("oncommand",
                                    util.format("%s.showCrawledListStatuses('%s', '%s');", root, id, name));
                button.setAttribute("onclick", root + ".listButtonClicked(event);");
                crawlerButtonContainer.insertBefore(button, listOrigin);

                listButtons[crawler.name] = button;
            }

            // }} ======================================================================= //

            // Search {{ ================================================================ //

            let searchOrigin    = document.getElementById(HEAD_SEARCH_ORIGIN);
            let trackingButtons = {};

            for (let crawler of util.values(gTrackings))
            {
                let name    = crawler.name;
                let keyword = crawler.nameEscaped;

                let button = $U.createElement("toolbarbutton", {
                    label       : name,
                    tooltiptext : name,
                    image       : SEARCH_ICON,
                    oncommand   : util.format("%s.showCrawledTrackingStatuses('%s');", root, crawler.nameEscaped),
                    onclick     : util.format("%s.trackingButtonClicked(event);", root)
                });

                crawlerButtonContainer.insertBefore(button, searchOrigin);

                trackingButtons[crawler.name] = button;
            }

            // }} ======================================================================= //

            my.twitterClientHeader = {
                container     : container,
                userIcon      : document.getElementById(HEAD_USER_ICON),
                userInfo      : document.getElementById(HEAD_USER_INFO),
                userName      : document.getElementById(HEAD_USER_NAME),
                userTweet     : document.getElementById(HEAD_USER_TWEET),
                //
                buttonRefresh : document.getElementById(HEAD_REFRESH_BUTTON),
                //
                buttonTwitter : document.getElementById(HEAD_USER_BUTTON_TWITTER),
                buttonHome    : document.getElementById(HEAD_USER_BUTTON_HOME),
                //
                normalMenu    : document.getElementById(HEAD_MENU),
                dynamicMenu   : document.getElementById(HEAD_DYNAMIC_MENU),
                //
                listButtons   : listButtons,
                trackingButtons : trackingButtons
            };

            // set up normal menu
            applyMenu(my.twitterClientHeader.normalMenu, [
                [M({ja: "コピー", en: "Copy"}), "c", root + ".copyCurrentStatus();"],
                [M({ja: "返信", en: "Reply"}), "r", root + ".replyToCurrentStatus();"],
                ["Retweet (Quote tweet)", "q", root + ".retweetCurrentStatus();"],
                [null, null, null],
                [M({ja: "このユーザ", en: "This user"}), "u",
                 [
                     [M({ja: "最近のつぶやき", en: "Display this user's statuses"}), "s",
                      root + ".showCurrentTargetStatus();"],
                     [M({ja: "リスト一覧", en: "Display this user's lists"}), "l",
                      root + ".showCurrentTargetLists();"],
                     [M({ja: "ブラックリストへ追加", en: "Add this user to the black list"}), "b",
                      root + ".addCurrentTargetToBlacklist();"]
                 ]
                ]
            ]);
        }

        function showDynamicMenu(aEvent, aMenuSeed, aOption) {
            let menu = createMenu(aMenuSeed);
            menu.setAttribute("id", HEAD_DYNAMIC_MENU);

            my.twitterClientHeader.container
                .replaceChild(menu, my.twitterClientHeader.dynamicMenu);

            my.twitterClientHeader.dynamicMenu = menu;

            if (aOption)
                menu.openPopup(aEvent.target, "overlap", 0, 0, true);
            else
                menu.openPopupAtScreen(aEvent.screenX, aEvent.screenY, true);
        }

        function setIconStatus(elem, status) {
            elem.setAttribute("disabled", !status);
            if (status)
                elem.removeAttribute("style");
            else
                elem.setAttribute("style", "opacity:0.25;");
        }

        if (share.twitterAPIUsage)
            share.twitterAPIUsage.update();
        else
        {
            share.twitterAPIUsage = {
                remain : null,
                limit  : null,
                reset  : null,

                set: function (remain, limit, reset) {
                    if (this.remain !== remain ||
                        this.limit  !== limit)
                    {
                        this.remain = remain;
                        this.limit  = limit;
                        this.reset  = reset;

                        this.update();
                    }
                },

                update: function () {
                    let resetDate = new Date();
                    resetDate.setTime(this.reset);

                    let hour = resetDate.getHours();
                    let min  = resetDate.getMinutes();

                    let remainStr = util.format("%s / %s", this.remain, this.limit);
                    let toolTip   = "    Twitter API Usage / Limit    \n" +
                        "    " + M({ja: "制限リセット日時", en: "Limit reset in "}) + "   " + util.format("%s:%s", hour, min);

                    Notifier.notifyWindows(
                        function (win) {
                            let description = win.document.getElementById(HEAD_API_USAGE);

                            if (description)
                            {
                                description.setAttribute("value", remainStr);
                                description.setAttribute("tooltiptext", toolTip);
                            }
                        }
                    );
                }
            };
        }

        // }} ======================================================================= //

        // ============================== Arrange services ============================== //

        try {
            var alertsService = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
        } catch (x) {
            pOptions["popup_new_statuses"] = false;
        }

        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

        // Popup notifications {{ =================================================== //

        function showPopup(arg) {
            try {
                alertsService.showAlertNotification(arg.icon || "",
                                                    arg.title || "",
                                                    arg.message || "",
                                                    !!arg.link || false,
                                                    arg.link || null,
                                                    arg.observer || null);
            } catch (x) {
                log(LOG_LEVEL_DEBUG, "failed to show popup: " + x);
            }
        }

        function showOldestUnPopUppedStatus() {
            let status = share.unPopUppedStatuses.pop();
            let popupStatus = false;

            if (pOptions["popup_new_statuses"])
            {
                if (!(gBlackUsers && gBlackUsers.some(function (id) id === status.user.screen_name)) && /* user in blacklist */
                    !(share.userInfo && status.user.screen_name === share.userInfo.screen_name))      /* your status*/
                    popupStatus = true;
            }
            else if (pOptions["popup_new_replies"])
            {
                if (status.in_reply_to_screen_name && share.userInfo &&
                    status.in_reply_to_screen_name === share.userInfo.screen_name)
                    popupStatus = true;
            }

            if (status.id_str in share.popUppedIDs)
                popupStatus = false;

            if (!popupStatus)
            {
                // ignore this status and go to next step
                if (share.unPopUppedStatuses && share.unPopUppedStatuses.length)
                    showOldestUnPopUppedStatus();

                return;
            }

            share.popUppedIDs[status.id_str] = true;

            function proc() {
                if (share.unPopUppedStatuses && share.unPopUppedStatuses.length)
                    showOldestUnPopUppedStatus();
            }

            showPopup({
                          icon     : status.user.profile_image_url,
                          title    : status.user.name,
                          message  : html.unEscapeTag(status.text),
                          link     : "http://twitter.com/" + status.user.screen_name + "/status/" + status.id_str,
                          callback : proc,
                          observer : {
                              observe: function (subject, topic, data) {
                                  if (topic === "alertclickcallback")
                                      gBrowser.loadOneTab(data, null, null, null, false);

                                  proc();
                              }
                          }
                      });
        }

        function popUpNewStatuses(statuses) {
            if (share.unPopUppedStatuses && share.unPopUppedStatuses.length > 0)
                share.unPopUppedStatuses = statuses.concat(share.unPopUppedStatuses);
            else
                share.unPopUppedStatuses = statuses;

            showOldestUnPopUppedStatus();
        }

        // }} ======================================================================= //

        // Utils {{ ================================================================= //

        function showLoadingMessage(msg) {
            if (my.twitterClientHeader)
            {
                let header = my.twitterClientHeader;

                let loading = $U.createElement("description", {
                    "class" : "ks-loading-message"
                }, [
                    document.createTextNode(msg || ".......... Loading ..........")
                ]);

                header.userTweet.replaceChild(loading, header.userTweet.firstChild);
            }
        }

        function getElapsedTimeString(aMillisec) {
            function format(num, str) {
                return Math.floor(num) + " " + str;
            }

            var sec = aMillisec / 1000;
            if (sec < 1.0)
                return M({ja: "ついさっき", en: "just now"});
            var min = sec / 60;
            if (min < 1.0)
                return format(sec, M({ja: "秒前", en: "seconds ago"}));
            var hour = min / 60;
            if (hour < 1.0)
                return format(min, M({ja: "分前", en: "minutes ago"}));
            var date = hour / 24;
            if (date < 1.0)
                return format(hour, M({ja: "時間前", en: "hours ago"}));
            return format(date, M({ja: "日前", en: "days ago"}));
        }

        // }} ======================================================================= //

        // ================================================================================ //
        // TwitterClient : Authorization
        // ================================================================================ //

        function authorize(onRequestTokenDone) {
            gOAuth.tokens.oauth_token        = "";
            gOAuth.tokens.oauth_token_secret = "";

            twitterAPI.request("oauth/request_token", {
                ok: function (res) {
                    let parts = res.split("&");
                    gOAuth.tokens.oauth_token        = parts[0].split("=")[1];
                    gOAuth.tokens.oauth_token_secret = parts[1].split("=")[1];

                    requestOAuthVerifier(gOAuth.tokens.oauth_token, function (oauthVerifier) {
                        onRequestTokenDone(oauthVerifier);
                    });
                },
                ng: function (res, xhr) {
                    display.notify("Failed to request token :: " + xhr.responseText);
                }
            });
        }

        function requestOAuthVerifier(authToken, onAuthFinish) {
            var tabElement = gBrowser.loadOneTab(
                "https://twitter.com/oauth/authorize?oauth_token=" + authToken,
                null, null, null, false
            );
            var tabBrowser = gBrowser.getBrowserForTab(tabElement);
            tabBrowser.addEventListener("DOMContentLoaded", function loadListener(ev) {
                let rootWin = tabBrowser.contentWindow;
                let doc = ev.target;
                if (doc !== rootWin.document) return; // only for main window

                let docURL = doc.location.href;
                if (/^https:\/\/github.com\/mooz\/keysnail\/wiki\?/.test(docURL)) {
                    tabBrowser.removeEventListener("DOMContentLoaded", loadListener, true);

                    var oauth_verifier = docURL.split('?')[1].split('&')
                            .map(function(q) {
                                var temp = q.split('=');
                                return {
                                    key: temp[0],
                                    value: temp[1]
                                };
                            })
                            .filter(function(q) q.key == 'oauth_verifier')[0].value;
                    onAuthFinish(oauth_verifier);
                }
            }, true);
        }

        function reAuthorize() {
            gStatuses.cache = null;
            gMentions.cache = null;

            authorizationSequence();
        }

        function authorizationSequence() {
            authorize(function (oauth_verifier) {
              getAccessToken(oauth_verifier, function () {
                showFollowersStatus();
                setUserInfo();
              });
            });
        }

        function getAccessToken(oauth_verifier, next) {
            twitterAPI.request("oauth/access_token", {
                params: {
                    oauth_verifier: oauth_verifier,
                },
                ok: function (res) {
                    let parts = res.split("&");

                    gOAuth.tokens.oauth_token        = parts[0].split("=")[1];
                    gOAuth.tokens.oauth_token_secret = parts[1].split("=")[1];

                    if (typeof next === "function")
                        next();
                },
                ng: function (res, xhr) {
                    display.notify("Failed to get access token :: " + xhr.responseText);
                }
            });
        }

        // }} ======================================================================= //

        // Actions {{ =============================================================== //

        function showFavorites(aTargetID) {
            processFavorites(function (favorites) {
                callSelector(favorites, M({ ja: "お気に入り一覧", en: "Favorites" }), {
                    fetchPrevious : fetchPrevious
                });
            });

            function processFavorites(callback, params) {
                twitterAPI.request(aTargetID ? "favorites/user" : "favorites", {
                    args: {
                        user : aTargetID
                    },
                    params: params,
                    ok: function (res, xhr) {
                        callback($U.decodeJSON(res));
                    },
                    ng: function (res, xhr) {
                        display.echoStatusBar(M({ en: "Failed to get favorites",
                                                  ja: "お気に入り一覧の取得に失敗しました" }));
                    }
                });
            }

            function fetchPrevious(status, after) {
                processFavorites(function (favorites) {
                    favorites.shift();
                    after(favorites);
                }, {
                    max_id: status.id_str
                });
            }
        }

        function addFavorite(aStatusID, aDelete) {
            var errorMsg = aDelete ?
                M({ ja: "お気に入りから削除できませんでした",
                    en: "Failed to remove status from favorites" })
            :   M({ ja: "お気に入りに追加できませんでした",
                    en: "Failed to add status to favorites" });

            var successMsg = aDelete ?
                M({ ja: "お気に入りから削除しました",
                    en: "Removed status from favorites" })
            :   M({ ja: "お気に入りに追加しました",
                    en: "Added status to favorites" });

            twitterAPI.request(util.format("favorites/%s", aDelete ? "destroy" : "create"), {
                params: {
                    id : aStatusID
                },
                ok: function (res, xhr) {
                    var status = $U.decodeJSON(res);
                    if (!status)
                        return;

                    var icon_url  = status.user.profile_image_url;
                    var user_name = status.user.name;
                    var message   = html.unEscapeTag(status.text);

                    showPopup({
                        icon    : icon_url,
                        title   : successMsg,
                        message : user_name + ": " + message,
                        link    : null
                    });

                    modifyCache(status.id_str, function (status) {
                        status.favorited = !aDelete;
                    });

                    if (prompt.refresh)
                        prompt.refresh();
                },
                ng: function (res, xhr) {
                    display.echoStatusBar(errorMsg, 2000);
                }
            });
        }

        function searchWord(word) {
            doSearchWord(word, function (results) {
                if (!results.length) {
                    display.echoStatusBar(M({
                        ja: word + L(" に対する検索結果はありません"),
                        en: "No results for " + word
                    }), 3000);
                    return;
                }

                callSelector(results, 'Search result for "' + word + '"', {
                    fetchPrevious : fetchPrevious
                });
            });

            function doSearchWord(word, next, opts) {
                opts = opts || {};

                twitterAPI.request("search", {
                    params: {
                        count  : 100,
                        q      : word,
                        max_id : opts.max_id,
                        include_entities : true
                    },
                    ok: function (res, xhr) {
                        let results = ($U.decodeJSON( xhr.responseText) || {"statuses":[]}).statuses;
                        next(results);
                    },
                    ng: function (res, xhr) {
                        display.echoStatusBar(M({ja: "検索に失敗しました",
                                                 en: "Failed to search word"}), 3000);
                    }
                });
            }

            function fetchPrevious(status, after) {
                doSearchWord(word, function (results) {
                    results.shift();
                    after(results);
                }, {
                    max_id: status.id_str
                });
            }
        }

        function search() {
            gPrompt.close();
            prompt.read("search:", function (word) {
                if (word)
                    searchWord(word);
            }, null, null, null, 0, "twitter_search");
        }

        function copy(aMsg) {
            command.setClipboardText(aMsg);
            display.echoStatusBar(M({ja: "コピーしました", en: "Copied"}) + " : " + aMsg, 2000);
        }

        function reply(status) {
            let users = Array
                    .slice(status.text.match(/@[a-zA-Z0-9_]+/g) || [])
                    .filter(function (userName)
                            !share.userInfo ||
                            "@" + share.userInfo.screen_name !== userName);
            users.unshift("@" + status.screen_name);
            users.push("");
            let init = users.join(" ");
            tweet(init, status.id_str, init.length);
        }

        function sendDM(userID, statusID) {
            let init = "d " + userID + " ";
            tweet(init, statusID, init.length);
        }

        function quoteTweet(aUserID, aMsg) {
            tweet("RT @" + aUserID + ": " + aMsg);
        }

        function retweet(aID) {
            twitterAPI.request("statuses/retweet", {
                args: {
                    id : aID
                },
                ok: function (res, xhr) {
                    // succeeded
                    var status    = $U.decodeJSON(res);
                    var icon_url  = status.user.profile_image_url;
                    var user_name = status.user.name;
                    var message   = html.unEscapeTag(status.text);

                    showPopup({
                        icon    : icon_url,
                        title   : M({ja: "RT しました", en: "ReTweeted"}),
                        message : message
                    });
                },
                ng: function (res, xhr) {
                            // misc error
                    showPopup({
                        title    : M({ja: "ごめんなさい", en: "I'm sorry..."}),
                        message  : M({ja: "RT に失敗しました", en: "Failed to ReTweet"})
                            + " (" + xhr.status + ")"
                    });
                }
            });
        }

        function tweet(aInitialInput, aReplyID, aCursorEnd) {
            var maxTweetLength = 140;
            gPrompt.close();

            try {
                if (pOptions.show_screen_name_on_tweet)
                    var promptMessage = util.format(
                        "tweet (%s):",
                        share.userInfo.screen_name
                    );
            } catch (_) {}

            if (!promptMessage)
                promptMessage = "tweet:";

            prompt.reader({
                message      : promptMessage,
                initialcount : 0,
                initialinput : aInitialInput,
                group        : "twitter_tweet",
                keymap       : pOptions["tweet_keymap"],
                completer    : completer.matcher.header(share.friendsCache || []),
                cursorEnd    : aCursorEnd,
                onChange     : function (arg) {
                    var tweet = arg.textbox.value;
                    var tweetLength = twttr.txt.getTweetLength(tweet);

                    var acceptableCharCount = maxTweetLength - tweetLength;

                    var msg = M({ja: ("残り " + acceptableCharCount + " 文字"), en: acceptableCharCount});
                    if (acceptableCharCount < 0)
                        msg = M({ja: ((-acceptableCharCount) + " 文字オーバー"), en: ("Over " + (-acceptableCharCount) + " characters")});
                    display.echoStatusBar(msg);
                },
                callback: function postTweet(aTweet) {
                    display.echoStatusBar("");

                    if (aTweet === null)
                        return;

                    let params = { status : aTweet };

                    if (aReplyID)
                        params["in_reply_to_status_id"] = aReplyID.toString();

                    function showPopupMayBe() {
                        if (pOptions["popup_on_tweet"])
                            showPopup.apply(this, arguments);
                    }

                    twitterAPI.request("statuses/update", {
                        params: params,
                        ok: function (res, xhr) {
                            let status = $U.decodeJSON(res);

                            let icon_url  = status.user.profile_image_url;
                            let user_name = status.user.name;
                            let message   = aTweet;

                            showPopupMayBe({
                                icon    : icon_url,
                                title   : user_name,
                                message : message
                            });

                            // immediately add
                            if (gStatuses.cache)
                                gStatuses.cache.unshift(status);
                            share.twitterImmediatelyAddedStatuses.push(status);
                        },
                        ng: function (res, xhr) {
                            var response, errorMessage;
                            try {
                                response = $U.decodeJSON(res);
                                errorMessage = ":" + response.errors.map(function ({message}) message).join("\n");
                            } catch (x) {
                                errorMessage = "";
                            }

                            showPopupMayBe({
                                title   : M({ja: "ごめんなさい", en: "I'm sorry..."}),
                                message : M({ja: "つぶやけませんでした",
                                             en: "Failed to tweet"}) + " (" + xhr.status + ")" + errorMessage
                            });
                        }
                    });
                }
            });
        }

        function deleteStatus(aStatusID) {
            twitterAPI.request("statuses/destroy", {
                args: {
                    id: aStatusID
                },
                ok: function (res, xhr) {
                    // delete from cache
                    if (gStatuses.cache) {
                        for (var i = 0; i < gStatuses.cache.length; ++i) {
                            if (gStatuses.cache[i].id_str === aStatusID) {
                                gStatuses.cache.splice(i, 1);
                                break;
                            }
                        }

                        setLastID(gStatuses);
                    }

                    display.echoStatusBar(M({ja: 'ステータスが削除されました',
                                             en: "Status deleted"}), 2000);
                },
                ng: function (res, xhr) {
                    display.echoStatusBar(M({ja: 'ステータスの削除に失敗しました。',
                                             en: "Failed to delete status"}), 2000);
                }
            });
        }

        function showListStatuses(aScreenName, aListName) {
            twitterAPI.request("lists/statuses", {
                params: {
                    per_page          : gTimelineCountBeginning,
                    owner_screen_name : aScreenName,
                    slug              : aListName
                },
                ok: function (res, xhr) {
                    var statuses = $U.decodeJSON(xhr.responseText) || [];
                    callSelector(
                        statuses,
                        M({ja: util.format("%s/%s のタイムライン", aScreenName, aListName),
                           en: util.format("Timeline of %s/%s", aScreenName, aListName)})
                    );
                },
                ng: function (res, xhr) {
                    display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。 (自分のプライベートリストは取得できません。)',
                                             en: "Failed to get statuses. (Your private list cannot be fetched with this method.)"}), 2000);
                }
            });
        }

        function showLists(aScreenName) {
            if (!aScreenName)
                aScreenName = share.userInfo.screen_name;

            if (share.twitterListCache && share.twitterListCache[aScreenName])
            {
                // use cache
                showListsInPrompt(share.twitterListCache[aScreenName]);
            }
            else
            {
                twitterAPI.request("lists/index", {
                    params: {
                        screen_name : aScreenName
                    },
                    ok: function (res) {
                            let result = $U.decodeJSON(res);
                            if (!share.twitterListCache)
                                share.twitterListCache = {};
                            share.twitterListCache[aScreenName] = result;

                            showListsInPrompt(result);
                    },
                    ng: function (res) {
                        display.echoStatusBar(M({ja: 'リスト一覧の取得に失敗しました。',
                                                 en: "Failed to get lists"}), 2000);
                    }
                });
            }

            function showListsInPrompt(cache) {
                let collection = Array.slice((cache || [])).map(
                    function (list)
                    [
                        list.name,
                        list.description,
                        list.member_count,
                        list.subscriber_count
                    ]
                );

                gPrompt.close();
                prompt.selector(
                    {
                        message    : M({ja: "リスト", en: "lists"}),
                        collection : collection,
                        // name, description, member_count, subscriber_count
                        flags      : [0, 0, 0, 0],
                        header     : [M({ja: 'リスト名', en: "List name"}),
                                      M({ja: '説明', en: "Description"}),
                                      M({ja: 'フォロー中', en: "Following"}),
                                      M({ja: 'リストをフォロー', en: "Follower"})],
                        actions    : [
                            [function (i) {
                                 if (i >= 0) showListStatuses(aScreenName, collection[i][0]);
                             }, M({ja: "リストの TL を表示", en: "Show list statuses"})]
                        ]
                    });
            }
        }

        function switchTo() {
            const ico = ICON | IGNORE;

            gPrompt.close();

            function crawlerToLabel(crawler) {
                let unreadCount = getStatusPos(crawler.cache, crawler.lastID);
                return "(" + (unreadCount < 0 ? "-" : unreadCount) + ") " + crawler.name;
            }

            let lists = [
              for (kv of util.keyValues(gLists))
                [TAG_ICON, crawlerToLabel(kv[1]), (function (name) {
                  return function () {
                    self.showCrawledListStatuses.apply(null, name.split("/"));
                  };
                })(kv[0])]
            ];

            let trackings = [
              for (kv of util.keyValues(gTrackings))
                [SEARCH_ICON, crawlerToLabel(kv[1]), (function (name) {
                  return function () {
                    self.showCrawledTrackingStatuses.call(null, name);
                  };
                })(kv[0])]
            ];

            const ACT_ROW = 2;

            let places = [
                [TWITTER_ICON   , "Home", function () { self.showTimeline(); }],
                [MENTIONS_ICON  , "Mentions", function () { self.showMentions(); }],
                [FAVORITED_ICON , "Favorites", function () { self.showFavorites(); }],
                [MESSAGE_ICON   , "DM", function () { self.showDMs(); }]
            ];

            let collection = lists.concat(trackings).concat(places);

            prompt.selector(
                {
                    message    : M({ja: "どれを見る？", en: "Switch to"}),
                    collection : collection,
                    flags      : [ICON | IGNORE, 0, HIDDEN | IGNORE],
                    keymap     : pOptions["switch_to_keymap"],
                    actions    : [
                        [function (i) {
                             if (i < 0)
                                 return;

                             gPrompt.forced = true;
                             collection[i][ACT_ROW]();
                         },
                         "Switch to",
                         "switch-to,c"]
                    ]
                });
        }

        function showConversations(id, init) {
            let conversations = [];

            if (init)
                conversations.push(init);

            display.echoStatusBar(M({ja: "会話リストの取得を開始. しばらくお待ち下さい.",
                                     en: "Fetching conversations beginning"}));

            function createMap(maps) {
                let map = {};
                (maps || []).forEach(function (m) (m || []).forEach(function (s) map[s.id_str] = s));
                return map;
            }

            let map = createMap([gStatuses.cache, gMentions.cache]);

            gPrompt.forced = true;
            callSelector(conversations);

            function trail(from) {
                function next(status) {
                    gPrompt.forced = true;
                    callSelector(conversations);

                    if (status.in_reply_to_status_id_str)
                        trail(status.in_reply_to_status_id_str);
                }

                if (from in map)
                {
                    conversations.push(map[from]);
                    next(map[from]);
                }
                else
                {
                    function processResponse(xhr) {
                        let result = $U.decodeJSON(xhr.responseText);
                        conversations.push(result);

                        display.echoStatusBar(util.format(M({
                            ja: "会話リストを取得中... (%s)",
                            en: "Fetching conversations ... (%s)"
                        }), conversations.length));

                        next(result);
                    }

                    util.httpGet(
                        "https://api.twitter.com/1/statuses/show/" + from + ".json?include_entities=true",
                        false,
                        function (xhr) {
                            if (xhr.status === 200) {
                                processResponse(xhr);
                            } else {
                                // protected user?
                                twitterAPI.request("statuses/show", {
                                    args: {
                                        id : from
                                    },
                                    ok: function (res, xhr) {
                                        processResponse(xhr);
                                    },
                                    ng: function (res, xhr) {
                                        display.echoStatusBar(M({
                                            ja: "会話リストの取得に失敗しました",
                                            en: "Failed to fetch conversations"
                                        }));
                                    }
                                });
                            }
                        }
                    );
                }
            }

            trail(id);
        }

        function showCrawlersCache(crawler, arg, cacheFilter) {
            var updateForced = typeof arg === "number";

            function displayCache() {
                callSelector(cacheFilter ? cacheFilter(crawler.cache) : crawler.cache,
                             crawler.name, {
                                 lastID        : crawler.lastID,
                                 fetchPrevious : crawler.maxIDName ? function (status, after) {
                                     return crawler.updatePrevious(status, after);
                                 } : null
                             });
                setLastID(crawler);
            }

            if (updateForced || !crawler.cache)
            {
                if (crawler.pending)
                {
                    display.echoStatusBar(M({ja: 'Twitter へリクエストを送信しています。しばらくお待ち下さい。',
                                             en: "Requesting to the Twitter ... Please wait."}), 2000);
                }
                else
                {
                    showLoadingMessage();

                    crawler.update(displayCache, updateForced, false);
                }
            }
            else
            {
                // use cache
                displayCache();
            }
        }

        function showFollowersStatus(arg) {
            showCrawlersCache(gStatuses, arg);
        }

        function showMentions(arg) {
            showCrawlersCache(gMentions, arg);
        }

        function showTargetStatus(target) {
            processTargetStatuses(target, function (statuses) {
                callSelector(statuses, M({
                    ja: target + " のつぶやき一覧",
                    en: "Tweets from " + target
                }), {
                    fetchPrevious : fetchPrevious
                });
            });

            function processTargetStatuses(target, next, opts) {
                opts = opts || {};

                twitterAPI.request("statuses/user_timeline", {
                    params: {
                        screen_name : target,
                        count       : gTimelineCountEveryUpdates,
                        max_id      : opts.max_id,
                        include_rts : !!pOptions["user_include_rts"],
                        include_entities : true
                    },
                    ok: function (res, xhr) {
                        var statuses = $U.decodeJSON(xhr.responseText) || [];
                        next(statuses);
                    },
                    ng: function (res, xhr) {
                        display.echoStatusBar(M({
                            ja: 'ステータスの取得に失敗しました。',
                            en: "Failed to get statuses"
                        }), 2000);
                    }
                });
            }

            function fetchPrevious(status, after) {
                processTargetStatuses(target, function (statuses) {
                    statuses.shift();
                    after(statuses);
                }, {
                    max_id: status.id_str
                });
            }
        }

        // ================================================================================ //
        // Sub methods
        // ================================================================================ //

        function focusContent() {
            getBrowser().focus();
            _content.focus();
        }

        function getEntitiesFromStatus(status) {
            let entities = {};

            ["entities", "media"].forEach(function (entityContainerName) {
                let entityContainer = status[entityContainerName];
                if (status[entityContainerName]) {
                    for (let [entityName, entity] of util.keyValues(entityContainer)) {
                        entities[entityName] = entity;
                    }
                }
            });

            return entities;
        }

        function createMessageNode(messageText, status) {
            let retweetedStatus = status.retweeted_status;
            if (retweetedStatus) {
                // Retweeted status. Add "RT @screenname: "
                let retweetedMessageNode = createMessageNode(retweetedStatus.text, retweetedStatus);
                let retweetedUserName = retweetedStatus.user.screen_name;

                let newChildren = [
                    retweetedMessageNode.firstChild, document.createTextNode("RT "),
                    $U.createLinkElement("http://twitter.com/" + retweetedUserName, "@" + retweetedUserName),
                    document.createTextNode(": ")
                ].concat(Array.slice(retweetedMessageNode.childNodes));

                while (retweetedMessageNode.firstChild) {
                    retweetedMessageNode.removeChild(retweetedMessageNode.firstChild);
                }

                for (let childNode of newChildren) {
                    retweetedMessageNode.appendChild(childNode);
                }

                return retweetedMessageNode;
            }

            // Otherwise

            let entities = getEntitiesFromStatus(status);
            let messageNode = entities
                    ? createMessageNodeFromEntities(messageText, status.text, entities)
                    : createMessageNodeWithoutEntities(messageText);

            if (status.in_reply_to_status_id_str) {
                let url = util.format(
                    "http://twitter.com/%s/status/%s",
                    status.in_reply_to_screen_name,
                    status.in_reply_to_status_id_str
                );
                messageNode.appendChild($U.createLinkElement(url, "[in reply to]"));
            }

            return messageNode;
        }

        function getSortedEntitiesWithType(entities) {
            let sortedEntities = [
              for (kv of util.keyValues(entities)) kv
            ].reduce(
                function (entityWithTypes, [entityType, entityList]) {
                    return entityWithTypes.concat(entityList.map(function (entity) {
                        return {
                            type: entityType,
                            entity: entity
                        };
                    }));
                }, []
            ).sort(function (entityWithType1, entityWithType2) {
                return entityWithType1.entity.indices[0] > entityWithType2.entity.indices[0];
            });

            return sortedEntities;
        }

        function createMessageNodeFromEntities(messageText, escapedMessageText, entities) {
            let messageNode = $U.createElement("description", {
                style : "-moz-user-select : text !important;"
            });

            let cursor = 0;

            let sortedEntitiesWithType = getSortedEntitiesWithType(entities);
            sortedEntitiesWithType.forEach(function ({ type, entity }) {
                let leftMessage = html.unEscapeTag(escapedMessageText.slice(cursor, entity.indices[0]));
                messageNode.appendChild(document.createTextNode(leftMessage));

                // move cursor
                cursor = entity.indices[1];

                switch (type) {
                case "hashtags":
                    messageNode.appendChild($U.createLinkElement("http://twitter.com/search?q=" + encodeURIComponent(entity.text), "#" + entity.text));
                    break;
                case "urls":
                case "media":
                    messageNode.appendChild($U.createLinkElement(entity.expanded_url, entity.display_url || entity.url));
                    break;
                case "user_mentions":
                    messageNode.appendChild($U.createLinkElement("http://twitter.com/" + entity.screen_name, "@" + entity.screen_name));
                    break;
                }
            });

            if (cursor < messageText.length) {
                let rightMessage = messageText.slice(cursor);
                messageNode.appendChild(document.createTextNode(rightMessage));
            }

            return messageNode;
        }

        function createMessageNodeWithoutEntities(messageText) {
            let specialPattern = /(@[a-zA-Z0-9_]+|((http|ftp)s?\:\/\/|www\.)[^\s]+)|(#[a-zA-Z0-9_]+)/g;

            let matched = messageText.match(specialPattern);
            let messageNode = $U.createElement("description", {
                style : "-moz-user-select : text !important;"
            });

            if (matched) {
                for (let i = 0; i < matched.length; ++i) {
                    let pos   = messageText.indexOf(matched[i]);
                    let left  = messageText.slice(0, pos);
                    let right = messageText.slice(pos + matched[i].length);

                    let url;
                    let type =
                            matched[i][0] === '@' ? "user" :
                            matched[i][0] === '#' ? "hash" : "url";

                    if (type === "user")
                        url = "http://twitter.com/" + matched[i].slice(1);
                    else if (type === "hash")
                        url = "http://twitter.com/search?q=" + encodeURIComponent(matched[i]);
                    else {
                        url = matched[i];
                        if (url.indexOf("www") === 0)
                            url = "http://" + url;
                    }

                    messageNode.appendChild(document.createTextNode(left));
                    messageNode.appendChild($U.createLinkElement(url, matched[i]));

                    messageText = right;
                }

                if (messageText.length)
                    messageNode.appendChild(document.createTextNode(messageText));
            } else {
                messageNode.appendChild(document.createTextNode(messageText));
            }

            return messageNode;
        }

        function extractAllURLsFromStatus(status) {
            let entities = getEntitiesFromStatus(status.retweeted_status ? status.retweeted_status : status);

            if (entities) {
                let sortedEntitiesWithType = getSortedEntitiesWithType(entities);
                return sortedEntitiesWithType.filter(function ({ type, entity }) {
                    return type === "urls" || type === "media";
                }).map(function ({ type, entity }) {
                    return entity.expanded_url || entity.url;
                });
            } else {
                return $U.extractLinks(status.text);
            }
        }

        function openAllURLs(status) {
            extractAllURLsFromStatus(status).forEach(function (url) {
                gBrowser.loadOneTab(url, null, null, null, false);
            });
        }

        function callSelector(aStatuses, aMessage, options) {
            if (!aStatuses)
                return;

            options = options || {};

            var current = new Date();

            // ============================================================ //

            function notBlack(status) {
                return gBlackUsers.every(function (name) {
                    return status.user.screen_name !== name;
                });
            }

            // ignore black users
            var statuses = options.supressFilter ? aStatuses : aStatuses.filter(notBlack);

            // apply filters
            let filters = pOptions.filters;
            if (filters && filters.length) {
                filters.forEach(f => statuses = statuses.filter(f));
            }

            // ============================================================ //

            function favIconGetter(aRow) aRow[0].favorited ? FAVORITED_ICON : "";
            let preferScreenName = pOptions["prefer_screen_name"];
            let showSources      = pOptions["show_sources"];
            let showRTCount      = pOptions["show_retweet_count"];

            function statusMapper(status) {
                var created = Date.parse(status.created_at);
                var matched = status.source ? status.source.match(">(.*)</a>") : "";

                let profile_image = status.user.profile_image_url;
                if (pOptions.hide_profile_image_gif && /\.gif$/.test(profile_image))
                    profile_image = "http://a1.twimg.com/images/default_profile_0_bigger.png";

                return [
                    status,
                    profile_image,
                    preferScreenName ? status.user.screen_name : status.user.name,
                    html.unEscapeTag(status.text),
                    favIconGetter,
                    getElapsedTimeString(current - created) +
                        (showRTCount && status.retweet_count ? " (" + status.retweet_count + " RT)" : "") +
                        (status.in_reply_to_screen_name ? " to " + status.in_reply_to_screen_name : "") +
                        (showSources ? " " + (matched ? matched[1] : "Web") : "")
                ];
            }

            var collection = statuses.map(statusMapper);

            // ============================================================ //

            const ico = ICON   | IGNORE;
            const hid = HIDDEN | IGNORE;

            if (!aMessage)
                aMessage = M({ja: "タイムライン", en: "Timeline"});

            let currentID               = statuses[0] ? statuses[0].id_str : null;
            let selectedUserID          = statuses[0] ? statuses[0].user.screen_name : null;
            let selectedUserInReplyToID = statuses[0] ? statuses[0].in_reply_to_screen_name : null;
            let { lastID }              = options;

            let header = my.twitterClientHeader;

            gPrompt.close();

            function onFinish() {
                header.container.setAttribute("hidden", true);
            }

            header.container.setAttribute("hidden", false);

            const fetchingPreviousMessage = M({
                ja: "過去のメッセージを取得しています",
                en: "Fetching previous messages"
            });

            let beforeIndex         = 0;
            let { fetchPrevious }   = options;
            let fetchingPreviousNow = false;

            function doFetchPrevious(status, i) {
                if (fetchingPreviousNow)
                    return;

                fetchingPreviousNow = true;

                prompt.suspended = true;

                let promptInput = document.getElementById("keysnail-prompt-textbox");
                promptInput.blur();

                fetchPrevious(status, function (statuses) {
                    fetchingPreviousNow = false;

                    gPrompt.forced = true;

                    options.initialIndex = collection.length - 1;
                    callSelector(aStatuses.concat(statuses),
                                 aMessage,
                                 options);
                });
            }

            prompt.selector({
                message    : "pattern:",
                acyclic    : true,
                collection : collection,
                // status, icon, name, message, fav-icon, info
                flags      : [hid, ico, 0, 0, ico, 0],
                header     : [M({ja: 'ユーザ', en: "User"}), aMessage, M({ja : "情報", en: 'Info'})],
                width      : pOptions["main_column_width"],
                beforeSelection : function (arg) {
                    if (!arg.row || fetchingPreviousNow)
                        return;

                    let status = arg.row[0];

                    if (fetchPrevious         &&
                        collection.length > 1 &&
                        arg.i === collection.length - 1 &&
                        arg.i === beforeIndex) {
                        // fetch previous messages
                        let lastStatus = collection[arg.i][0];

                        doFetchPrevious(lastStatus, arg.i);

                        if (my.twitterClientHeaderUpdater) {
                            clearTimeout(my.twitterClientHeaderUpdater);
                            my.twitterClientHeaderUpdater = null;
                        }

                        return showLoadingMessage(fetchingPreviousMessage);
                    }

                    beforeIndex = arg.i;

                    // accessible from out of this closure
                    my.twitterSelectedStatus = status;

                    selectedUserID          = status.user.screen_name;
                    currentID               = status.id_str;
                    selectedUserInReplyToID = status.in_reply_to_screen_name;

                    if (my.twitterClientHeaderUpdater)
                        clearTimeout(my.twitterClientHeaderUpdater);

                    function updateHeader() {
                        header.userIcon.setAttribute("src", arg.row[1]);
                        header.userIcon.setAttribute("tooltiptext", status.user.description);
                        header.userName.setAttribute("value", status.user.screen_name + " / " + status.user.name);
                        header.userName.setAttribute("tooltiptext", status.user.description);

                        setIconStatus(header.buttonHome, !!status.user.url);
                        if (status.user.url)
                            header.buttonHome.setAttribute("onclick", Commands.openLink(status.user.url));
                        else
                            header.buttonHome.removeAttribute("onclick");

                        header.buttonTwitter.setAttribute("onclick", Commands.openLink('http://twitter.com/' + status.user.screen_name));

                        header.userTweet.replaceChild(createMessageNode(html.unEscapeTag(status.text), status), header.userTweet.firstChild);

                        my.twitterClientHeaderUpdater = null;
                    }

                    // add delay
                    my.twitterClientHeaderUpdater = setTimeout(updateHeader, 90);
                },
                onFinish : onFinish,
                stylist  : function (args, n, current) {
                    if (current !== collection)
                        return null;

                    let status = args[0];

                    let style = "";

                    if (share.userInfo)
                    {
                        if (status.user.screen_name === share.userInfo.screen_name)
                            style += pOptions["my_tweet_style"];

                        if (status.in_reply_to_screen_name === share.userInfo.screen_name)
                            style += pOptions["reply_to_me_style"];
                    }

                    if (status.user.screen_name === selectedUserID)
                    {
                        if (status.id_str === currentID)
                            style += pOptions["selected_row_style"];
                        else
                            style += pOptions["selected_user_style"];
                    }
                    else if (status.user.screen_name === selectedUserInReplyToID)
                        style += pOptions["selected_user_reply_to_style"];
                    else if (status.user.in_reply_to_screen_name &&
                             status.user.in_reply_to_screen_name === selectedUserInReplyToID)
                        style += pOptions["selected_user_reply_to_reply_to_style"];
                    else if (status.retweeted_status)
                        style += pOptions["retweeted_status_style"];

                    if (lastID && status.id_str > lastID)
                        style += pOptions["unread_message_style"];

                    return style;
                },
                filter : function (aIndex) {
                    var status = statuses[aIndex];

                    // XXX: もう少し仕様変更に強固な方が良い
                    return (aIndex < 0 ) ? [null] :
                        [{
                            screen_name : status.user.screen_name,
                            id          : status.id,
                            id_str      : status.id_str,
                            user_id     : status.user.id_str,
                            text        : html.unEscapeTag(status.text),
                            favorited   : status.favorited,
                            raw         : status
                        }];
                },
                keymap       : pOptions["keymap"],
                actions      : gTwitterCommonActions,
                initialIndex : options.initialIndex
            });
        }

        function modifyCache(aId, proc) {
            if (!gStatuses.cache)
                return;

            for (let status of gStatuses.cache)
                if (status.id_str === aId)
                    proc(status);
        }

        function setLastID(crawler) {
            if (crawler.cache && crawler.cache.length)
            {
                crawler.lastID = crawler.cache[0].id_str;

                if (typeof crawler.lastIDHook === "function")
                    crawler.lastIDHook();
            }
        }

        function getStatusPos(aJSON, aID) {
            if (!aJSON)
                return -1;

            if (!aID)
                return aJSON.length;

            for (var i = 0; i < aJSON.length; ++i)
                if (aJSON[i].id_str === aID)
                    return i;

            return aJSON.length;
        }

        function setUserInfo() {
            twitterAPI.request("account/verify_credentials", {
                ok: function (res, xhr) {
                    var account = $U.decodeJSON(res);

                    share.userInfo = account;
                    log(LOG_LEVEL_DEBUG, "user info successfully set");
                }
            });
        }

        function updateFriendsCache(previousCursor) {
            if (!Array.isArray(share.friendsCache)) {
                share.friendsCache = [];
            }
            (function update (cursor) {
                var updateInterval = 1000 * 35;

                twitterAPI.request('statuses/friends', {
                    params: { cursor: cursor },
                    ok: function (res, xhr) {
                        res = $U.decodeJSON(res);

                        (res.users || []).forEach(function (user) {
                            share.friendsCache.push("@" + user.screen_name);
                            share.friendsCache.push("D " + user.screen_name);
                        });

                        share.friendsCache.sort();
                        share.friendsCache = _.uniq(share.friendsCache, true /* sorted */);
                        persist.preserve({
                            cache: share.friendsCache,
                            cursor: res.next_cursor_str,
                            last_update_date: new Date()
                        }, "yatck_friends_cache");

                        if (res.next_cursor_str !== "0") {
                            setTimeout(function () {
                                update(res.next_cursor_str);
                            }, updateInterval);
                        }
                    },
                    ng: function (res, xhr) {
                        setTimeout(function (res, xhr) {
                            update(cursor);
                        }, updateInterval * 5);
                    }
                });
            })(typeof previousCursor === "number" ? previousCursor : -1);
        }

        /**
         * @public
         */
        var self = {
            // Context menu {{ ========================================================== //

            tweetBoxClicked: function (aEvent) {
                let elem   = aEvent.target;
                let text   = elem.value || "";
                let isLink = elem.getAttribute("class") === $U.linkClass;
                let status = my.twitterSelectedStatus;

                if (aEvent.button === 2)
                {
                    // right click
                    if (isLink)
                    {
                        if (text[0] === '@')
                        {
                            let userName = text.slice(1);
                            showDynamicMenu(aEvent, [
                                [util.format(M({ja: "%s のステータスを一覧表示", en: "Display %s's status"}), userName), "s",
                                 root + util.format(".showTargetStatus('%s');", userName)],
                                [util.format(M({ja: "%s の Twitter ホームへ", en: "%s in twitter"}), userName), "h",
                                 Commands.openLink("http://twitter.com/" + userName)]
                            ]);
                        }
                        else if (text[0] === '#')
                        {
                            let actions = [
                                [M({ ja: "このハッシュタグをトラッキングする", en: "Track this hash tag" }),
                                 null,
                                 root + util.format(".addTracking('%s');", text)]
                            ];

                            showDynamicMenu(aEvent, actions);
                        }
                        else
                        {
                            let url = text;
                            let actions = [
                                [M({ja: "開く", en: "Open URL"}), "o", Commands.openLink(url)],
                                [M({ja: "バックグラウンドのタブで開く",
                                    en: "Open URL in background tab"}), "o", Commands.openLinkBackground(url)],
                                [M({ja: "URL をコピー", en: "Copy URL"}), "c",
                                 'KeySnail.modules.command.setClipboardText("' + url + '")']
                            ];

                            if (url.match("^http://(j\\.mp|bit\\.ly)/"))
                            {
                                actions.push([M({ja: "URL がクリックされた回数を表示", en: "Inspect this link"}), "i",
                                              Commands.openLink(url + "+")]);
                            }

                            showDynamicMenu(aEvent, actions);
                        }
                    }
                    else
                    {
                        my.twitterClientHeader.normalMenu
                            .openPopupAtScreen(aEvent.screenX, aEvent.screenY, true);
                    }
                }
                else
                {
                    // left click
                    if (isLink)
                    {
                        let url = elem.getAttribute("tooltiptext");
                        openUILinkIn(url, "tab");
                    }
                }
            },

            showTargetStatus: function (aUserID) {
                gPrompt.forced = true;
                showTargetStatus(aUserID);
            },

            replyToCurrentStatus: function () {
                let status = my.twitterSelectedStatus;
                if (status)
                {
                    gPrompt.forced = true;
                    reply(status);
                }
            },

            retweetCurrentStatus: function () {
                let status = my.twitterSelectedStatus;
                if (status)
                {
                    gPrompt.forced = true;
                    quoteTweet(status.user.screen_name, html.unEscapeTag(status.text));
                }
            },

            showCurrentTargetStatus: function () {
                let status = my.twitterSelectedStatus;
                if (status)
                {
                    gPrompt.forced = true;
                    showTargetStatus(status.user.screen_name);
                }
            },

            showCurrentTargetLists: function () {
                let status = my.twitterSelectedStatus;
                if (status)
                {
                    gPrompt.forced = true;
                    showLists(status.user.screen_name);
                }
            },

            addCurrentTargetToBlacklist: function () {
                let status = my.twitterSelectedStatus;
                if (status)
                {
                    let id = status.user.screen_name;
                    addUserToBlacklist(id);
                }
            },

            showMyLists: function () {
                showLists();
            },

            copyCurrentStatus: function () {
                let status = my.twitterSelectedStatus;
                if (status)
                    copy(html.unEscapeTag(status.text));
            },

            // }} ======================================================================= //

            updateStatusesCache: function (after, noRepeat, fromTimer) {
                gStatuses.update(after, noRepeat, fromTimer);
            },

            updateMentionsCache: function (after, noRepeat, fromTimer) {
                gMentions.update(after, noRepeat, fromTimer);
            },

            updateDMsCache: function (after, noRepeat, fromTimer) {
                gDMs.update(after, noRepeat, fromTimer);
            },

            togglePopupStatus: function () {
                let toggled = !pOptions["popup_new_statuses"];

                pOptions["popup_new_statuses"] = toggled;
                display.echoStatusBar(M({ja: ("ポップアップ通知を" + (toggled ? "有効にしました" : "無効にしました")),
                                         en: ("Pop up " + (toggled ? "enabled" : "disabled"))}), 2000);
            },

            reAuthorize: function () {
                reAuthorize();
            },

            tweet: function () {
                tweet.apply(null, arguments);
            },

            tweetWithTitleAndURL: function (ev, arg) {
                $U.shortenURL(window.content.location.href, function (url) {
                    tweet((arg ? "" : '"' + content.document.title + '" - ') + url);
                });
            },

            showMentions: function () { showMentions.apply(this, arguments); },

            showDMs: function (arg) {
                gPrompt.forced = true;
                showLoadingMessage();
                showCrawlersCache(gDMs, arg, gSentDMs.cache ?
                                  function (c) c.concat(gSentDMs.cache).sort()
                                  : null);
            },

            showCrawledListStatuses: function (id, listName, forceUpdate) {
                let crawler = gLists[id + "/" + listName];

                if (crawler)
                {
                    gPrompt.forced = true;
                    showCrawlersCache(crawler, forceUpdate ? 1 : false);
                }
            },

            showCrawledTrackingStatuses: function (query, forceUpdate) {
                let crawler = gTrackings[query];

                if (crawler)
                {
                    gPrompt.forced = true;
                    showCrawlersCache(crawler, forceUpdate ? 1 : false);
                }
            },

            changeTrackingInterval: function (query) {
                let crawler = gTrackings[query];

                if (!crawler)
                    return;

                let interval = window.prompt(M({ en: "Input the new tracking interval (minute)",
                                                 ja: "新しいトラッキング間隔を入力してください (単位: 分)" }),
                                             crawler.interval / (60 * 1000));

                if (!interval)
                    return;

                interval = parseFloat(interval);

                if (isNaN(interval))
                    return;

                interval = ~~(interval * 60 * 1000);

                share.twitterTrackingInfo[query].interval = interval;
                crawler.interval = interval;

                persist.preserve(share.twitterTrackingInfo, "yatck_tracking_info");
            },

            search: function () {
                search();
            },

            showTimeline: function (aEvent, aArg) {
                if (!gOAuth.tokens.oauth_token || !gOAuth.tokens.oauth_token_secret)
                    authorizationSequence();
                else
                    showFollowersStatus(aArg);
            },

            showFavorites: function () {
                gPrompt.forced = true;
                showLoadingMessage();
                showFavorites();
            },

            showUsersTimeline: function (ev, arg) {
                showTargetStatus();
            },

            selectUserAndShowTimeline: function (ev, arg) {
                const namePattern = /^@?(.*)$/;
                prompt.reader({
                    message: "Input screen name: ",
                    collection: (share.friendsCache || []).map(
                        function (s) (namePattern.exec(s), RegExp.$1)
                    ),
                    callback: function (name) {
                        setTimeout(function () {
                            showTargetStatus(name);
                        }, 0);
                    }
                });
            },

            updateStatusbar: function () {
                // calc unread statuses count
                if (gStatuses.cache)
                {
                    let unreadStatusCount = getStatusPos(gStatuses.cache, gStatuses.lastID);
                    unreadStatusLabel.setAttribute("value", unreadStatusCount);
                    unreadStatusLabel.parentNode.setAttribute(
                        "tooltiptext",
                        unreadStatusCount + M({ja: " 個の未読ステータスがあります", en: " unread statuses"})
                    );

                    log(1000, "statusbar count updated (statuses)");
                }

                if (gMentions.cache)
                {
                    let unreadMentionCount = getStatusPos(gMentions.cache, gMentions.lastID);
                    unreadMentionLabel.setAttribute("value", unreadMentionCount);
                    unreadMentionLabel.parentNode.setAttribute(
                        "tooltiptext",
                        unreadMentionCount + M({ja: " 個のあなたへの @ (言及) があります", en: " unread mentions"})
                    );

                    log(1000, "statusbar count updated (mentinos)");
                }

                if (gDMs.cache)
                {
                    let unreadDMCount = getStatusPos(gDMs.cache, gDMs.lastID);
                    unreadDMLabel.setAttribute("value", unreadDMCount);
                    unreadDMLabel.parentNode.setAttribute(
                        "tooltiptext",
                        unreadDMCount + M({ja: " 個のあなた宛 DM があります", en: " direct messages"})
                    );

                    log(1000, "statusbar count updated (dms)");
                }
            },

            updateListButton: function () {
                let listButtons = my.twitterClientHeader.listButtons;

                for (let crawler of gLists)
                {
                    if (crawler.name in listButtons && crawler.cache && crawler.cache.length)
                    {
                        let unreadCount = getStatusPos(crawler.cache, crawler.lastID);
                        listButtons[crawler.name].setAttribute("label", crawler.name.split("/")[1] + "(" + unreadCount + ")");
                        listButtons[crawler.name].setAttribute("style", unreadCount ? "font-weight : bold;" : "");
                    }
                }
            },

            updateTrackingButton: function () {
                let trackingButtons = my.twitterClientHeader.trackingButtons;

                for (let crawler of util.values(gTrackings))
                {
                    if (crawler.name in trackingButtons && crawler.cache && crawler.cache.length)
                    {
                        let unreadCount = getStatusPos(crawler.cache, crawler.lastID);
                        trackingButtons[crawler.name].setAttribute("label", crawler.name + "(" + unreadCount + ")");
                        trackingButtons[crawler.name].setAttribute("style", unreadCount ? "font-weight : bold;" : "");
                    }
                }
            },

            addTracking: function (init) {
                init = init || "";

                let word = window.prompt(M({ en: "Input the word to track (beginning with the # means hash tag)",
                                             ja: "トラッキングしたい単語を入力してください (# から始めるとハッシュタグになります)" }), init);

                if (!word)
                    return;

                if (word in gTrackings)
                    return alert(M({ en: "Specified word is already tracked",
                                     ja: "指定された単語はすでにトラッキング済みです" }));

                if (!share.twitterTrackingInfo[word])
                    share.twitterTrackingInfo[word] = {};

                let crawler = addTrackingCrawler(word, share.twitterTrackingInfo[word]);

                let crawlerButtonContainer = document.getElementById(HEAD_CRAWLER_BUTTON_CONTAINER);
                let searchOrigin           = document.getElementById(HEAD_SEARCH_ORIGIN);
                let button                 = document.createElement("toolbarbutton");

                button.setAttribute("label", crawler.name);
                button.setAttribute("tooltiptext", crawler.name);
                button.setAttribute("image", SEARCH_ICON);
                button.setAttribute("oncommand", util.format("%s.showCrawledTrackingStatuses('%s');", root, crawler.name));
                button.setAttribute("onclick", root + ".trackingButtonClicked(event);");
                crawlerButtonContainer.insertBefore(button, searchOrigin);

                my.twitterClientHeader.trackingButtons[crawler.name] = button;

                persist.preserve(share.twitterTrackingInfo, "yatck_tracking_info");

                crawler.update();
            },

            listButtonClicked: function (ev) {
                let id_and_name = ev.target.getAttribute("tooltiptext");

                if (!(id_and_name in gLists))
                    return;

                let [id, name] = id_and_name.split("/");

                switch (ev.button) {
                case 1:
                    self.showCrawledListStatuses(id, name, true);
                    break;
                case 2:
                    showDynamicMenu(ev, [
                        [M({ ja: '更新', en: 'Reflesh' }),
                         null,
                         root + util.format(".showCrawledListStatuses('%s', '%s', true);", id, name)]
                    ]);
                    break;
                }
            },

            trackingButtonClicked: function (ev) {
                let name = ev.target.getAttribute("tooltiptext");
                let escapedName = $U.toEscapedString(name);

                if (!(name in gTrackings))
                    return;

                switch (ev.button) {
                case 1:
                    self.showCrawledTrackingStatuses(escapedName);
                    break;
                case 2:
                    showDynamicMenu(ev, [
                        [M({ ja: '更新', en: 'Reflesh' }),
                         null,
                         root + util.format(".showCrawledTrackingStatuses('%s', true);", escapedName)],
                        [M({ ja: 'トラッキング間隔を変更', en: 'Change tracking interval' }),
                         null,
                         root + util.format(".changeTrackingInterval('%s');", escapedName)],
                        [M({ ja: 'トラッキングを終了', en: 'Cancel tracking this word' }),
                         null,
                         root + util.format(".removeTracking('%s');", escapedName)]
                    ]);
                    break;
                }
            },

            removeTracking: function (word) {
                if (!(word in gTrackings))
                    return;

                let confirmed = window.confirm(M({ en: "Cancel tracking word's tracking",
                                                   ja: "この単語のトラッキングを終了します。よろしいですか？" }));

                if (!confirmed)
                    return;

                gTrackings[word].stop();

                delete share.twitterTrackingInfo[word];
                delete gTrackings[word];

                persist.preserve(share.twitterTrackingInfo, "yatck_tracking_info");

                let trackingButton = my.twitterClientHeader.trackingButtons[word];

                if (trackingButton)
                {
                    let crawlerButtonContainer = document.getElementById(HEAD_CRAWLER_BUTTON_CONTAINER);
                    crawlerButtonContainer.removeChild(trackingButton);
                    delete my.twitterClientHeader.trackingButtons[word];
                }
            },

            setUserInfo       : setUserInfo,
            blackUsersManager : blackUsersManager,
            switchTo          : switchTo,

            updateFriendsCache: updateFriendsCache
        };

        // ============================================================ //
        // Initialize
        // ============================================================ //

        if (!share.popUppedIDs)
            share.popUppedIDs = {};

        if (!share.userInfo)
            self.setUserInfo();

        function dayDifference(day1, day2) {
            var diff = Math.abs(day1.getTime() - day2.getTime()) / (1000 * 60 * 60 * 24);
            return diff;
        }

        if (!share.friendsCache) {
            let friendsCacheInfo = persist.restore("yatck_friends_cache") || null;
            if (friendsCacheInfo && Array.isArray(friendsCacheInfo.cache)) {
                share.friendsCache = friendsCacheInfo.cache;
            } else {
                friendsCacheInfo = { cursor: -1 };
            }
            if (friendsCacheInfo.cursor !== 0 ||
                !friendsCacheInfo.last_update_date ||
                dayDifference(new Date(), new Date(friendsCacheInfo.last_update_date)) > 7 /* Expires 1 week */) {
                self.updateFriendsCache(friendsCacheInfo.cursor);
            }
        }

        if (pOptions["automatically_begin"])
        {
            if (!gStatuses.cache)
                self.updateStatusesCache();

            if (!gMentions.cache)
                self.updateMentionsCache();

            if (!gDMs.cache)
            {
                gSentDMs.update();
                self.updateDMsCache();
            }

            self.updateStatusbar();
        }

        if (pOptions["automatically_begin_list"])
        {
            for (let crawler of gLists)
            {
                if (crawler.cache)
                    continue;
                crawler.update();
            }

            self.updateListButton();
        }

        if (pOptions["automatically_begin_tracking"])
        {
            for (let crawler of util.keyValues(gTrackings))
            {
                if (crawler.cache)
                    continue;
                crawler.update();
            }

            self.updateTrackingButton();
        }

        return self;
})();

plugins.twitterClient = twitterClient;

// Add exts {{ ============================================================== //

plugins.withProvides(function (provide) {
    provide("twitter-client-display-timeline", twitterClient.showTimeline,
            M({ja: 'TL を表示',
               en: "Display your timeline"}));

    provide("twitter-client-tweet", function () { twitterClient.tweet(); },
            M({ja: 'つぶやく',
               en: "Tweet!"}));

    provide("twitter-client-tweet-this-page", twitterClient.tweetWithTitleAndURL,
            M({ja: 'このページのタイトルと URL を使ってつぶやく',
               en: "Tweet with the title and URL of this page"}));

    provide("twitter-client-search-word", twitterClient.search,
            M({ja: 'Twitter 検索',
               en: "Search word on Twitter"}));

    provide("twitter-client-show-mentions", twitterClient.showMentions,
            M({ja: '@ 一覧表示 (自分への言及一覧)',
               en: "Display @ (Show mentions)"}));

    provide("twitter-client-show-favorites", twitterClient.showFavorites,
            M({ja: '自分のお気に入りを一覧表示',
               en: "Display favorites"}));

    provide("twitter-client-show-my-statuses", twitterClient.showUsersTimeline,
            M({ja: '自分のつぶやきを一覧表示',
               en: "Display my statuses"}));

    provide("twitter-client-show-my-lists", twitterClient.showMyLists,
            M({ja: '自分のリストを一覧表示',
               en: "Display my lists"}));

    provide("twitter-client-blacklist-manager", twitterClient.blackUsersManager,
            M({ja: 'ブラックリストの管理',
               en: "Launch blacklist manager"}));

    provide("twitter-client-toggle-popup-status", twitterClient.togglePopupStatus,
            M({ja: 'ポップアップ通知の切り替え',
               en: "Toggle popup status"}));

    provide("twitter-client-reauthorize", twitterClient.reAuthorize,
            M({ja: '再認証',
               en: "Reauthorize"}));

    provide("twitter-client-switch-to", twitterClient.switchTo,
            M({ja: 'リスト, Home, Mentioins, Favorites などを選択',
               en: "Select Lists, Home, Mentions, Favirites, ..."}));

    provide("twitter-client-update-friends-cache", twitterClient.updateFriendsCache,
            M({ja: 'Friends キャッシュを更新',
               en: "Update friends cache"}));

    provide("twitter-client-select-user-show-timeline", twitterClient.selectUserAndShowTimeline,
            M({ja: '指定したユーザのタイムラインを表示',
               en: "Select user and display timeline"}));
}, PLUGIN_INFO);

// }} ======================================================================= //
