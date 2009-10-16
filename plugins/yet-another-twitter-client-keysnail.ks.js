var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Yet Another Twitter Client KeySnail</name>
    <description>Make KeySnail behave like Twitter client</description>
    <description lang="ja">KeySnail を Twitter クライアントに</description>
    <version>1.1.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/yet-another-twitter-client-keysnail.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/yet-another-twitter-client-keysnail.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.6</minVersion>
    <provides>
        <ext>yet-another-twitter-client-keysnail</ext>
    </provides>
    <require>
        <script>http://github.com/mooz/keysnail/raw/master/plugins/lib/oauth.js</script>
    </require>
    <options>
        <option>
            <name>twitter_client.use_popup_notification</name>
            <type>boolean</type>
            <description lang="ja">ステータス更新時にポップアップ通知を行うかどうか</description>
        </option>
        <option>
            <name>twitter_client.update_interval</name>
            <type>integer</type>
            <description lang="ja">ステータスを更新する間隔 (ミリ秒)</description>
        </option>
        <option>
            <name>twitter_client.main_column_width</name>
            <type>[integer]</type>
            <description lang="ja">[ユーザ名, つぶやき, 情報] 各カラムの幅をパーセンテージ指定</description>
        </option>
        <option>
            <name>twitter_client.block_users</name>
            <type>[string]</type>
            <description lang="ja">ステータス更新時にポップアップを表示させたくないユーザの id を配列で指定</description>
        </option>
    </options>
    <detail><![CDATA[
=== Set up ===

In your .keysnail.js file,

>||
userscript.require("yet-another-twitter-client-keysnail.js");
||<

=== Usage ===

Press 't' key (or your defined one) to start this client.

Once this function has been called, the timer will be set, and the timeline
of Twitter periodically updated. This interval can be configured by changing
the "updateInterval" option.

If you set the "popUpStatusWhenUpdated" option to true, pretty notification
dialog will be pop upped when new tweets are arrived.
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== 起動 ====
M-x から yet-another-twitter-client-keysnail を選ぶと Twitter クライアントが起動します。
次のようにして任意のキーへコマンドを割り当てておくことも可能です。
>||
key.setViewKey("t",
    function (ev, arg) {
        ext.exec("yet-another-twitter-client-keysnail", arg);
    }, ext.description("yet-another-twitter-client-keysnail"), true);
||<
例えば上記のような設定を .keysnail.js へ記述しておくことにより、ブラウズ画面で t を押すことでこのクライアントを起動させることが可能となります。

==== アクションの選択 ====
Twitter クライアントが起動すると、ユーザのタイムライン一覧が表示されます。ここでそのまま Enter キーを入力すると「つぶやき」画面へ移行することができます。
Enter ではなく Ctrl + i キーを押すことにより、様々なアクションを選ぶことも可能となっています。

==== 自動更新  ====
このクライアントは起動時にタイマーをセットし Twitter のタイムラインを定期的に更新します。
twitter_client.update_interval に値を設定することにより、この間隔を変更することが可能となっています。

==== ポップアップ通知  ====
twitter_client.use_popup_notification オプションが true に設定されていれば、新しいつぶやきが届いた際にポップアップで通知が行われるようになります。
また、クライアント実行中にもアクションからこの値を切り替えることが可能です。

=== 設定例 ===
以下に初期化ファイル PRESERVE エリアへの設定例を示します。
>||
plugins.options["twitter_client.update_interval"] = 2 * 60 * 1000;
plugins.options["twitter_client.block_users"] = ["foo", "bar"];
||<
]]></detail>
</KeySnailPlugin>;

var twitterJSONCache;
var twitterJSONCacheUpdater;
var twitterLastUpdated;
var twitterPending;

// Update interval in mili second
var updateInterval = plugins.options["twitter_client.update_interval"] || 60 * 1000;

// Show popup when timeline is updated
var popUpStatusWhenUpdated = plugins.options["twitter_client.use_popup_notification"];
if (typeof popUpStatusWhenUpdated != "boolean")
    popUpStatusWhenUpdated = true;

// [User name, Message, Information] in percentage
var mainColumnWidth = plugins.options["twitter_client.main_column_width"] || [11, 68, 21];

var blockUser = plugins.options["twitter_client.block_users"] || undefined;

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
             tweet("RT @" + status.screen_name + ": " + status.text);
         }
     }, "Retweet"],
    [function (status) {
         if (status) {
             showFollowersStatus(status.screen_name);
         }
     }, M({ja: "選択中ユーザのつぶやきを一覧表示 : ", en: ""}) + "Show Target status"],
    [function (status) {
         if (status) {
             showMentions();
         }
     }, M({ja: "自分への返信を一覧表示 : ", en: ""}) + "Show mentions"],
    [function (status) {
         if (status) {
             gBrowser.loadOneTab("http://twitter.com/" + status.screen_name
                                 + "/status/" + status.id, null, null, null, false);
         }
     }, M({ja: "Twitter のサイトでそのつぶやきを見る : ", en: ""}) + "Show status in web page"],
    [function (status) {
         popUpStatusWhenUpdated = !popUpStatusWhenUpdated;
         display.echoStatusBar(M({ja: ("ポップアップ通知を" + (popUpStatusWhenUpdated ? "有効にしました" : "無効にしました")),
                                  en: ("Pop up " + (popUpStatusWhenUpdated ? "enabled" : "disabled"))}));
     }, M({ja: "ポップアップ通知の切り替え : ", en: ""}) + "Toggle pop up notification status"],
    [function (status) {
         reAuthorize();
     }, M({ja: "再認証 : ", en: ""}) + "Reauthorize"],
    [function (status) {
         if (status) {
             tweet(content.document.title + " - " + getTinyURL(window.content.location.href));
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

    var statuses = util.safeEval(responseText);

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

                    var results = (util.safeEval("(" + responseText + ")") || {"results":[]}).results;

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
                                var status = util.safeEval("(" + xhr.responseText + ")");
                                // immediately add
                                twitterJSONCache.unshift(status);

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
        var statuses = priorStatus || twitterJSONCache;

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
                header: [M({ja: 'ユーザ', en: "User"}),
                         M({ja: 'タイムライン : そのまま Enter でつぶやき画面へ。 Ctrl + i でアクションを選択！',
                            en: "Timeline : Press Enter to tweet. Ctrl + i (or your defined one) to select the action!"}),
                         M({ja: "情報", en: 'Info'})],
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
        twitterPending = true;

        oauthASyncRequest(
            {
                action : target ? "https://twitter.com/statuses/user_timeline/" + target + ".json"
                    : "https://twitter.com/statuses/friends_timeline.json",
                method : "GET"
            },
            function (aEvent, xhr) {
                if (xhr.readyState == 4) {
                    twitterPending = false;

                    if (xhr.status != 200) {
                        display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。',
                                                 en: "Failed to get statuses"}));
                        return;
                    }

                    var statuses = util.safeEval(xhr.responseText) || [];

                    if (!target) {
                        twitterLastUpdated = new Date();
                        twitterJSONCache = combineJSONCache(statuses, twitterJSONCache);
                    }

                    if (!aNoRepeat)
                        twitterJSONCacheUpdater = setTimeout(updateJSONCache, updateInterval);

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
                        display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。',
                                                 en: "Failed to get statuses"}));
                        return;
                    }

                    var statuses = util.safeEval(xhr.responseText) || [];
                    callSelector(statuses);
                }
            });
        return;
    }

    if (twitterPending) {
        display.echoStatusBar(M({ja: 'Twitter へリクエストを送信しています。しばらくお待ち下さい。',
                                 en: "Requesting to the Twitter ... Please wait."}));
        return;
    }

    if (aArg != null || !twitterJSONCache) {
        // rebuild cache
        updateJSONCache(callSelector, aArg != null);
    } else {
        // use cache
        callSelector();
    }
}

function displayTwitterClient(aEvent, aArg) {
    if (!oauthTokens.oauth_token || !oauthTokens.oauth_token_secret) {
        authorizationSequence();
    } else {
        showFollowersStatus(null, aArg);             
    }

}

ext.add("yet-another-twitter-client-keysnail", displayTwitterClient,
        M({ja: 'Twitter クライアントを起動',
           en: "Launch Yet Another Twitter Client KeySnail"}));
