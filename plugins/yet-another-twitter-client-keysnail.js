/**
 * @fileOverview
 * @name yet-another-twitter-client-keysnail.js
 * @description Make KeySnail behave like Twitter client
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

key.setViewKey(my.twitterClientStartKey || 't', function (aEvent, aArg) {
                   my.yATwitterClientKeySnail.display(aEvent, aArg);
               }, 'Yet Another Twitter Client KeySnail', true);

my.yATwitterClientKeySnail = new
(function () {
     var updateInterval         = my.twitterClientUpdateInterval || 60 * 1000;    // Update interval in mili second
     var popUpStatusWhenUpdated = true;         // Show popup when timeline is updated
     var mainColumnWidth        = [11, 68, 21]; // [User name, Message, Information] in percentage

     var blockUser = my.blockUser || undefined;

     var twitterActions = [
         [function (status) {
              if (status)
                  tweet();
          }, L("Tweet (つぶやく)")],
         [function (status) {
              if (status) {
                  tweet("@" + status.screen_name + " ", status.id);
              }
          }, L("Reply (返信)")],
         [function (status) {
              if (status) {
                  tweet("RT @" + status.screen_name + ": " + status.text);
              }
          }, "Retweet"],
         [function (status) {
              if (status) {
                  showFollowersStatus(status.screen_name);
              }
          }, L("Show Target status (選択中ユーザのつぶやきを一覧表示)")],
         [function (status) {
              if (status) {
                  showMentions();
              }
          }, L("Show mentions (自分への返信を一覧表示)")],
         [function (status) {
              if (status) {
                  gBrowser.loadOneTab("http://twitter.com/" + status.screen_name
                                      + "/status/" + status.id, null, null, null, false);
              }
          }, L("Show status in web page (Twitter のサイトでそのつぶやきを見る)")],
         [function (status) {
              popUpStatusWhenUpdated = !popUpStatusWhenUpdated;
              display.echoStatusBar("Pop up " + (popUpStatusWhenUpdated ? "enabled" : "disabled"));
          }, L("Toggle pop up status (ポップアップ通知の切り替え)")],
         [function (status) {
              reAuthorize();
          }, L("Reauthorize (認証しなおす)")],
         [function (status) {
              if (status) {
                  tweet(content.document.title + " - " + getTinyURL(window.content.location.href));
              }
          }, L("Tweet with the current web page URL (現在のページのタイトルと URL を使ってつぶやく)")],
         [function (status) {
              if (status)
                  search();
          }, L("Search keyword (単語を検索)")],
         [function (status) {
              if (status) {
                  var matched = status.text.match("(https?|ftp)(://[a-zA-Z0-9/?#_.\\-]+)");
                  if (matched) {
                      gBrowser.loadOneTab(matched[1] + matched[2], null, null, null, false);
                  }
              }
          }, L("Visit URL in the message (つぶやき中の URL を開く)")]
     ];

     // ============================== Arrange services ============================== //

     try {
         var alertsService = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
     } catch (x) {
         popUpStatusWhenUpdated = false;
     }

     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);

     var evalFunc = window.eval;
     try {
         var sandbox = new(Components.utils.Sandbox)("about:blank");
         if (Components.utils.evalInSandbox("true", sandbox) === true) {
             evalFunc = function (text) {
                 return Components.utils.evalInSandbox(text, sandbox);
             };
         }
     } catch(e) {}

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

         if (blockUser && blockUser.some(function (username) username == status.user.screen_name)) {
             util.message("ignored :: " + status.text + " from " + status.user.screen_name);
             return;
         }

         var browserWindow = wm.getMostRecentWindow("navigator:browser");
         if (!browserWindow || browserWindow.KeySnail != KeySnail) {
             util.message("other window");
             return;
         }

         alertsService.showAlertNotification(status.user.profile_image_url,
                                             status.user.name,
                                             status.text,
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
             return L("ついさっき");
         var min = sec / 60;
         if (min < 1.0)
             return format(sec, L("秒前"));
         var hour = min / 60;
         if (hour < 1.0)
             return format(min, L("分前"));
         var date = hour / 24;
         if (date < 1.0)
             return format(hour, L("時間前"));
         return format(date, L("日前"));
     }

     function combineJSONCache(aNew, aOld) {
         if (!aOld)
             return aNew;

         var oldid = aOld[0].id;
         for (var i = 0; i < aNew.length; ++i) {
             if (aNew[i].id == oldid) break;
         }

         if (i - 1 > 0) {
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

     var loadSucceeded = false;
     for (var i = 0; i < userscript.loadPath.length; ++i) {
         var baseDir = userscript.loadPath[i];
         if (!baseDir) continue;

         // loadUserScript return -1 when file not found
         if (userscript.loadUserScript(
                 function (aPath) {
                     userscript.loadSubScript(aPath, context);
                 }, baseDir, ["oauth.js"]) == 0) {
             loadSucceeded = true;
             break;
         }
     }

     if (!loadSucceeded) {
         display.notify("This plugin requires oauth.js but not found");
         return;
     }

     var OAuth = context.OAuth();

     function authorizationSequence() {
         authorize();

         prompt.read("Press Enter When Authorization Finished:",
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

         xhr.mozBackgroundRequest = false;
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
         var responseText = oauthSyncRequest(
             {
                 action: "https://twitter.com/statuses/mentions.json",
                 method: "GET"
             });

         var statuses = evalFunc(responseText);

         prompt.selector(
             {
                 message: "regexp:",
                 collection: statuses.map(
                     function (status) {
                         return [status.user.profile_image_url, status.user.screen_name, status.text];
                     }),
                 style: ["color:#003870;", null],
                 width: [15, 85],
                 header: ["From", 'Message'],
                 flags: [ICON | IGNORE, 0, 0],
                 filter: function (aIndex) {
                     var status = statuses[aIndex];

                     return (aIndex < 0 ) ? [null] :
                         [{screen_name: status.user.screen_name, id: status.id, text: status.text}];
                 },
                 actions: twitterActions
             });
     }

     function search() {
         prompt.read("search:",
                     function (aWord) {
                         if (aWord == null)
                             return;

                         var xhr = new XMLHttpRequest();

                         var responseText = oauthSyncRequest(
                             {
                                 action: "http://search.twitter.com/search.json?q=" + encodeURIComponent(aWord),
                                 method: "POST"
                             });

                         var results = (evalFunc("(" + responseText + ")") || {"results":[]}).results;

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
                     });
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
                                     alertsService.showAlertNotification(null, "I'm sorry...", "Failed to tweet", false, "", null);
                                     util.message(xhr.responseText);
                                 } else {
                                     // succeeded
                                     var status = evalFunc("(" + xhr.responseText + ")");
                                     // immediately add
                                     my.twitterJSONCache.unshift(status);

                                     var icon_url  = status.user.profile_image_url;
                                     var user_name = status.user.name;
                                     var message   = status.text;
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

     function showFollowersStatus(target, aArg) {
         function callSelector(priorStatus) {
             var statuses = priorStatus || my.twitterJSONCache;

             var current = new Date();

             var collection = statuses.map(
                 function (status) {
                     var created = Date.parse(status.created_at);
                     var matched = status.source.match(">(.*)</a>");

                     return [status.user.profile_image_url, status.user.name, status.text,
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
                     header: ["User", "Timeline : Press Enter to tweet. Ctrl + i (or your defined one) to select the action!", "Info"],
                     filter: function (aIndex) {
                         var status = statuses[aIndex];

                         return (aIndex < 0 ) ? [null] :
                             [{screen_name: status.user.screen_name,
                               id: status.id,
                               text: status.text}];
                     },
                     actions: twitterActions
                 });
         }

         function updateJSONCache(aAfterWork, aNoRepeat) {
             my.twitterPending = true;

             oauthASyncRequest(
                 {
                     action : target ? "https://twitter.com/statuses/user_timeline/" + target + ".json"
                         : "https://twitter.com/statuses/friends_timeline.json",
                     method : "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         my.twitterPending = false;

                         if (xhr.status != 200) {
                             display.echoStatusBar("Failed to get statuses");
                             return;
                         }

                         var statuses = evalFunc(xhr.responseText) || [];

                         if (!target) {
                             my.twitterLastUpdated = new Date();
                             my.twitterJSONCache = combineJSONCache(statuses, my.twitterJSONCache);
                         }

                         if (!aNoRepeat)
                             my.twitterJSONCacheUpdater = setTimeout(updateJSONCache, updateInterval);

                         if (typeof(aAfterWork) == "function")
                             aAfterWork();
                     }
                 });
         }

         if (target) {
             oauthASyncRequest(
                 {
                     action : "https://twitter.com/statuses/user_timeline/" + target + ".json",
                     method : "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4) {
                         if (xhr.status != 200) {
                             display.echoStatusBar("Failed to get statuses");
                             return;
                         }

                         var statuses = evalFunc(xhr.responseText) || [];
                         callSelector(statuses);
                     }
                 });
             return;
         }

         if (my.twitterPending) {
             display.echoStatusBar("Requesting to the Twitter ... Please wait.");
             return;
         }

         if (aArg != null || !my.twitterJSONCache) {
             // rebuild cache
             updateJSONCache(callSelector, aArg != null);
         } else {
             // use cache
             callSelector();
         }
     }

     this.display = function (aEvent, aArg) {
         showFollowersStatus(null, aArg);
     };
 });


// PLUGIN INFO: {{{
var PLUGIN_INFO =
<KeySnailPlugin>
<name>Yet Another Twitter Client KeySnail</name>
<description>Make KeySnail behave like Twitter client</description>
<description lang="ja">KeySnail を Twitter クライアントに</description>
<version>1.0</version>
<updateURL>http://github.com/mooz/keysnail/raw/master/plugins/yet-another-twitter-client-keysnail.js</updateURL>
<author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
<license>The MIT License</license>
<license lang="ja">MIT ライセンス</license>
<minVersion>0.9.4</minVersion>
<detail><![CDATA[
== Set up ==

In your .keysnail.js file,

>||
userscript.require("yet-another-twitter-client-keysnail.js");
||<

== Usage ==

Press 't' key (or your defined one) to start this client.

Once this function has been called, the timer will be set, and the timeline
of Twitter periodically updated. This interval can be configured by changing
the "updateInterval" option.

If you set the "popUpStatusWhenUpdated" option to true, pretty notification
dialog will be pop upped when new tweets are arrived.
    ]]></detail>
    <detail lang="ja"><![CDATA[
== 注意 ==

このプラグインは KeySnail 0.9.3 以降でのみ動作します。
古いバージョンをお使いの方は、最新版を DL してからお試し下さい。

== セットアップ ==

.keysnail.js の PRESERVE エリアへ次の一行を付け加えてください

>||
  userscript.require("yet-another-twitter-client-keysnail.js");
||<

また、このプラグインの動作には oauth.js が必要ですので、適当な場所へ配置した上で

>||
  my.twitterClientLibOAuthPath = "~/.keysnail.d/oauth.js"
||<

のようにしてファイルのパスを設定して下さい。

== 使い方 ==

't' キー (や独自に設定したキー) を入力することで Twitter クライアントが起動します。

このキーバインドは

>||
  userscript.require("yet-another-twitter-client-keysnail.js");
||<

をする前に

>||
  my.twitterClientStartKey = ["C-c", "t"];
||<

のようにすることで変更することができます。

そのまま Enter キーを入力すると「つぶやき」画面へと移行します。

また Ctrl + i キーを押すことで、様々なアクションを選ぶことが可能となります。

このクライアント起動時にはタイマーがセットされ、 Twitter のタイムラインが定期的に更新されるようになります。
"updateInterval" の値を変更することにより、この間隔を変えることが可能です。

"popUpStatusWhenUpdated" オプションが true に設定されていれば、新しいつぶやきが届いた際に
ポップアップで通知が行われるようになります。
アクションの中に、このオプションを切り替えるものも用意されています。

== 設定例 ==

>||
userscript.addLoadPath("~/.keysnail.d");
my.twitterClientLibOAuthPath = "~/keysnail/plugins/oauth.js";
my.twitterClientStartKey       = 't';
my.twitterClientUpdateInterval = 60 * 1000; // updates every 1 minute
userscript.require("yet-another-twitter-client-keysnail.js");
||<
]]></detail>
</KeySnailPlugin>;
// }}}