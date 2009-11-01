// PLUGIN INFO: {{{
var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Yet Another Twitter Client KeySnail</name>
    <description>Make KeySnail behave like Twitter client</description>
    <description lang="ja">KeySnail を Twitter クライアントに</description>
    <version>1.2.7</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/yet-another-twitter-client-keysnail.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/yet-another-twitter-client-keysnail.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.3</minVersion>
    <include>main</include>
    <provides>
        <ext>twitter-client-display-timeline</ext>
        <ext>twitter-client-tweet</ext>
        <ext>twitter-client-tweet-this-page</ext>
        <ext>twitter-client-show-mentions</ext>
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
// }}}

// ChangeLog : {{{
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
// }}}

var optionsDefaultValue = {
    "update_interval"              : 60 * 1000, // 1 minute
    "use_popup_notification"       : true,
    "main_column_width"            : [11, 68, 21],
    "timeline_count_beginning"     : 80,
    "timeline_count_every_updates" : 20,
    "unread_status_count_style"    : "color:#383838;font-weight:bold;",
    "automatically_begin"          : true
};

function getOption(aName) {
    var fullName = "twitter_client." + aName;
    if (typeof(plugins.options[fullName]) != "undefined") {
        return plugins.options[fullName];
    } else {
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
             [function (status) {
                  if (status)
                      tweet();
              }, M({ja: "つぶやく : ", en: ""}) + "Tweet"],
             [function (status) {
                  if (status) {
                      tweet("@" + status.screen_name + " ", status.id);
                  }
              }, M({ja: "返信 : ", en: ""}) + "Send reply message"],
             [function (status) {
                  if (status) {
                      tweet("RT @" + status.screen_name + ": " + html.unEscapeTag(status.text));
                  }
              }, "RT : Retweet"],
             [function (status) {
                  if (status) {
                      showTargetStatus(status.screen_name);
                  }
              }, M({ja: "選択中ユーザのつぶやきを一覧表示 : ", en: ""}) + "Show Target status"],
             [function (status) {
                  if (status) {
                      deleteStatus(status.id);
                  }
              }, M({ja: "このつぶやきを削除 : ", en: ""}) + "Delete this status"],
             [function (status) {
                  if (status) {
                      showMentions();
                  }
              }, M({ja: "@ を一覧表示 : ", en: ""}) + "Show mentions"],
             [function (status) {
                  if (status) {
                      gBrowser.loadOneTab("http://twitter.com/" + status.screen_name
                                          + "/status/" + status.id, null, null, null, false);
                  }
              }, M({ja: "Twitter のサイトでそのつぶやきを見る : ", en: ""}) + "Show status in web page"],
             [function (status) {
                  command.setClipboardText(status.text);
              }, M({ja: "選択中のメッセージをコピー : ", en: ""}) + "Copy selected message"],
             [function (status) {
                  if (status) {
                      self.tweetWithTitleAndURL();
                  }
              }, M({ja: "現在のページのタイトルと URL を使ってつぶやく : ", en: ""}) + "Tweet with the current web page URL"],
             [function (status) {
                  if (status)
                      search();
              }, M({ja: "単語を検索 : ", en: ""}) + "Search keyword"],
             [function (status) {
                  if (status) {
                      var matched = status.text.match("(https?|ftp)(://[a-zA-Z0-9/?#_.\\-]+)");
                      if (matched) {
                          gBrowser.loadOneTab(matched[1] + matched[2], null, null, null, false);
                      }
                  }
              }, M({ja: "メッセージ中の URL を開く : ", en: ""}) + "Visit URL in the message"]
         ];

         // ================================================================================ //

         // Update interval in mili second
         var updateInterval = getOption("update_interval");

         // Show popup when timeline is updated
         var popUpStatusWhenUpdated = getOption("use_popup_notification");

         // [User name, Message, Information] in percentage
         var mainColumnWidth = getOption("main_column_width");

         var blockUser = getOption("block_users");
         var myScreenName;

         // ================================================================================ //
         // Timeline {{
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
         // }}
         // ================================================================================ //

         // ================================================================================ //
         // Unread handler {{
         // ================================================================================ //

         const LAST_STATUS_KEY  = "extensions.keysnail.plugins.twitter_client.last_status_id";
         const LAST_MENTION_KEY = "extensions.keysnail.plugins.twitter_client.last_mention_id";

         var lastStatusID  = util.getUnicharPref(LAST_STATUS_KEY);
         var lastMentionID = util.getUnicharPref(LAST_MENTION_KEY);

         var unreadStatusCount   = 0;
         var unreadMentionsCount = 0;

         // ================================================================================ //
         // }}
         // ================================================================================ //

         // ================================================================================ //
         // Statusbar {{
         // ================================================================================ //

         function setAttributes(aElem, aAttributes) {
             for (var key in aAttributes) {
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

         // ================================================================================ //
         // }}
         // ================================================================================ //

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
         var popUpNewStatusesObserver = {
             observe: function (subject, topic, data) {
                 if (topic == "alertclickcallback") {
                     gBrowser.loadOneTab(data, null, null, null, false);
                 }

                 if (!unPopUppedStatuses || !unPopUppedStatuses.length)
                     return;

                 showOldestUnPopUppedStatus();
             }
         };

         function showOldestUnPopUppedStatus() {
             var status = unPopUppedStatuses.pop();

             if ((blockUser &&
                  blockUser.some(function (username) username == status.user.screen_name))
                 || status.user.screen_name == myScreenName) {
                 util.message("ignored :: " + html.unEscapeTag(status.text) + " from " + status.user.screen_name);

                 if (unPopUppedStatuses && unPopUppedStatuses.length) {
                     showOldestUnPopUppedStatus();
                 }

                 return;
             }

             var browserWindow = wm.getMostRecentWindow("navigator:browser");
             if (!browserWindow || browserWindow.KeySnail != KeySnail) {
                 util.message("other window");
                 return;
             }

             alertsService.showAlertNotification(status.user.profile_image_url,
                                                 status.user.name,
                                                 html.unEscapeTag(status.text),
                                                 true,
                                                 "http://twitter.com/" + status.user.screen_name + "/status/" + status.id,
                                                 popUpNewStatusesObserver);
         }

         function popUpNewStatuses(statuses) {
             if (unPopUppedStatuses && unPopUppedStatuses.length > 0)
                 unPopUppedStatuses = statuses.concat(unPopUppedStatuses);
             else
                 unPopUppedStatuses = statuses;

             showOldestUnPopUppedStatus();
         }

         // ============================== }} Popup notifications ============================== //

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

             var oldid = aOld[0].id;
             for (var i = 0; i < aNew.length; ++i)
             {
                 if (aNew[i].id == oldid)
                 {
                     // ignore immediately added status (from tweet())
                     for (var j = 0; j < immediatelyAddedStatuses.length; ++j)
                     {
                         if (immediatelyAddedStatuses[j].id == aNew[i].id)
                         {
                             var toRemoveIndex = aOld.indexOf(immediatelyAddedStatuses[j]);
                             if (toRemoveIndex != -1)
                                 aOld.splice(toRemoveIndex, 1);
                             continue;
                         }
                     }
                     break;                     
                 }
             }

             immediatelyAddedStatuses = [];

             if (i > 1) {
                 var updatedStatus = aNew.slice(0, i);
                 var latestTimeline = updatedStatus.concat(aOld);

                 if (popUpStatusWhenUpdated)
                     popUpNewStatuses(updatedStatus);

                 return latestTimeline;
             }

             return aOld;
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

         function reAuthorize() {
             util.setUnicharPref(prefKeys.oauth_token, "");
             util.setUnicharPref(prefKeys.oauth_token_secret, "");
             my.twitterJSONCache = null;
             authorizationSequence();
         }

         function authorize() {
             var accessor = {
                 consumerSecret : oauthInfo.consumerSecret,
                 tokenSecret    : ""
             };

             var message = {
                 action     : oauthInfo.requestToken,
                 method     : "GET",
                 parameters : [
                     ["oauth_consumer_key"     , oauthInfo.consumerKey],
                     ["oauth_signature_method" , oauthInfo.signatureMethod],
                     ["oauth_version"          , "1.0"]
                 ]
             };

             OAuth.setTimestampAndNonce(message);
             OAuth.SignatureMethod.sign(message, accessor);

             var oAuthArgs = OAuth.getParameterMap(message.parameters);
             var authHeader = OAuth.getAuthorizationHeader("http://twitter.com/", oAuthArgs);

             var xhr = new XMLHttpRequest();
             xhr.mozBackgroundRequest = true;
             xhr.open(message.method, message.action, true);
             xhr.setRequestHeader("Authorization", authHeader);

             xhr.onreadystatechange = function () {
                 if (xhr.readyState == 4) {
                     if (xhr.status == 200) {
                         var parts = xhr.responseText.split("&");

                         try {
                             oauthTokens.oauth_token        = parts[0].split("=")[1];
                             oauthTokens.oauth_token_secret = parts[1].split("=")[1];

                             gBrowser.loadOneTab("http://twitter.com/oauth/authorize?oauth_token=" + oauthTokens.oauth_token,
                                                 null, null, null, false);
                         } catch (e) {
                             display.notify(e + xhr.responseText);
                         }
                     } else if (xhr.status >= 500) {
                         // whale error
                         display.notify("Whale error :: " + xhr.responseText);
                     } else {
                         // unknow error
                         display.notify("Unknown error :: " + xhr.responseText);
                     }
                 }
             };

             xhr.send(null);
         }

         function getAccessToken(aCallBack) {
             var accessor = {
                 consumerSecret : oauthInfo.consumerSecret,
                 tokenSecret    : oauthTokens.oauth_token_secret
             };

             var message = {
                 action     : oauthInfo.accessToken,
                 method     : "GET",
                 parameters : [
                     ["oauth_consumer_key"     , oauthInfo.consumerKey],
                     ["oauth_token"            , oauthTokens.oauth_token],
                     ["oauth_signature_method" , oauthInfo.signatureMethod],
                     ["oauth_version"          , "1.0"]
                 ]
             };

             OAuth.setTimestampAndNonce(message);
             OAuth.SignatureMethod.sign(message, accessor);

             var oAuthArgs = OAuth.getParameterMap(message.parameters);
             var authHeader = OAuth.getAuthorizationHeader("http://twitter.com/", oAuthArgs);

             var xhr = new XMLHttpRequest();
             xhr.mozBackgroundRequest = true;
             xhr.open(message.method, message.action, true);
             xhr.setRequestHeader("Authorization", authHeader);

             xhr.onreadystatechange = function () {
                 if (xhr.readyState == 4) {
                     if (xhr.status == 200) {
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
                     } else if (xhr.status >= 500) {
                         // whale error
                         Application.console.log("whale error :: " + xhr.responseText);
                     } else {
                         // unknown error
                         Application.console.log("unknown error :: " + xhr.responseText);
                     }
                 }
             };

             xhr.send(null);
         }

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

             OAuth.setTimestampAndNonce(message);
             OAuth.SignatureMethod.sign(message, accessor);

             var oAuthArgs = OAuth.getParameterMap(message.parameters);
             var authHeader = OAuth.getAuthorizationHeader("http://twitter.com/", oAuthArgs);

             xhr.mozBackgroundRequest = true;
             xhr.open(message.method, message.action, false);
             xhr.setRequestHeader("Authorization", authHeader);
             xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

             xhr.send(null);

             return xhr.responseText;
         }

         function oauthASyncRequest(aOptions, aCallBack) {
             var xhr = new XMLHttpRequest();

             xhr.onreadystatechange = function (aEvent) {
                 aCallBack(aEvent, xhr);
             };

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

             OAuth.setTimestampAndNonce(message);
             OAuth.SignatureMethod.sign(message, accessor);

             var oAuthArgs  = OAuth.getParameterMap(message.parameters);
             var authHeader = OAuth.getAuthorizationHeader("http://twitter.com/", oAuthArgs);

             xhr.mozBackgroundRequest = true;
             xhr.open(message.method, message.action, true);
             xhr.setRequestHeader("Authorization", authHeader);
             xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

             xhr.send(null);
         }

         // ============================== Actions ============================== //

         function showMentions() {
             oauthASyncRequest(
                 {
                     action: "https://twitter.com/statuses/mentions.json",
                     method: "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status != 200) {
                             display.echoStatusBar(M({en: "Failed to get mentions", ja: "言及一覧の取得に失敗しました"}));
                             return;
                         }

                         var statuses = util.safeEval(xhr.responseText);

                         prompt.selector(
                             {
                                 message: "regexp:",
                                 collection: statuses.map(
                                     function (status) {
                                         return [status.user.profile_image_url, status.user.screen_name, html.unEscapeTag(status.text)];
                                     }),
                                 style: ["color:#003870;", null],
                                 width: [15, 85],
                                 header: ["From", 'Message'],
                                 flags: [ICON | IGNORE, 0, 0],
                                 filter: function (aIndex) {
                                     var status = statuses[aIndex];

                                     return (aIndex < 0 ) ? [null] :
                                         [{screen_name: status.user.screen_name, id: status.id, text: html.unEscapeTag(status.text)}];
                                 },
                                 actions: twitterActions
                             });             
                     }
                 });
         }

         function search() {
             function doSearch(aWord) {
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
                                         function (result) {
                                             return [result.profile_image_url, result.from_user, result.text];
                                         }),
                                     style: ["color:#003870;", null],
                                     width: [15, 85],
                                     header: ["From", 'Search result for "' + aWord + '"'],
                                     flags: [ICON | IGNORE, 0, 0],
                                     filter: function (aIndex) {
                                         var result = results[aIndex];

                                         return (aIndex < 0 ) ? [null] :
                                             [{screen_name: result.from_user,
                                               id: result.id,
                                               text: result.text}];
                                     },
                                     actions: twitterActions
                                 }); 
                         }
                     }
                 );
             }

             prompt.read("search:", doSearch);
         }

         function tweet(aInitialInput, aReplyID) {
             prompt.read("tweet:",
                         function (aTweet) {
                             if (aTweet == null) {
                                 return;
                             }

                             var xhr = new XMLHttpRequest();

                             xhr.onreadystatechange = function (aEvent) {
                                 if (xhr.readyState == 4) {
                                     if ((xhr.status == 401) && (xhr.responseText.indexOf("expired") != -1)) {
                                         // token expired
                                         reAuthorize();
                                     } else if (xhr.status != 200) {
                                         // misc error
                                         alertsService.showAlertNotification(null,
                                                                             M({ja: "ごめんなさい",
                                                                                en: "I'm sorry..."}),
                                                                             M({ja: "つぶやけませんでした",
                                                                                en: "Failed to tweet"}),
                                                                             false, "", null);
                                         util.message(xhr.responseText);
                                     } else {
                                         // succeeded
                                         var status = util.safeEval("(" + xhr.responseText + ")");
                                         // immediately add
                                         my.twitterJSONCache.unshift(status);
                                         immediatelyAddedStatuses.push(status);

                                         myScreenName = status.user.screen_name;

                                         var icon_url  = status.user.profile_image_url;
                                         var user_name = status.user.name;
                                         var message   = html.unEscapeTag(status.text);
                                         alertsService.showAlertNotification(icon_url, user_name, message, false, "", null);
                                     }
                                 }
                             };

                             var accessor = {
                                 consumerSecret : oauthInfo.consumerSecret,
                                 tokenSecret : oauthTokens.oauth_token_secret
                             };

                             var message = {
                                 action     : "http://twitter.com/statuses/update.json",
                                 method     : "POST",
                                 parameters : [
                                     ["oauth_consumer_key"     , oauthInfo.consumerKey],
                                     ["oauth_token"            , oauthTokens.oauth_token],
                                     ["oauth_signature_method" , oauthInfo.signatureMethod],
                                     ["oauth_version"          , "1.0"],
                                     ["source"                 ,"KeySnail"],
                                     ["status"                 , aTweet]
                                 ]
                             };

                             if (aReplyID)
                                 message.parameters.push(["in_reply_to_status_id", aReplyID.toString()]);

                             OAuth.setTimestampAndNonce(message);
                             OAuth.SignatureMethod.sign(message, accessor);

                             var argstring = "source=KeySnail&status=" + encodeURIComponent(aTweet);
                             if (aReplyID) argstring += "&in_reply_to_status_id=" + aReplyID;

                             var oAuthArgs = OAuth.getParameterMap(message.parameters);
                             var authHeader = OAuth.getAuthorizationHeader("http://twitter.com/", oAuthArgs);

                             xhr.mozBackgroundRequest = true;
                             xhr.open(message.method, message.action, true);
                             xhr.setRequestHeader("Authorization", authHeader);
                             xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                             xhr.send(argstring);
                         }, null, null, aInitialInput);
         }

         function callSelector(aPriorStatus) {
             var statuses = aPriorStatus || my.twitterJSONCache;

             var current = new Date();

             var collection = statuses.map(
                 function (status) {
                     var created = Date.parse(status.created_at);
                     var matched = status.source.match(">(.*)</a>");

                     return [status.user.profile_image_url, status.user.name, html.unEscapeTag(status.text),
                             getElapsedTimeString(current - created) +
                             " from " + (matched ? matched[1] : "Web") +
                             (status.in_reply_to_screen_name ?
                              " to " + status.in_reply_to_screen_name : "")];
                 }
             );

             prompt.selector(
                 {
                     message: "pattern:",
                     collection: collection,
                     flags: [ICON | IGNORE, 0, 0, 0],
                     style: ["color:#0e0067;", null, "color:#660025;"],
                     width: mainColumnWidth,
                     header: [M({ja: 'ユーザ', en: "User"}),
                              M({ja: 'タイムライン : そのまま Enter でつぶやき画面へ。 Ctrl + i でアクションを選択！',
                                 en: "Timeline : Press Enter to tweet. Ctrl + i (or your defined one) to select the action!"}),
                              M({ja: "情報", en: 'Info'})],
                     filter: function (aIndex) {
                         var status = statuses[aIndex];

                         return (aIndex < 0 ) ? [null] :
                             [{screen_name: status.user.screen_name,
                               id: status.id,
                               text: html.unEscapeTag(status.text)}];
                     },
                     actions: twitterActions
                 });

             if (!aPriorStatus) {
                 // showing user timeline, mark all statuses read
                 lastStatusID = statuses[0].id;
                 util.setUnicharPref(LAST_STATUS_KEY, lastStatusID);
                 self.updateStatusbar();
             }
         }

         function deleteStatus(aStatusID) {
             oauthASyncRequest(
                 {
                     action : "https://twitter.com/statuses/destroy/" + aStatusID + ".json",
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
                     self.updateStatusesCache(callSelector, updateForced);
                 }
             } else {
                 // use cache
                 callSelector();
             }
         }

         function showTargetStatus(target) {
             oauthASyncRequest(
                 {
                     action : "https://twitter.com/statuses/user_timeline/" + target + ".json?count=" + timelineCountEveryUpdates,
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
                         callSelector(statuses);
                     }
                 });
             return;
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
                         action : "https://twitter.com/statuses/friends_timeline.json?count=" + timelineCount,
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

             tweetWithTitleAndURL: function () {
                 tweet('"' + content.document.title + '" - ' + getTinyURL(window.content.location.href));
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

ext.add("twitter-client-toggle-popup-status", twitterClient.togglePopupStatus,
        M({ja: 'ポップアップ通知の切り替え',
           en: "Toggle popup status"}));

ext.add("twitter-client-reauthorize", twitterClient.reAuthorize,
        M({ja: '再認証',
           en: "Reauthorize"}));

if (my.twitterStatusesCacheUpdater)
    clearTimeout(my.twitterStatusesCacheUpdater);


if (getOption("automatically_begin")) {
    twitterClient.updateStatusesCache();
}
