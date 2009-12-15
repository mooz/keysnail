// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Yet Another Twitter Client KeySnail</name>
    <description>Make KeySnail behave like Twitter client</description>
    <description lang="ja">KeySnail を Twitter クライアントに</description>
    <version>1.4.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/yet-another-twitter-client-keysnail.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/yet-another-twitter-client-keysnail.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.3</minVersion>
    <include>main</include>
    <provides>
        <ext>twitter-client-display-timeline</ext>
        <ext>twitter-client-tweet</ext>
        <ext>twitter-client-tweet-this-page</ext>
        <ext>twitter-client-show-mentions</ext>
        <ext>twitter-client-show-favorites</ext>
        <ext>twitter-client-search-word</ext>
        <ext>twitter-client-toggle-popup-status</ext>
        <ext>twitter-client-reauthorize</ext>
    </provides>
    <require>
        <script>http://github.com/mooz/keysnail/raw/master/plugins/lib/oauth.js</script>
    </require>
    <options>
        <option>
            <name>twitter_client.timeline_count_beginning</name>
            <type>integer</type>
            <description>Number of timelines this client fetches in the beginning (default 80)</description>
            <description lang="ja">起動時に取得するステータス数 (デフォルトは 80)</description>
        </option>
        <option>
            <name>twitter_client.timeline_count_every_updates</name>
            <type>integer</type>
            <description>Number of timelines this client fetches at once (default 20)</description>
            <description lang="ja">初回以降の更新で一度に取得するステータス数 (デフォルトは 20)</description>
        </option>
        <option>
            <name>twitter_client.automatically_begin</name>
            <type>boolean</type>
            <description>Automatically begin fetching the statuses</description>
            <description lang="ja">プラグインロード時、自動的にステータスの取得を開始するかどうか (初回起動時間の短縮につながる)</description>
        </option>
        <option>
            <name>twitter_client.use_popup_notification</name>
            <type>boolean</type>
            <description>Whether display pop up notification when statuses are updated or not</description>
            <description lang="ja">ステータス更新時にポップアップ通知を行うかどうか</description>
        </option>
        <option>
            <name>twitter_client.update_interval</name>
            <type>integer</type>
            <description>Interval between status updates in mili-seconds</description>
            <description lang="ja">ステータスを更新する間隔 (ミリ秒)</description>
        </option>
        <option>
            <name>twitter_client.main_column_width</name>
            <type>[integer]</type>
            <description>Each column width of [User name, Message, Info] in percentage</description>
            <description lang="ja">[ユーザ名, つぶやき, 情報] 各カラムの幅をパーセンテージ指定</description>
        </option>
        <option>
            <name>twitter_client.block_users</name>
            <type>[string]</type>
            <description>Specify user id who you don&apos;t want to see pop up notification</description>
            <description lang="ja">ステータス更新時にポップアップを表示させたくないユーザの id を配列で指定</description>
        </option>
        <option>
            <name>twitter_client.unread_status_count_style</name>
            <type>string</type>
            <description>Specify style of the unread statuses count in the statusbar with CSS</description>
            <description lang="ja">ステータスバーへ表示される未読ステータス数のスタイルを CSS で指定</description>
        </option>
        <option>
            <name>twitter_client.keymap</name>
            <type>object</type>
            <description>Local keymap</description>
            <description lang="ja">ローカルキーマップ。</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Launching ====
Call twitter-client-display-timeline from ext.select() and twitter client will launch.

You can bind twitter client to some key like below.

>||
key.setViewKey("t",
    function (ev, arg) {
        ext.exec("twitter-client-display-timeline", arg);
    }, "Display your timeline", true);
||<

Your timeline will be displayed when 't' key is pressed in the browser window.

If you want to tweet directly, paste code like below to your .keysnail.js.

>||
key.setGlobalKey(["C-c", "t"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet", arg);
    }, "Tweet", true);
||<

You can tweet by pressing C-c t.

Next code allows you to tweet with the current page's title and URL by pressing C-c T.

>||
key.setGlobalKey(["C-c", "T"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet-this-page", arg);
    }, "Tweet with the title and URL of this page", true);
||<

==== Keybindings ====

By inserting the code below to PRESERVE area in your .keysnail.js, you can manipulate this client more easily.

>||
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

Put codes like blow to the PRESERVE area of the .keysnail.js and you can customize this plugin's behavior.

>||
plugins.options["twitter_client.update_interval"] = 2 * 60 * 1000;
plugins.options["twitter_client.block_users"] = ["foo", "bar"];
||<
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== 起動 ====
M-x などのキーから ext.select() を呼び出し twitter-client-display-timeline を選ぶと Twitter のタイムラインが表示されます。

次のようにして任意のキーへコマンドを割り当てておくことも可能です。

>||
key.setViewKey("t",
    function (ev, arg) {
        ext.exec("twitter-client-display-timeline", arg);
    }, "TL を表示", true);
||<

上記のような設定を .keysnail.js へ記述しておくことにより、ブラウズ画面において t キーを押すことでこのクライアントを起動させることが可能となります。

タイムラインを表示させず即座につぶやきたいという場合は、次のような設定がおすすめです。

>||
key.setGlobalKey(["C-c", "t"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet", arg);
    }, "つぶやく", true);
||<

こうしておくと C-c t を押すことで即座につぶやき画面を表示することが可能となります。

ページのタイトルと URL を使ってつぶやくことが多いのであれば、以下のような設定により作業を素早く行うことができるようになります。

>||
key.setGlobalKey(["C-c", "T"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet-this-page", arg);
    }, "このページのタイトルと URL を使ってつぶやく", true);
||<

KeySnail を使って、じゃんじゃんつぶやいてしまいましょう。

==== キーバインドの設定 ====

次のような設定を .keysnail.js の PRESERVE エリアへ張り付けておくと、かくだんに操作がしやすくなります。

>||
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

どのようなキーバインドとなっているかは、設定を見ていただければ分かるかと思います。気に入らなければ変更してしまってください。

このままではアルファベットが入力できないので、もし絞り込み健作などでアルファベットを入力したくなった場合は C-z を入力するか「閉じる」ボタン左の「地球マーク」をクリックし、編集モードへと切り替えてください。

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
twitter_client.use_popup_notification オプションが true に設定されていれば、新しいつぶやきが届いた際にポップアップで通知が行われるようになります。

また、クライアント実行中にもアクションからこの値を切り替えることが可能です。

=== オプションの設定 ===
以下に初期化ファイル PRESERVE エリアへの設定例を示します。

>||
plugins.options["twitter_client.update_interval"] = 2 * 60 * 1000;
plugins.options["twitter_client.block_users"] = ["foo", "bar"];
||<
]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
// 
// ==== 1.4.3 (2009 12/15) ==== 
// 
// * Migrated from tinyurl to j.mp (bit.ly)
// 
// ==== 1.4.2 (2009 12/15) ==== 
// 
// * Added favorited icon and changed add-to-favorite action behavior.
// * Made tweetWithTitleAndURL() recognize prefix argument.
// 
// ==== 1.4.0 (2009 12/14) ==== 
//
// * Added local action system 
//
// ==== 1.3.9 (2009 12/14) ====
//
// * Supported local keymap system
//
// ==== 1.3.8 (2009 12/05) ====
//
// * Supported % in the URL.
// * xulGrowl prototype
//
// ==== 1.3.7 (2009 11/28) ====
//
// * Fixed the bug user can't cancel the action "search".
//
// ==== 1.3.6 (2009 11/24) ====
//
// * Added description for official RT
//
// ==== 1.3.5 (2009 11/24) ====
//
// * Supported official RT.
//
// ==== 1.3.4 (2009 11/23) ====
//
// * Supported multiple URL in the message.
//
// ==== 1.3.3 (2009 11/16) ====
//
// * Made all messages to be unescaped.
//
// ==== 1.3.2 (2009 11/13) ====
//
// * Added character count to the tweet phase.
//
// ==== 1.3.1 (2009 11/03) ====
//
// * Fixed the crucial bug in the combineJSONCache.
//
// ==== 1.3.0 (2009 11/03) ====
//
// * Refactored!
// * Added action and ext manipulating favorites.
//
// ==== 1.2.8 (2009 11/01) ====
//
// * Fixed combineJSONCache again and again :(. I hope this fix the problem.
//
// ==== 1.2.8 (2009 11/01) ====
//
// * Fixed combineJSONCache again. (There were still bug ...)
//
// ==== 1.2.7 (2009 11/01) ====
//
// * Fixed combineJSONCache to avoid the status duplication which occured
//   when user tweets and its status immediately added.
//
// ==== 1.2.6 (2009 10/31) ====
//
// * Cleaned up codes. (Mainly options default value handling.)
// * Added "delete selected status" action.
// * Made all actions use oauthASyncRequest() instead of oauthSyncRequest().
//
// }} ======================================================================= //

var optionsDefaultValue = {
    "update_interval"              : 60 * 1000, // 1 minute
    "use_popup_notification"       : true,
    "main_column_width"            : [11, 70, 19],
    "timeline_count_beginning"     : 80,
    "timeline_count_every_updates" : 20,
    "unread_status_count_style"    : "color:#383838;font-weight:bold;",
    "automatically_begin"          : true,
    "keymap"                       : {},
    "block_users"                  : [],
    "black_users"                  : []
};

function getOption(aName) {
    var fullName = "twitter_client." + aName;
    if (typeof plugins.options[fullName] !== "undefined")
    {
        return plugins.options[fullName];
    }
    else
    {
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
    }
}

var twitterClient =
    (function () {
         // ================================================================================ //

         var twitterLastUpdated;
         var twitterPending;
         var immediatelyAddedStatuses = [];

         var twitterActions = [
             [function (status)
              {
                  if (status)
                      tweet();
              }, M({ja: "つぶやく : ", en: ""}) + "Tweet",
              "tweet"],
             [function (status)
              {
                  if (status)
                      tweet("@" + status.screen_name + " ", status.id);
              }, M({ja: "このつぶやきに返信 : ", en: ""}) + "Send reply message",
             "reply"],
             [function (status)
              {
                  if (status)
                      tweet("RT @" + status.screen_name + ": " + html.unEscapeTag(status.text));
              }, M({ja: "このつぶやきを => コメント付き ", en: ""}) + "RT (QT): Quote tweet",
             "retweet"],
             [function (status)
              {
                  if (status)
                      retweet(status.id);
              }, M({ja: "このつぶやきを => 公式 ", en: ""}) + "RT : Official Retweet",
              "official-retweet"],
             [function (status)
              {
                  if (status)
                      deleteStatus(status.id);
              }, M({ja: "このつぶやきを => 削除 : ", en: ""}) + "Delete this status",
              "delete-tweet"],
             [function (status)
              {
                  if (status)
                      addFavorite(status.id, status.favorited);
              }, M({ja: "このつぶやきを => お気に入りへ追加 / 削除 : ", en: ""}) + "Add / Remove this status to favorites",
              "add-to-favorite,c"],
             [function (status)
              {
                  if (status)
                  {
                      gBrowser.loadOneTab("http://twitter.com/" + status.screen_name
                                          + "/status/" + status.id, null, null, null, false);
                  }
              }, M({ja: "このつぶやきを => Twitter で見る : ", en: ""}) + "Show status in web page",
              "view-in-twitter,c"],
             [function (status)
              {
                  command.setClipboardText(html.unEscapeTag(status.text));
                  display.echoStatusBar(M({ja: "コピーしました", en: "Copied"}), 1000);
              }, M({ja: "このつぶやきを => クリップボードにコピー : ", en: ""}) + "Copy selected message",
              "copy-tweet,c"],
             [function (status)
              {
                  display.prettyPrint(html.unEscapeTag(status.text), {timeout: 6000, fade: 300});
              }, M({ja: "このつぶやきを => 全文表示 : ", en: ""}) + "Display entire message",
              "display-entire-message,c"],
             [function (status)
              {
                  if (status)
                      showTargetStatus(status.screen_name);
              }, M({ja: "このユーザのつぶやきを一覧表示 : ", en: ""}) + "Show Target status",
              "show-target-status"],
             [function (status)
              {
                  if (status)
                      showFavorites(status.user_id);
              }, M({ja: "このユーザのふぁぼり一覧を表示 : ", en: ""}) + "Show this users favorites",
              "show-user-favorites"],
             [function (status)
              {
                  if (status)
                      showMentions();
              }, M({ja: "自分の @ を一覧表示 : ", en: ""}) + "Show mentions",
              "show-mentions"],
             [function (status)
              {
                  if (status)
                      self.tweetWithTitleAndURL();
              }, M({ja: "現在のページのタイトルと URL を使ってつぶやく : ", en: ""}) + "Tweet with the current web page URL",
              "tweet-current-page"],
             [function (status)
              {
                  if (status)
                      search();
              }, M({ja: "単語を検索 : ", en: ""}) + "Search keyword",
              "search-word"],
             // [function (status)
             //  {
             //      command.setClipboardText(status.screen_name);
             //  }, M({ja: "このユーザの id をコピー : ", en: ""}) + "Copy id of the selected user",
             //  "copy-user-id,c"],
             [function (status)
              {
                  if (status)
                  {
                      var matched;

                      while ((matched = status.text.match("(h?t?tps?|ftp)(://[a-zA-Z0-9/?;#_*.:/=&%\\-]+)")))
                      {
                          var prefix = (matched[1] == "ftp") ? "ftp" : "http";
                          if (matched[1][matched[1].length - 1] == 's')
                              prefix += "s";

                          gBrowser.loadOneTab(prefix + matched[2], null, null, null, false);

                          status.text = status.text.slice(status.text.indexOf(matched[2]) + matched[2].length);
                      }
                  }
              }, M({ja: "メッセージ中の URL を開く : ", en: ""}) + "Visit URL in the message",
              "open-url,c"]
         ];

         // ================================================================================ //

         // Update interval in mili second
         var updateInterval = getOption("update_interval");

         // Show popup when timeline is updated
         var popUpStatusWhenUpdated = getOption("use_popup_notification");

         // [User name, Message, Information] in percentage
         var mainColumnWidth = getOption("main_column_width");

         var blockUsers = getOption("block_users");
         var blackUsers = getOption("black_users");
         var myScreenName;

         // ================================================================================ //
         // Timeline
         // ================================================================================ //

         var timelineCountBegining    = getOption("timeline_count_beginning");
         var timelineCountEveryUpdates = getOption("timeline_count_every_updates");

         function normalizeCount(n) {
             if (n <= 0)
                 n = 20;
             if (n > 200)
                 n = 200;

             return n;
         }

         timelineCountBegining = normalizeCount(timelineCountBegining);
         timelineCountEveryUpdates = normalizeCount(timelineCountEveryUpdates);

         var timelineCount = timelineCountBegining;

         // ================================================================================ //
         // Unread handler
         // ================================================================================ //

         const LAST_STATUS_KEY  = "extensions.keysnail.plugins.twitter_client.last_status_id";
         const LAST_MENTION_KEY = "extensions.keysnail.plugins.twitter_client.last_mention_id";

         var lastStatusID  = util.getUnicharPref(LAST_STATUS_KEY);
         var lastMentionID = util.getUnicharPref(LAST_MENTION_KEY);

         var unreadStatusCount   = 0;
         var unreadMentionsCount = 0;

         // ================================================================================ //
         // Statusbar
         // ================================================================================ //

         function setAttributes(aElem, aAttributes)
         {
             for (var key in aAttributes)
             {
                 aElem.setAttribute(key, aAttributes[key]);
             }
         }

         const CONTAINER_ID      = "keysnail-twitter-client-container";
         const UNREAD_STATUS_ID  = "keysnail-twitter-client-unread-status";

         var statusbarPanel      = document.getElementById("keysnail-status");
         var container           = document.getElementById(CONTAINER_ID);
         var unreadStatusLabel   = document.getElementById(UNREAD_STATUS_ID);

         var unreadStatusLabelStyle = getOption("unread_status_count_style");

         if (!container) {
             // create a new one
             container = document.createElement("hbox");
             setAttributes(container,
                           {
                               align: "center",
                               flex: 1,
                               insertafter: "keysnail-statusbar-icon",
                               id: CONTAINER_ID
                           });

             unreadStatusLabel = document.createElement("label");
             setAttributes(unreadStatusLabel,
                           {
                               id: UNREAD_STATUS_ID,
                               flex: 1,
                               value: "-"
                           });

             container.appendChild(unreadStatusLabel);

             statusbarPanel.appendChild(container);
         }

         unreadStatusLabel.setAttribute("style", unreadStatusLabelStyle);

         unreadStatusLabel.onclick = function () { self.showTimeline(); };

         // ============================== Arrange services ============================== //

         try {
             var alertsService = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
         } catch (x) {
             popUpStatusWhenUpdated = false;
         }

         var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
             .getService(Components.interfaces.nsIWindowMediator);

         // ============================== Popup notifications {{ ============================== //

         var unPopUppedStatuses;

         function showPopup(arg) {
             if (false /* plugins.lib.xulGrowl */)
             {
                 plugins.lib.xulGrowl.update(
                     {
                         title   : arg.title,
                         message : arg.message,
                         link    : arg.link,
                         icon    : arg.icon
                     }
                 );

                 setTimeout(function () {
                                if (typeof arg.callback === "function")
                                    arg.callback();
                            }, 1000);
             }
             else
             {
                 alertsService.showAlertNotification(arg.icon,
                                                     arg.title,
                                                     arg.message,
                                                     !!arg.link,
                                                     arg.link,
                                                     arg.observer);
             }
         }

         function showOldestUnPopUppedStatus() {
             var status = unPopUppedStatuses.pop();

             if ((blockUsers &&
                  blockUsers.some(function (username) username == status.user.screen_name))
                 || status.user.screen_name == myScreenName)
             {
                 util.message("ignored :: " + html.unEscapeTag(status.text) + " " + status.user.screen_name);

                 if (unPopUppedStatuses && unPopUppedStatuses.length)
                 {
                     showOldestUnPopUppedStatus();
                 }

                 return;
             }

             var browserWindow = wm.getMostRecentWindow("navigator:browser");
             if (!browserWindow || browserWindow.KeySnail != KeySnail)
             {
                 util.message("other window");
                 return;
             }

             function proc() {
                 if (!unPopUppedStatuses || !unPopUppedStatuses.length)
                     return;

                 showOldestUnPopUppedStatus();
             }

             showPopup({
                           icon     : status.user.profile_image_url,
                           title    : status.user.name,
                           message  : html.unEscapeTag(status.text),
                           link     : "http://twitter.com/" + status.user.screen_name + "/status/" + status.id,
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
             if (unPopUppedStatuses && unPopUppedStatuses.length > 0)
                 unPopUppedStatuses = statuses.concat(unPopUppedStatuses);
             else
                 unPopUppedStatuses = statuses;

             showOldestUnPopUppedStatus();
         }

         // ============================== }} Popup notifications ============================== //

         function shortenURL(aURL) {
             const id  = "stillpedant";
             const key = "R_168719821d1100c59352962dce863251";

             var xhr = new XMLHttpRequest();
             // bit.ly
             var endPoint = "http://api.j.mp/shorten?" +              
                 util.format('version=2.0.1&login=%s&apiKey=%s&longUrl=%s', id, key, encodeURIComponent(aURL));

             xhr.mozBackgroundRequest = true;
             xhr.open("GET", endPoint, false);
             xhr.send(null);

             var response = util.safeEval("(" + xhr.responseText + ")");

             if (response && response.results && response.results[aURL])
                 return response.results[aURL].shortUrl;

             return aURL;
         }

         function getTinyURL(aURL) {
             var xhr = new XMLHttpRequest();
             var endPoint = "http://tinyurl.com/api-create.php?url=" + aURL;
             xhr.mozBackgroundRequest = true;
             xhr.open("GET", endPoint, false);
             xhr.send(null);

             return xhr.responseText;
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

         function combineJSONCache(aNew, aOld) {
             if (!aOld)
                 return aNew;

             if (immediatelyAddedStatuses.length)
             {
                 // remove immediately added statuses
                 var removeCount = aOld.indexOf(immediatelyAddedStatuses[0]) + 1;

                 if (removeCount > 0)
                 {
                     aOld.splice(0, removeCount);
                 }
             }

             immediatelyAddedStatuses = [];

             // search
             var oldid = aOld[0].id;
             var newStatusCount = aNew.map(function (status) status.id).indexOf(oldid);

             var newStatuses;

             if (newStatusCount == -1)
             {
                 // all statuses in aNew is updated status
                 newStatuses = aNew;
             }
             else
             {
                 newStatuses = aNew.slice(0, newStatusCount);
             }

             var latestTimeline = newStatuses.concat(aOld);

             if (popUpStatusWhenUpdated && newStatuses.length)
                 popUpNewStatuses(newStatuses);

             return latestTimeline;
         }

         // ============================== OAuth ============================== //

         var oauthInfo = {
             signatureMethod : "HMAC-SHA1",
             consumerKey     : "q8bLrmPJJ54hv5VGSXUfvQ",
             consumerSecret  : "34Xtbtmqikl093nzaXg6ePay5EJJMu0cm3qervD4",
             requestToken    : "http://twitter.com/oauth/request_token",
             accessToken     : "http://twitter.com/oauth/access_token",
             authorizeURL    : "http://twitter.com/oauth/authorize"
         };

         var prefKeys = {
             oauth_token        : "extensions.keysnail.plugins.twitter_client.oauth_token",
             oauth_token_secret : "extensions.keysnail.plugins.twitter_client.oauth_token_secret"
         };

         var oauthTokens = {
             oauth_token        : util.getUnicharPref(prefKeys.oauth_token, ""),
             oauth_token_secret : util.getUnicharPref(prefKeys.oauth_token_secret, "")
         };

         var context = {};

         if (!userscript.require("oauth.js", context)) {
             display.notify(L(util.xmlGetLocaleString(PLUGIN_INFO.name)) + " :: " +
                            M({ja: "このプラグインの動作には oauth.js が必要です。 oauth.js をプラグインディレクトリ内に配置した上でお試し下さい。",
                               en: "This plugin requires oauth.js but not found. Please locate oauth.js to the plugin directory."}));
         }

         var OAuth = context.OAuth();

         // ================================================================================ //
         // Basic oauth request methods
         // ================================================================================ //

         function oauthSyncRequest(aOptions) {
             var xhr = new XMLHttpRequest();

             var accessor = {
                 consumerSecret : oauthInfo.consumerSecret,
                 tokenSecret    : oauthTokens.oauth_token_secret
             };

             var message = {
                 action     : aOptions.action,
                 method     : aOptions.method,
                 parameters : [
                     ["oauth_consumer_key"     , oauthInfo.consumerKey],
                     ["oauth_token"            , oauthTokens.oauth_token],
                     ["oauth_signature_method" , oauthInfo.signatureMethod],
                     ["oauth_version"          , "1.0"]
                 ]
             };

             if (aOptions.parameters) {
                 message.parameters = message.parameters.concat(aOptions.parameters);
             }

             OAuth.setTimestampAndNonce(message);
             OAuth.SignatureMethod.sign(message, accessor);

             var oAuthArgs = OAuth.getParameterMap(message.parameters);
             var authHeader = OAuth.getAuthorizationHeader("http://twitter.com/", oAuthArgs);

             xhr.mozBackgroundRequest = true;
             xhr.open(message.method, message.action, false);
             xhr.setRequestHeader("Authorization", authHeader);
             xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

             xhr.send(aOptions.send || null);

             return xhr.responseText;
         }

         function oauthASyncRequest(aOptions, aCallBack) {
             var xhr = new XMLHttpRequest();

             xhr.onreadystatechange = function (aEvent) {
                 aCallBack(aEvent, xhr);
             };

             var accessor = aOptions.accessor ||
                 {
                     consumerSecret : oauthInfo.consumerSecret,
                     tokenSecret    : oauthTokens.oauth_token_secret
                 };

             var message = {
                 action     : aOptions.action,
                 method     : aOptions.method,
                 parameters : [
                     ["oauth_consumer_key"     , oauthInfo.consumerKey],
                     ["oauth_signature_method" , oauthInfo.signatureMethod],
                     ["oauth_version"          , "1.0"]
                 ]
             };

             if (!aOptions.authorize)
                 message.parameters.push(["oauth_token", oauthTokens.oauth_token]);

             if (aOptions.parameters)
             {
                 outer:
                 for each (var params in aOptions.parameters)
                 {
                     for (let i = 0; i < message.parameters; ++i)
                     {

                         if (params[0] == message.parameters[i][0])
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

             OAuth.setTimestampAndNonce(message);
             OAuth.SignatureMethod.sign(message, accessor);

             var oAuthArgs  = OAuth.getParameterMap(message.parameters);
             var authHeader = OAuth.getAuthorizationHeader(aOptions.host || "http://twitter.com/", oAuthArgs);

             xhr.mozBackgroundRequest = true;
             xhr.open(message.method, message.action, true);
             xhr.setRequestHeader("Authorization", authHeader);
             xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

             xhr.send(aOptions.send || null);
         }

         // ================================================================================ //
         // Authorization methods
         // ================================================================================ //

         function authorize() {
             oauthASyncRequest(
                 {
                     action   : oauthInfo.requestToken,
                     method   : "GET",
                     accessor : {
                         consumerSecret : oauthInfo.consumerSecret,
                         tokenSecret    : ""
                     },
                     authorize : true
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status == 200)
                         {
                             var parts = xhr.responseText.split("&");

                             try {
                                 oauthTokens.oauth_token        = parts[0].split("=")[1];
                                 oauthTokens.oauth_token_secret = parts[1].split("=")[1];

                                 gBrowser.loadOneTab("http://twitter.com/oauth/authorize?oauth_token=" + oauthTokens.oauth_token,
                                                     null, null, null, false);
                             } catch (e) {
                                 display.notify(e + xhr.responseText);
                             }
                         }
                         else if (xhr.status >= 500)
                         {
                             // whale error
                             display.notify("Whale error :: " + xhr.responseText);
                         }
                         else
                         {
                             // unknow error
                             display.notify("Unknown error :: " + xhr.responseText);
                         }
                     }
                 }
             );
         }

         function reAuthorize() {
             util.setUnicharPref(prefKeys.oauth_token, "");
             util.setUnicharPref(prefKeys.oauth_token_secret, "");
             my.twitterJSONCache = null;
             authorizationSequence();
         }

         function authorizationSequence() {
             authorize();

             prompt.read(M({ja: "認証が終了したら Enter キーを押してください",
                            en: "Press Enter When Authorization Finished:"}),
                         function (aReadStr) {
                             if (aReadStr == null)
                                 return;

                             getAccessToken(function () {
                                                showFollowersStatus();
                                            });
                         });
         }

         function getAccessToken(aCallBack) {
             oauthASyncRequest(
                 {
                     action : oauthInfo.accessToken,
                     method : "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status == 200)
                         {
                             try {
                                 var parts = xhr.responseText.split("&");

                                 oauthTokens.oauth_token = parts[0].split("=")[1];
                                 oauthTokens.oauth_token_secret = parts[1].split("=")[1];
                                 util.setUnicharPref(prefKeys.oauth_token, oauthTokens.oauth_token);
                                 util.setUnicharPref(prefKeys.oauth_token_secret, oauthTokens.oauth_token_secret);

                                 if (typeof aCallBack == "function")
                                     aCallBack();
                             } catch (e) {
                                 display.notify(e +  xhr.responseText);
                             }
                         }
                         else if (xhr.status >= 500)
                         {
                             // whale error
                             util.message("whale error :: " + xhr.responseText);
                         }
                         else
                         {
                             // unknown error
                             util.message("unknown error :: " + xhr.responseText);
                         }
                     }
                 }
             );
         }

         // ============================== Actions ============================== //

         function showMentions() {
             oauthASyncRequest(
                 {
                     action: "http://twitter.com/statuses/mentions.json",
                     method: "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status != 200) {
                             display.echoStatusBar(M({en: "Failed to get mentions", ja: "言及一覧の取得に失敗しました"}));
                             return;
                         }

                         var statuses = util.safeEval(xhr.responseText);

                         // no filter
                         callSelector(statuses, M({ja: "言及一覧", en: "Mentions"}), true);
                     }
                 });
         }

         function showFavorites(aTargetID) {
             oauthASyncRequest(
                 {
                     action: "http://twitter.com/favorites.json" + (aTargetID ? ("?id=" + aTargetID) : ""),
                     method: "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status != 200) {
                             display.echoStatusBar(M({en: "Failed to get favorites", ja: "お気に入り一覧の取得に失敗しました"}));
                             return;
                         }

                         var statuses = util.safeEval(xhr.responseText);

                         callSelector(statuses, M({ja: "お気に入り一覧", en: "Favorites"}));
                     }
                 });
         }

         function addFavorite(aStatusID, aDelete) {
             oauthASyncRequest(
                 {
                     action: util.format("http://twitter.com/favorites/%s/%s.json", aDelete ? "destroy" : "create", aStatusID),
                     method: "POST"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         var errorMsg = aDelete ? M({ja: "お気に入りから削除できませんでした", en: "Failed to remove status from favorites"})
                         : M({ja: "お気に入りに追加できませんでした", en: "Failed to add status to favorites"});
                         var successMsg = aDelete ? M({ja: "お気に入りから削除しました", en: "Removed status from favorites"})
                         : M({ja: "お気に入りに追加しました", en: "Added status to favorites"});

                         if (xhr.status != 200) {
                             display.echoStatusBar(errorMsg, 2000);
                             return;
                         }

                         var status = util.safeEval("(" + xhr.responseText + ")");
                         if (!status)
                             return;

                         var icon_url  = status.user.profile_image_url;
                         var user_name = status.user.name;
                         var message   = html.unEscapeTag(status.text);

                         showPopup({
                                       icon     : icon_url,
                                       title    : successMsg,
                                       message  : user_name + ": " + message,
                                       link     : null
                                   });

                         modifyCache(status.id, function (status) {
                                         status.favorited = !aDelete;
                                     });
                     }
                 }
             );
         }

         function search() {
             function doSearch(aWord) {
                 if (!aWord)
                     return;

                 oauthASyncRequest(
                     {
                         action: "http://search.twitter.com/search.json?q=" + encodeURIComponent(aWord) + "&rpp=100",
                         method: "POST"
                     },
                     function (aEvent, xhr) {
                         if (xhr.readyState == 4) {
                             if (xhr.status != 200) {
                                 display.echoStatusBar(M({ja: "検索に失敗しました",
                                                          en: "Failed to search word"}), 3000);
                                 return;
                             }

                             var results = (util.safeEval("(" + xhr.responseText + ")") || {"results":[]}).results;

                             if (!results || !results.length) {
                                 display.echoStatusBar(M({ja: aWord + L(" に対する検索結果はありません"),
                                                          en: "No results for " + aWord}), 3000);
                                 return;
                             }

                             prompt.selector(
                                 {
                                     message: "regexp:",
                                     collection: results.map(
                                         function (result) [result.profile_image_url, result.from_user, html.unEscapeTag(result.text)]
                                     ),
                                     style: ["color:#003870;", null],
                                     width: [15, 85],
                                     header: ["From", 'Search result for "' + aWord + '"'],
                                     flags: [ICON | IGNORE, 0, 0],
                                     filter: function (aIndex) {
                                         var result = results[aIndex];

                                         return (aIndex < 0 ) ? [null] :
                                             [{
                                                  screen_name : result.from_user,
                                                  id          : result.id,
                                                  user_id     : result.from_user_id,
                                                  text        : html.unEscapeTag(result.text),
                                                  favorited   : result.favorited
                                              }];
                                     },
                                     keymap: getOption("keymap"),
                                     actions: twitterActions
                                 });
                         }
                     }
                 );
             }

             prompt.read("search:", doSearch, null, null, null, 0, "twitter_search");
         }

         function retweet(aID) {
             var parameters = [["source", "KeySnail"]];
             var aQuery     = "source=KeySnail";

             oauthASyncRequest(
                 {
                     action     : "http://api.twitter.com/1/statuses/retweet/" + aID + ".json",
                     method     : "POST",
                     parameters : parameters,
                     send       : aQuery,
                     host       : "http://api.twitter.com/"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4)
                     {
                         if ((xhr.status == 401) && (xhr.responseText.indexOf("expired") != -1))
                         {
                             // token expired
                             reAuthorize();
                         }
                         else if (xhr.status != 200)
                         {
                             // misc error
                             showPopup({
                                           title    : M({ja: "ごめんなさい", en: "I'm sorry..."}),
                                           message  : M({ja: "RT に失敗しました [Twitter のサイトへ行き、アカウントの言語環境を英語に変更した上でもう一度お試し下さい]",
                                                         en: "Failed to ReTweet"}) + " (" + xhr.status + ")"
                                       });
                         }
                         else
                         {
                             // succeeded
                             var status    = util.safeEval("(" + xhr.responseText + ")");
                             var icon_url  = status.user.profile_image_url;
                             var user_name = status.user.name;
                             var message   = html.unEscapeTag(status.text);

                             showPopup({
                                           icon    : icon_url,
                                           title   : M({ja: "RT しました", en: "ReTweeted"}),
                                           message : message
                                       });
                         }
                     }
                 }
             );
         }

         function tweet(aInitialInput, aReplyID) {
             var statusbar = document.getElementById('statusbar-display');
             var limit = 140;

             prompt.reader(
                 {
                     message: "tweet:",
                     initialcount: 0,
                     initialinput: aInitialInput,
                     group: "twitter_tweet",
                     onChange: function (arg) {
                         var current = arg.textbox.value;
                         var length  = current.length;
                         var count   = limit - length;
                         var msg     = M({ja: ("残り " + count + " 文字"), en: count});

                         if (count < 0)
                         {
                             msg = M({ja: ((-count) + " 文字オーバー"), en: ("Over " + (-count) + " characters")});
                         }

                         statusbar.label = msg;
                     },
                     callback: function (aTweet) {
                         statusbar.label = "";

                         if (aTweet == null)
                             return;

                         var parameters = [["source", "KeySnail"], ["status" , aTweet]];
                         if (aReplyID)
                             parameters.push(["in_reply_to_status_id", aReplyID.toString()]);;

                         var aQuery = "source=KeySnail&status=" + encodeURIComponent(aTweet);
                         if (aReplyID)
                             aQuery += "&in_reply_to_status_id=" + aReplyID;

                         oauthASyncRequest(
                             {
                                 action     : "http://twitter.com/statuses/update.json",
                                 method     : "POST",
                                 send       : aQuery,
                                 parameters : parameters
                             },
                             function (aEvent, xhr) {
                                 if (xhr.readyState == 4)
                                 {
                                     if ((xhr.status == 401) && (xhr.responseText.indexOf("expired") != -1))
                                     {
                                         // token expired
                                         reAuthorize();
                                     }
                                     else if (xhr.status != 200)
                                     {
                                         // misc error
                                         showPopup({
                                                       title   : M({ja: "ごめんなさい", en: "I'm sorry..."}),
                                                       message : M({ja: "つぶやけませんでした",
                                                                    en: "Failed to tweet"}) + " (" + xhr.status + ")"
                                                   });
                                     }
                                     else
                                     {
                                         // succeeded
                                         var status = util.safeEval("(" + xhr.responseText + ")");
                                         // immediately add
                                         my.twitterJSONCache.unshift(status);
                                         immediatelyAddedStatuses.push(status);

                                         myScreenName = status.user.screen_name;

                                         var icon_url  = status.user.profile_image_url;
                                         var user_name = status.user.name;
                                         var message   = html.unEscapeTag(status.text);
                                         showPopup({
                                                       icon    : icon_url,
                                                       title   : user_name,
                                                       message : message
                                                   });
                                     }
                                 }
                             }
                         );
                     }
                 }
             );
         }

         function deleteStatus(aStatusID) {
             oauthASyncRequest(
                 {
                     action : "http://twitter.com/statuses/destroy/" + aStatusID + ".json",
                     method : "DELETE"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status != 200) {


                             display.echoStatusBar(M({ja: 'ステータスの削除に失敗しました。',
                                                      en: "Failed to delete status"}), 2000);
                             return;
                         }

                         // delete from cache
                         for (var i = 0; i < my.twitterJSONCache.length; ++i) {
                             if (my.twitterJSONCache[i].id == aStatusID) {
                                 my.twitterJSONCache.splice(i, 1);
                                 break;
                             }
                         }

                         setLastStatus(my.twitterJSONCache);

                         display.echoStatusBar(M({ja: 'ステータスが削除されました',
                                                  en: "Status deleted"}), 2000);
                     }
                 });
         }

         function showFollowersStatus(aArg) {
             var updateForced = (aArg != null);

             if (updateForced || !my.twitterJSONCache) {
                 if (twitterPending) {
                     display.echoStatusBar(M({ja: 'Twitter へリクエストを送信しています。しばらくお待ち下さい。',
                                              en: "Requesting to the Twitter ... Please wait."}), 2000);
                 } else {
                     // rebuild cache
                     self.updateStatusesCache(
                         function () {
                             callSelector(my.twitterJSONCache);
                             setLastStatus(my.twitterJSONCache);
                         }, updateForced);
                 }
             } else {
                 // use cache
                 callSelector(my.twitterJSONCache);
                 setLastStatus(my.twitterJSONCache);
             }
         }

         function showTargetStatus(target) {
             oauthASyncRequest(
                 {
                     action : "http://twitter.com/statuses/user_timeline/" + target + ".json?count=" + timelineCountEveryUpdates,
                     method : "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status != 200) {
                             display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。',
                                                      en: "Failed to get statuses"}), 2000);
                             return;
                         }

                         var statuses = util.safeEval(xhr.responseText) || [];
                         callSelector(statuses, M({ja: target + " のつぶやき一覧", en: "Tweets from " + target}));
                     }
                 });
             return;
         }

         // ================================================================================ //
         // Sub methods
         // ================================================================================ //

         const favoritedIcon = 'data:image/png;base64,' +
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

         function callSelector(aStatuses, aMessage, aNoFilter) {
             var current = new Date();

             // ignore black users
             var statuses = aNoFilter ? aStatuses :
                 aStatuses.filter(
                     function (status) blackUsers.every(function (name) status.user.screen_name !== name)
                 );

             function favIconGetter(aRow) aRow[0].favorited ? favoritedIcon : "";

             var collection = statuses.map(
                 function (status) {
                     var created = Date.parse(status.created_at);
                     var matched = status.source.match(">(.*)</a>");

                     return [status,
                             status.user.profile_image_url,
                             status.user.name,
                             html.unEscapeTag(status.text),
                             favIconGetter,
                             util.format("%s %s",
                                         getElapsedTimeString(current - created),
                                         (matched ? matched[1] : "Web"),
                                         (status.in_reply_to_screen_name ?
                                          " to " + status.in_reply_to_screen_name : ""))];
                 }
             );

             const ico = ICON | IGNORE;
             const hid = HIDDEN | IGNORE;

             var helpMessage = M({ja: ' : そのまま Enter でつぶやき画面へ。 Ctrl + i でアクションを選択。 Ctrl + Enter でクライアントを閉じずに連続アクション。',
                                  en: " : Press Enter to tweet. Ctrl + i (or your defined one) to select the action!"});

             if (!aMessage)
                 aMessage = M({ja: "タイムライン", en: "Timeline"});

             prompt.selector(
                 {
                     message    : "pattern:",
                     collection : collection,
                     // status, icon, name, message, fav-icon, info
                     flags      : [hid, ico, 0, 0, ico, 0],
                     header     : [M({ja: 'ユーザ', en: "User"}), aMessage + helpMessage, M({ja : "情報", en: 'Info'})],
                     style      : ["color:#0e0067;", null, "color:#660025;"],
                     width      : mainColumnWidth,
                     filter     : function (aIndex) {
                         var status = statuses[aIndex];
                         
                         return (aIndex < 0 ) ? [null] :
                             [{
                                  screen_name : status.user.screen_name,
                                  id          : status.id,
                                  user_id     : status.user.id,
                                  text        : html.unEscapeTag(status.text),
                                  favorited   : status.favorited
                              }];
                     },
                     keymap  : getOption("keymap"),
                     actions : twitterActions
                 });
         }

         function modifyCache(aId, proc) {
             for each (var status in my.twitterJSONCache)
             {
                 if (status.id === aId)
                 {
                     proc(status);
                 }
             }
         }

         function setLastStatus(aStatuses) {
             if (aStatuses.length) {
                 lastStatusID = aStatuses[0].id;
                 util.setUnicharPref(LAST_STATUS_KEY, lastStatusID);
                 self.updateStatusbar();
             }
         }

         function getStatusPos(aJSON, aID) {
             if (!aID)
                 return aJSON.length;

             for (var i = 0; i < aJSON.length; ++i) {
                 if (aJSON[i].id == aID)
                     return i;
             }

             return aJSON.length;
         }

         /**
          * @public
          */
         var self = {
             updateStatusesCache: function (aAfterWork, aNoRepeat) {
                 twitterPending = true;

                 oauthASyncRequest(
                     {
                         action : "http://twitter.com/statuses/friends_timeline.json?count=" + timelineCount,
                         method : "GET"
                     },
                     function (aEvent, xhr) {
                         if (xhr.readyState == 4) {
                             twitterPending = false;

                             if (xhr.status != 200) {
                                 display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。',
                                                          en: "Failed to get statuses"}), 2000);
                             } else {
                                 var statuses = util.safeEval(xhr.responseText) || [];

                                 twitterLastUpdated = new Date();
                                 my.twitterJSONCache = combineJSONCache(statuses, my.twitterJSONCache);

                                 timelineCount = timelineCountEveryUpdates;

                                 self.updateStatusbar();
                             }

                             if (!aNoRepeat) {
                                 my.twitterStatusesCacheUpdater = setTimeout(self.updateStatusesCache, updateInterval);
                             }

                             if (typeof aAfterWork == "function")
                                 aAfterWork();
                         }
                     });
             },

             togglePopupStatus: function () {
                 popUpStatusWhenUpdated = !popUpStatusWhenUpdated;
                 display.echoStatusBar(M({ja: ("ポップアップ通知を" + (popUpStatusWhenUpdated ? "有効にしました" : "無効にしました")),
                                          en: ("Pop up " + (popUpStatusWhenUpdated ? "enabled" : "disabled"))}), 2000);
             },

             reAuthorize: function () {
                 reAuthorize();
             },

             tweet: function () {
                 tweet();
             },

             tweetWithTitleAndURL: function (ev, arg) {
                 tweet((arg ? "" : '"' + content.document.title + '" - ') + shortenURL(window.content.location.href));
             },

             showMentions: function () {
                 showMentions();
             },

             search: function () {
                 search();
             },

             showTimeline: function (aEvent, aArg) {
                 if (!oauthTokens.oauth_token || !oauthTokens.oauth_token_secret) {
                     authorizationSequence();
                 } else {
                     showFollowersStatus(aArg);
                 }
             },

             showFavorites: function () {
                 showFavorites();
             },

             updateStatusbar: function () {
                 // calc unread statuses count
                 unreadStatusCount = getStatusPos(my.twitterJSONCache, lastStatusID);
                 unreadStatusLabel.setAttribute("value", unreadStatusCount);
                 unreadStatusLabel.setAttribute("tooltiptext", unreadStatusCount + M({ja: " 個の未読ステータスがあります",
                                                                                      en: " unread statuses"}));
             }
         };

         return self;
     })();

// Add exts {{ ============================================================== //

ext.add("twitter-client-display-timeline", twitterClient.showTimeline,
        M({ja: 'TL を表示',
           en: "Display your timeline"}));

ext.add("twitter-client-tweet", twitterClient.tweet,
        M({ja: 'つぶやく',
           en: "Tweet!"}));

ext.add("twitter-client-tweet-this-page", twitterClient.tweetWithTitleAndURL,
        M({ja: 'このページのタイトルと URL を使ってつぶやく',
           en: "Tweet with the title and URL of this page"}));

ext.add("twitter-client-search-word", twitterClient.search,
        M({ja: 'Twitter 検索',
           en: "Search word on Twitter"}));

ext.add("twitter-client-show-mentions", twitterClient.showMentions,
        M({ja: '@ 一覧表示 (言及一覧)',
           en: "Display @ (Show mentions)"}));

ext.add("twitter-client-show-favorites", twitterClient.showFavorites,
        M({ja: 'ふぁぼり一覧表示',
           en: "Display favorites"}));

ext.add("twitter-client-toggle-popup-status", twitterClient.togglePopupStatus,
        M({ja: 'ポップアップ通知の切り替え',
           en: "Toggle popup status"}));

ext.add("twitter-client-reauthorize", twitterClient.reAuthorize,
        M({ja: '再認証',
           en: "Reauthorize"}));

// }} ======================================================================= //

if (my.twitterStatusesCacheUpdater)
    clearTimeout(my.twitterStatusesCacheUpdater);

if (getOption("automatically_begin")) {
    twitterClient.updateStatusesCache();
}
