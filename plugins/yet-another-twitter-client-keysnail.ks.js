/**
 * @fileOverview Twitter Client Plugin for KeySnail
 * @name yet-another-twitter-client-keysnail.ks.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const Cc = Components.classes;
const Ci = Components.interfaces;

// Options {{ =============================================================== //

var optionsDefaultValue = {
    "log_level"                    : LOG_LEVEL_MESSAGE,
    "update_interval"              : 60 * 1000,      // 1 minute
    "mentions_update_interval"     : 60 * 1000 * 5,  // 5 minute
    "tracking_update_interval"     : 60 * 1000 * 5,  // 5 minute
    "dm_update_interval"           : 60 * 1000 * 20, // 20 minute
    "list_update_interval"         : 60 * 1000 * 5,  // 5 minute
    "list_update_intervals"        : null,
    "popup_new_statuses"           : false,
    "popup_new_replies"            : true,
    "main_column_width"            : [11, 70, 19],
    "timeline_count_beginning"     : 80,
    "timeline_count_every_updates" : 20,
    "unread_status_count_style"    : "color:#383838;font-weight:bold;",
    "automatically_begin"          : true,
    "automatically_begin_list"     : true,
    "automatically_begin_tracking" : true,
    "prefer_screen_name"           : false,
    "keymap"                       : null,
    "tweet_keymap"                 : null,
    "switch_to_keymap"             : {
        "C-z"   : "prompt-toggle-edit-mode",
        "SPC"   : "prompt-next-page",
        "b"     : "prompt-previous-page",
        "j"     : "prompt-next-completion",
        "k"     : "prompt-previous-completion",
        "g"     : "prompt-beginning-of-candidates",
        "G"     : "prompt-end-of-candidates",
        "q"     : "prompt-cancel",
        "o"     : "prompt-decide"
    },
    "black_users"                           : [],
    "enable_header"                         : true,
    // fancy mode settings
    "fancy_mode"                            : true,
    "normal_tweet_style"                    : "color:black;",
    "my_tweet_style"                        : "color:#0a00d5;",
    "reply_to_me_style"                     : "color:#930c00;",
    "retweeted_status_style"                : "color:#134f00;",
    "selected_row_style"                    : "background-color:#93c6ff; color:black; outline: 1px solid #93c6ff !important;",
    "selected_user_style"                   : "background-color:#ddedff; color:black;",
    "selected_user_reply_to_style"          : "background-color:#ffd4ff; color:black;",
    "selected_user_reply_to_reply_to_style" : "background-color:#ffe9d4; color:black;",
    "search_result_user_name_style"         : "color:#003870;",
    // j.mp settings
    "jmp_id"                                : "stillpedant",
    "jmp_key"                               : "R_168719821d1100c59352962dce863251",
    "lists"                                 : [],
    "show_sources"                          : true
};

function getOption(aName) {
    var fullName = "twitter_client." + aName;
    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

function setOption(aName, aValue) {
    plugins.options["twitter_client." + aName] = aValue;
}

// }} ======================================================================= //

// Notifier {{ ============================================================== //

function getBrowserWindows() {
    var windows = [];

    var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);
    var enumerator = wm.getEnumerator("navigator:browser");

    while (enumerator.hasMoreElements())
        windows.push(enumerator.getNext());

    return windows;
}

function notifyWindows(aNotifier, aArg) {
    getBrowserWindows().forEach(function (win) aNotifier(win, aArg));
}

function updateAllStatusbars() {
    notifyWindows(function (win) {
                      try {
                          win.KeySnail.modules.plugins.twitterClient.updateStatusbar();
                      } catch (x) {}
                  });
}

function updateAllListButtons() {
    notifyWindows(function (win) {
                      try {
                          win.KeySnail.modules.plugins.twitterClient.updateListButton();
                      } catch (x) {}
                  });
}

function updateAllTrackingButtons() {
    notifyWindows(function (win) {
                      try {
                          win.KeySnail.modules.plugins.twitterClient.updateTrackingButton();
                      } catch (x) {}
                  });
}

// }} ======================================================================= //

var genCommand = {
    openLink: function (url) {
        return 'openUILinkIn("' + url + '", "tab")';
    },

    execExt: function (extName) {
        return util.format('KeySnail.modules.ext.exec("%s")', extName);
    }
};

// ============================================================ //
// Util : log
// ============================================================ //

const LOG_LEVEL_DEBUG   = 0;
const LOG_LEVEL_MESSAGE = 10;
const LOG_LEVEL_WARNING = 20;
const LOG_LEVEL_ERROR   = 30;

let currentLogLevel = getOption("log_level");

function log() {
    let level = arguments[0];

    if (currentLogLevel >= level)
        util.message.apply(util, Array.slice(arguments, 1));
}

var twitterAPI = {
    /**
     * ex)
     * twitterAPI.get("retweet", "foobar")
     */
    get:
    function get(name) {
        if (!this._holder[name])
            return null;

        var api  = this._holder[name];
        var args = arguments;

        return {
            action : api.action.replace(/{arg([1-9])}/g, function (_, i) args[i] || ""),
            host   : api.host,
            method : api.method
        };
    },

    _holder: getOption("twitter_api") || {
        home: {
            action : "http://api.twitter.com/1/statuses/home_timeline.json",
            method : "GET"
        },

        mentions: {
            action : "http://api.twitter.com/1/statuses/mentions.json",
            method : "GET"
        },

        verification: {
            action: "http://api.twitter.com/1/account/verify_credentials.json",
            method: "GET"
        },

        update: {
            action : "http://api.twitter.com/1/statuses/update.json",
            method : "POST"
        },

        destroyTweet: {
            action : "http://api.twitter.com/1/statuses/destroy/{arg1}.json",
            method : "DELETE"
        },

        retweet: {
            action : "http://api.twitter.com/1/statuses/retweet/{arg1}.json",
            host   : "http://api.twitter.com/",
            method : "POST"
        },

        getFavorites: {
            action : "http://api.twitter.com/1/favorites.json{arg1}",
            method : "GET"
        },

        createFavorite: {
            action : "http://api.twitter.com/1/favorites/create/{arg1}.json",
            method : "POST"
        },

        destroyFavorite: {
            action : "http://api.twitter.com/1/favorites/destroy/{arg1}.json",
            method : "POST"
        },

        getLists: {
            action : "http://api.twitter.com/1/{arg1}/lists.json",
            host   : "http://api.twitter.com/",
            method : "GET"
        },

        getListStatuses: {
            action : "http://api.twitter.com/1/{arg1}/lists/{arg2}/statuses.json{arg3}",
            host   : "http://api.twitter.com/",
            method : "GET"
        },

        userTimeline: {
            action : "http://api.twitter.com/1/statuses/user_timeline/{arg1}.json{arg2}",
            method : "GET"
        },

        myTimeline: {
            action : "http://api.twitter.com/1/statuses/user_timeline.json{arg1}",
            method : "GET"
        },

        search: {
            action : "http://search.twitter.com/search.json{arg1}",
            method : "POST"
        },

        getDM: {
            action : "http://api.twitter.com/1/direct_messages.json",
            method : "GET"
        },

        getSentDM: {
            action : "http://api.twitter.com/1/direct_messages/sent.json",
            method : "GET"
        }
    }
};

// ============================================================ //
// Object : Twitter Client (Main)
// ============================================================ //

var twitterClient = (
    function () {
        // Global variables {{ ====================================================== //

        const root = "KeySnail.modules.plugins.twitterClient";

        function decodeJSON(json) {
            return util.safeEval("(" + json + ")");
        }

        // ============================================================ //
        // OAuth Class
        // ============================================================ //

        function OAuth(info, tokens) {
            this.info   = info;
            this.tokens = tokens;

            let context = {};

            if (!userscript.require("oauth.js", context))
            {
                display.notify(L(util.xmlGetLocaleString(PLUGIN_INFO.name)) + " : " +
                               M({ja: "このプラグインの動作には oauth.js が必要です。 oauth.js をプラグインディレクトリ内に配置した上でお試し下さい。",
                                  en: "This plugin requires oauth.js but not found. Please locate oauth.js to the plugin directory."}));
            }

            this._oauth = new context.OAuth();
        }

        OAuth.prototype = {
            syncRequest:
            function syncRequest(options) {
                var xhr = new XMLHttpRequest();

                var accessor = {
                    consumerSecret : this.info.consumerSecret,
                    tokenSecret    : this.tokens.oauth_token_secret
                };

                var message = {
                    action     : options.action,
                    method     : options.method,
                    parameters : [
                        ["oauth_consumer_key"     , this.info.consumerKey],
                        ["oauth_token"            , this.tokens.oauth_token],
                        ["oauth_signature_method" , this.info.signatureMethod],
                        ["oauth_version"          , "1.0"]
                    ]
                };

                if (options.parameters) {
                    message.parameters = message.parameters.concat(options.parameters);
                }

                this._oauth.setTimestampAndNonce(message);
                this._oauth.SignatureMethod.sign(message, accessor);

                var oAuthArgs  = this._oauth.getParameterMap(message.parameters);
                var authHeader = this._oauth.getAuthorizationHeader(this.info.authHeader, oAuthArgs);

                xhr.mozBackgroundRequest = true;
                xhr.open(message.method, message.action, false);
                xhr.setRequestHeader("Authorization", authHeader);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                xhr.send(options.send || null);

                return xhr.responseText;
            },

            asyncRequest:
            function asyncRequest(options, callback, onprogress) {
                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function (ev) {
                    if (xhr.readyState !== 4)
                        return;

                    try
                    {
                        let headers = {};

                        xhr.getAllResponseHeaders().split(/\r?\n/).forEach(
                            function (h) {
                                let pair = h.split(': ');
                                if (pair && pair.length > 1)
                                    headers[pair.shift()] = pair.join('');
                            });

                        if ("X-RateLimit-Remaining" in headers)
                        {
                            let remain = +headers["X-RateLimit-Remaining"];
                            let limit  = +headers["X-RateLimit-Limit"];
                            let reset  = +headers["X-RateLimit-Reset"];

                            share.twitterAPIUsage.set(remain, limit, reset * 1000);
                        }
                    }
                    catch (x) {}

                    callback(ev, xhr);
                };

                if (onprogress)
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

                if (!options.authorize)
                    message.parameters.push(["oauth_token", this.tokens.oauth_token]);

                if (options.parameters)
                {
                    outer:
                    for (let [, params] in Iterator(options.parameters))
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
                var authHeader = this._oauth.getAuthorizationHeader(options.host || this.info.authHeader, oAuthArgs);

                xhr.mozBackgroundRequest = true;
                xhr.open(message.method, message.action, true);
                xhr.setRequestHeader("Authorization", authHeader);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                xhr.send(options.send || null);
            }
        };

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
            this.getLastID    = arg.getLastID;
            this.setLastID    = arg.setLastID;
            this.lastIDHook   = arg.lastIDHook;
            this.beginCount   = arg.beginCount;
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

            stop:
            function stop() {
                if (this.updater)
                    clearTimeout(this.updater);
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

                if (!aOld)
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
                var oldid = aOld[0].id;
                var newStatusCount = aNew.map(function (status) status.id).indexOf(oldid);

                var newStatuses;

                if (newStatusCount === -1)
                    newStatuses = aNew; // all statuses in aNew is updated status
                else
                    newStatuses = aNew.slice(0, newStatusCount);

                var latestTimeline = newStatuses.concat(aOld);

                if (newStatuses.length && (getOption("popup_new_statuses") || getOption("popup_new_replies")))
                    popUpNewStatuses(newStatuses);

                return latestTimeline;
            },

            update:
            function update(after, noRepeat, fromTimer) {
                this.pending = true;

                let self = this;

                this.oauth.asyncRequest(
                    {
                        action: this.action +
                            (this.cache ? "" :
                             (this.action.indexOf("?") === -1 ? "?" : "&") + this.countName + "=" + this.beginCount),
                        method: "GET"
                    },
                    function (ev, xhr) {
                        if (xhr.readyState !== 4)
                            return;

                        self.pending = false;

                        if (xhr.status !== 200)
                        {
                            if (isRetryable(xhr))
                            {
                                log(LOG_LEVEL_DEBUG, self.name + " => Crawler#update: retry %s", new Date());
                                self.update(after, noRepeat, fromTimer);

                                return;
                            }

                            display.echoStatusBar(M({ en: "Failed to get " + self.name,
                                                      ja: self.name + L("の取得に失敗しました") }));
                        }
                        else
                        {
                            log(LOG_LEVEL_DEBUG, self.name + " => update %s (interval %s)", new Date(), self.interval);
                            let (statuses = decodeJSON(xhr.responseText))
                                self.cache = self.combineCache(self.mapper ? self.mapper(statuses) : statuses);
                            if (self.lastIDHook)
                                self.lastIDHook();
                        }

                        if (self.interval && (!noRepeat && !self.updater || fromTimer))
                        {
                            self.updater = setTimeout(function () { self.update(null, false, true); }, self.interval);

                            if (self.delegator)
                                return;

                            self.setDelegator();
                        }

                        if (typeof after === "function")
                            after();
                    }
                );
            },

            setDelegator:
            function setDelegator() {
                let self = this;

                self.delegator = true; // avoid duplication

                window.addEventListener(
                    "unload",
                    function () {
                        self.stop();

                        for (let [, win] in Iterator(getBrowserWindows()))
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

        var _oauthInfo = getOption("oauth_info") || {
            signatureMethod : "HMAC-SHA1",
            consumerKey     : "q8bLrmPJJ54hv5VGSXUfvQ",
            consumerSecret  : "34Xtbtmqikl093nzaXg6ePay5EJJMu0cm3qervD4",
            requestToken    : "http://twitter.com/oauth/request_token",
            accessToken     : "http://twitter.com/oauth/access_token",
            authorizeURL    : "http://twitter.com/oauth/authorize",
            authHeader      : "http://twitter.com/"
        };

        var gPrefKeys = {
            oauth_token        : "extensions.keysnail.plugins.twitter_client.oauth_token",
            oauth_token_secret : "extensions.keysnail.plugins.twitter_client.oauth_token_secret"
        };

        var _oauthTokens = {
            oauth_token        : util.getUnicharPref(gPrefKeys.oauth_token, ""),
            oauth_token_secret : util.getUnicharPref(gPrefKeys.oauth_token_secret, "")
        };

        var gOAuth = new OAuth(_oauthInfo, _oauthTokens);

        // }} ======================================================================= //

        function normalizeCount(n) {
            if (n <= 0)
                n = 20;
            if (n > 200)
                n = 200;

            return n;
        }

        var gTimelineCountBeginning    = getOption("timeline_count_beginning");
        var gTimelineCountEveryUpdates = getOption("timeline_count_every_updates");

        gTimelineCountBeginning    = normalizeCount(gTimelineCountBeginning);
        gTimelineCountEveryUpdates = normalizeCount(gTimelineCountEveryUpdates);

        // Lists {{ ================================================================= //

        var gLists = {};

        getOption("lists").forEach(
            function (name) {
                let [id, listName] = name.split("/");

                // list
                let listAction = twitterAPI.get("getListStatuses", id, listName);

                gLists[name] = new Crawler(
                    {
                        action     : listAction.action,
                        name       : name,
                        interval   : (getOption("list_update_intervals") && getOption("list_update_intervals")[name])
                            || getOption("list_update_interval"),
                        lastKey    : "extensions.keysnail.plugins.twitter_client.last_id." + name.replace("/", "_"),
                        oauth      : gOAuth,
                        countName  : "per_page",
                        lastIDHook : updateAllListButtons,
                        beginCount : gTimelineCountBeginning
                    }
                );
            });

        // }} ======================================================================= //

        // Searches {{ ============================================================== //

        function filterSearchResult(status) {
            status.user = {
                screen_name             : status.from_user,
                name                    : status.from_user,
                profile_image_url       : status.profile_image_url
            };
            status.in_reply_to_screen_name = status.to_user;

            return status;
        }

        var gTrackings = {};

        function addTrackingCrawler(query, infoHolder) {
            let searchAction = twitterAPI.get("search", "?q=" + encodeURIComponent(query));

            return gTrackings[query] = new Crawler(
                {
                    action       : searchAction.action,
                    name         : query,
                    interval     : infoHolder["interval"] || getOption("tracking_update_interval"),
                    oauth        : gOAuth,
                    countName    : "rpp",
                    mapper       : function (response) response.results.map(filterSearchResult),
                    getLastID    : function () infoHolder["lastID"],
                    setLastID    : function (v) {
                        infoHolder["lastID"] = v;
                        persist.preserve(share.twitterTrackingInfo, "yatck_tracking_info");
                    },
                    lastIDHook   : updateAllTrackingButtons,
                    beginCount   : gTimelineCountBeginning
                }
            );
        }

        if (!share.twitterTrackingInfo)
            share.twitterTrackingInfo = persist.restore("yatck_tracking_info") || {};

        for (let [name, info] in Iterator(share.twitterTrackingInfo))
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
                action     : twitterAPI.get("home").action,
                name       : M({ en: "Timeline", ja: "タイムライン" }),
                interval   : getOption("update_interval"),
                lastKey    : "extensions.keysnail.plugins.twitter_client.last_status_id",
                oauth      : gOAuth,
                lastIDHook : updateAllStatusbars,
                beginCount : gTimelineCountBeginning
            }
        );

        var gMentions = new Crawler(
            {
                action     : twitterAPI.get("mentions").action,
                name       : M({ en: "mentions", ja: "言及一覧" }),
                interval   : getOption("mentions_update_interval"),
                lastKey    : "extensions.keysnail.plugins.twitter_client.last_mention_id",
                oauth      : gOAuth,
                lastIDHook : updateAllStatusbars,
                beginCount : gTimelineCountEveryUpdates
            }
        );

        var gDMs = new Crawler(
            {
                action     : twitterAPI.get("getDM").action,
                name       : M({ en: "DMs", ja: "DMs" }),
                interval   : getOption("dm_update_interval"),
                lastKey    : "extensions.keysnail.plugins.twitter_client.last_dm_id",
                oauth      : gOAuth,
                mapper     : function (statuses) statuses.map(function (status) (status.user = status.sender, status)),
                lastIDHook : updateAllStatusbars,
                beginCount : gTimelineCountEveryUpdates
            }
        );

        var gSentDMs = new Crawler(
            {
                action     : twitterAPI.get("getSentDM").action,
                name       : M({ en: "Sent DMs", ja: "Sent DMs" }),
                interval   : 0,
                oauth      : gOAuth,
                mapper     : function (statuses) statuses.map(function (status) (status.user = status.sender, status)),
                beginCount : gTimelineCountEveryUpdates
            }
        );

        if (!share.twitterImmediatelyAddedStatuses)
            share.twitterImmediatelyAddedStatuses = [];

        // }} ======================================================================= //

        // Styles {{ ================================================================ //

        const gLinkClass = "ks-text-link";

        if (!share.ksTextLinkStyleRegistered)
        {
            style.register(<><![CDATA[
                                    description.ks-text-link {
                                        color           : #0800ab;
                                        text-decoration : underline;
                                        cursor          : pointer !important;
                                    }

                                    description.ks-text-link:hover {
                                        color           : #616161;
                                    }
                                ]]></>.toString());

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
                 if (status) reply(status.screen_name, status.id);
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
                 if (status) retweet(status.id);
             }, M({ja: "このつぶやき => 公式 ", en: ""}) + "RT : Official Retweet",
             "official-retweet,c"],
            // ======================================== //
            [function (status) {
                 if (status) deleteStatus(status.id);
             }, M({ja: "このつぶやき => 削除 : ", en: ""}) + "Delete this status",
             "delete-tweet"],
            // ======================================== //
            [function (status) {
                 if (status) addFavorite(status.id, status.favorited);
             }, M({ja: "このつぶやき => お気に入りへ追加 / 削除 : ", en: ""}) + "Add / Remove this status to favorites",
             "add-to-favorite,c"],
            // ======================================== //
            [function (status) {
                 if (status) gBrowser.loadOneTab("http://twitter.com/" + status.screen_name
                                                 + "/status/" + status.id, null, null, null, false);
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
                 if (status) sendDM(status.screen_name, status.id);
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
                 if (status)
                 {
                     var matched;

                     while ((matched = status.text.match("(h?t?tps?|ftp)(://[a-zA-Z0-9/?;#_*,.:/=&%\\-]+)")))
                     {
                         var prefix = (matched[1] === "ftp") ? "ftp" : "http";
                         if (matched[1][matched[1].length - 1] === 's')
                             prefix += "s";

                         gBrowser.loadOneTab(prefix + matched[2], null, null, null, false);

                         status.text = status.text.slice(status.text.indexOf(matched[2]) + matched[2].length);
                     }
                 }
             }, M({ja: "メッセージ中の URL を開く : ", en: ""}) + "Visit URL in the message",
             "open-url,c"],
            // ======================================== //
            [function (status) {
                 if (status.raw.in_reply_to_status_id)
                     showConversations(status.raw.in_reply_to_status_id, status.raw);
                 else
                     display.echoStatusBar("Oops. No conversations found.", 2000);
             }, M({ja: "会話を表示 : ", en: ""}) + "Show conversations",
             "show-conversations,c"],
            [function (status) {
                 window.setTimeout(function () { self.showTimeline(); }, 0);
             }, M({ja: "更新 / TL へ戻る", en: "Refresh / Display TL"}),
             "refresh-or-back-to-timeline"],
            [function (status) {
                 switchTo();
             }, M({ja: "移動 (リスト, Home, Mentions, ...)", en: "Switch to (Lists, Home, Mentions, ...)"}),
             "switch-to"]
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

                             if (!util.confirm("Delete user from blacklist",
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

        function setAttributes(aElem, aAttributes) {
            if (aAttributes)
                for (let [key, value] in Iterator(aAttributes))
                    if (key && value)
                        aElem.setAttribute(key, value);
        }

        function genElem(aName, aAttributes) {
            let elem = document.createElement(aName);
            setAttributes(elem, aAttributes);
            return elem;
        }

        function applyMenu(aMenu, aMenuSeed) {
            function genMenuItem([label, accessKey, command]) {
                let item;

                if (command instanceof Array)
                {
                    item = genElem("menu", { "label" : label, "accesskey" : accessKey });

                    let popup = genElem("menupopup");
                    command.forEach(function (r) { popup.appendChild(genMenuItem(r)); });
                    item.appendChild(popup);
                }
                else if (label)
                {
                    item = genElem("menuitem", { "label" : label, "accesskey" : accessKey });

                    if (command)
                        item.setAttribute("oncommand", command);
                    else
                        item.setAttribute("disabled", true);
                }
                else
                {
                    item = genElem("menuseparator");
                }

                return item;   // menu, menuitem, menuseparator
            }

            aMenuSeed.forEach(function (r) { aMenu.appendChild(genMenuItem(r)); });

            return aMenu;
        }

        function createMenu(aMenuSeed) {
            return applyMenu(genElem("menupopup"), aMenuSeed);
        }

        function insertAfter(parent, node, referenceNode) {
	    parent.insertBefore(node, referenceNode.nextSibling);
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

        var unreadStatusLabelStyle = getOption("unread_status_count_style");

        // create statusbar icon
        if (!container)
        {
            // create a new one
            container = genElem("statusbarpanel", { align : "center", id : CONTAINER_ID });
            let box, icon;

            // ================================================== //
            // Statuses
            // ================================================== //

            box  = genElem("hbox", { align : "center", flex : 1 });
            icon = genElem("image", { src : TWITTER_ICON });
            unreadStatusLabel = genElem("label", { id : UNREAD_STATUS_ID, flex : 1, value : "-" });
            box.appendChild(icon);
            box.appendChild(unreadStatusLabel);
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

            insertAfter(statusbar, container, statusbarPanel);

            let menu = my.twitterClientStatusBarMenu = createMenu(
                [
                    [M({ja: "お気に入り一覧", en: "Display favorites"}), "f",
                     genCommand.execExt("twitter-client-show-favorites")],
                    [M({ja: "自分のステータス一覧", en: "Display my statuses"}), "m",
                     genCommand.execExt("twitter-client-show-my-statuses")],
                    [M({ja: "自分のリスト一覧", en: "Display my lists"}), "l",
                     genCommand.execExt("twitter-client-show-my-lists")],
                    [M({ja: "ブラックリストの管理", en: "Launch blacklist manager"}), "b",
                     genCommand.execExt("twitter-client-blacklist-manager")],
                    [M({ja: "再認証", en: "Reauthorize"}), "r",
                     genCommand.execExt("twitter-client-reauthorize")]
                ]
            );

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

        if (getOption("enable_header") && !my.twitterClientHeader)
        {
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

            let tooltipTextTwitter     = M({ja: "このユーザの Twitter ページへ", en: "Visit this user's page on twitter"});
            let tooltipTextHome        = M({ja: "このユーザのホームページへ", en: "Visit this user's homepage"});
            let tooltipTextRefresh     = M({ja: "更新", en: "Refresh"});
            let tooltipTextClose       = M({ja: "閉じる", en: "Close"});
            let tooltipTextAddTracking = M({ ja: 'トラッキングワードを追加', en: 'Add new tracking word' });

            let labelTimeline = M({ja: "タイムライン", en: "Timeline"});

            let containerXML =
                               <vbox style="margin-left  : 4px;
                                            margin-right : 4px;"
                                     >
                                   <hbox align="center" flex="1">
                                       <description style="font-weight : bold;
                                                           margin      : 0px 4px;"
                                                    id={HEAD_USER_NAME} />
                                       <spacer flex="1" />
                                       <!-- misc -->
                                       <toolbarbutton label="Home"
                                                      image={TWITTER_ICON}
                                                      oncommand={"KeySnail.modules.prompt.finish(true);" + root + ".showTimeline();"}
                                                      />
                                       <toolbarbutton label="Mentions"
                                                      image={MENTIONS_ICON}
                                                      oncommand={"KeySnail.modules.prompt.finish(true);" + root + ".showMentions();"}
                                                      />
                                       <toolbarbutton label="Favorites"
                                                      image={FAVORITED_ICON}
                                                      oncommand={root + ".showFavorites();"}
                                                      />
                                       <toolbarbutton label="DM"
                                                      image={MESSAGE_ICON}
                                                      oncommand={root + ".showDMs();"}
                                                      />
                                       <toolbarseparator style="height : 16px; margin : 0 4px; padding : 0;" />
                                       <!-- limit -->
                                       <image src={LIMIT_ICON} style="margin-right: 4px;"/>
                                       <description style="margin:auto 4px;" id={HEAD_API_USAGE} />
                                       <toolbarseparator style="height : 16px; margin : 0 4px; padding : 0;" />
                                       <!-- misc -->
                                       <toolbarbutton tooltiptext={tooltipTextClose} class="tab-close-button"
                                                      oncommand="KeySnail.modules.prompt.finish(true);" />
                                   </hbox>
                                   <hbox id={HEAD_CRAWLER_BUTTON_CONTAINER} style="overflow:auto;" >
                                       <spacer flex="1" />
                                       <toolbarseparator id={HEAD_LIST_ORIGIN} style="height : 16px; margin : 0 2px; padding : 0;" />
                                       <toolbarseparator id={HEAD_SEARCH_ORIGIN} style="height : 16px; margin : 0 2px; padding : 0;" />
                                       <toolbarbutton id={HEAD_ADD_SEARCH} image={SEARCH_ADD_ICON}
                                                      tooltiptext={tooltipTextAddTracking}
                                                      oncommand={root + ".addTracking();"} />
                                   </hbox>
                                   <hbox align="center" flex="1">
                                       <vbox align="center">
                                           <image style="border-left   : 1px solid ThreeDShadow;
                                                         border-top    : 1px solid ThreeDShadow;
                                                         border-right  : 1px solid ThreeDHighlight;
                                                         border-bottom : 1px solid ThreeDHighlight;
                                                         max-width     : 46px;
                                                         max-height    : 46px;
                                                         margin-left   : 4px;
                                                         margin-right  : 4px"
                                                  id={HEAD_USER_ICON} />
                                       </vbox>
                                       <vbox align="center" id={HEAD_USER_INFO} >
                                           <vbox align="center">
                                               <toolbarbutton tooltiptext={tooltipTextTwitter} id={HEAD_USER_BUTTON_TWITTER} image={TWITTER_ICON} />
                                               <toolbarbutton tooltiptext={tooltipTextHome} id={HEAD_USER_BUTTON_HOME} image={HOME_ICON} />
                                           </vbox>
                                       </vbox>
                                       <vbox flex="1"
                                             onclick={root + ".tweetBoxClicked(event);"}
                                             id={HEAD_USER_TWEET}
                                             style="background-color : white;
                                                    height           : 50px;
                                                    margin           : 0 4px 4px 4px;
                                                    border-left      : 1px solid ThreeDShadow;
                                                    border-top       : 1px solid ThreeDShadow;
                                                    border-right     : 1px solid ThreeDHighlight;
                                                    border-bottom    : 1px solid ThreeDHighlight;
                                                    overflow         : auto;"
                                             >
                                           <description />
                                       </vbox>
                                   </hbox>
                                   <menupopup id={HEAD_MENU} />
                                   <menupopup id={HEAD_DYNAMIC_MENU} />
                               </vbox>;

            let container = util.xmlToDom(containerXML);

            container.setAttribute("hidden", true);

            document.getElementById("browser-bottombox").insertBefore(
                container, document.getElementById("keysnail-completion-list")
            );

            let crawlerButtonContainer = document.getElementById(HEAD_CRAWLER_BUTTON_CONTAINER);

            // Lists {{ ================================================================= //

            let listOrigin          = document.getElementById(HEAD_LIST_ORIGIN);
            let listButtons         = {};

            for (let [, crawler] in Iterator(gLists))
            {
                let button = document.createElement("toolbarbutton");

                let [id, name] = crawler.name.split("/");
                button.setAttribute("label", name);
                button.setAttribute("tooltiptext", crawler.name);
                button.setAttribute("image", TAG_ICON);
                button.setAttribute("oncommand",
                                    util.format("%s.showCrawledListStatuses('%s', '%s');", root, id, name));
                crawlerButtonContainer.insertBefore(button, listOrigin);

                listButtons[crawler.name] = button;
            }

            // }} ======================================================================= //

            // Search {{ ================================================================ //

            let searchOrigin    = document.getElementById(HEAD_SEARCH_ORIGIN);
            let trackingButtons = {};

            for (let [, crawler] in Iterator(gTrackings))
            {
                let button = document.createElement("toolbarbutton");

                button.setAttribute("label", crawler.name);
                button.setAttribute("tooltiptext", crawler.name);
                button.setAttribute("image", SEARCH_ICON);
                button.setAttribute("oncommand", util.format("%s.showCrawledTrackingStatuses('%s');", root, crawler.name));
                button.setAttribute("onclick", root + ".trackingButtonClicked(event);");
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
            applyMenu(my.twitterClientHeader.normalMenu,
                      [
                          [M({ja: "コピー", en: "Copy"}), "c", root + ".copyCurrentStatus();"],
                          // ================================================== //
                          [M({ja: "返信", en: "Reply"}), "r", root + ".replyToCurrentStatus();"],
                          // ================================================== //
                          ["Retweet (Quote tweet)", "q", root + ".retweetCurrentStatus();"],
                          // ================================================== //
                          [null, null, null],
                          // ================================================== //
                          [M({ja: "このユーザ", en: "This user"}), "u",
                           [
                               [M({ja: "最近のつぶやき", en: "Display this user's statuses"}), "s",
                                root + ".showCurrentTargetStatus();"],
                               // ================================================== //
                               [M({ja: "リスト一覧", en: "Display this user's lists"}), "l",
                                root + ".showCurrentTargetLists();"],
                               // ================================================== //
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

                    notifyWindows(
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
            setOption("popup_new_statuses", false);
        }

        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

        // Popup notifications {{ =================================================== //

        function showPopup(arg) {
            alertsService.showAlertNotification(arg.icon,
                                                arg.title,
                                                arg.message,
                                                !!arg.link,
                                                arg.link,
                                                arg.observer);

        }

        function showOldestUnPopUppedStatus() {
            let status = share.unPopUppedStatuses.pop();
            let popupStatus = false;

            if (getOption("popup_new_statuses"))
            {
                if (!(gBlackUsers && gBlackUsers.some(function (id) id === status.user.screen_name)) && /* user in blacklist */
                    !(share.userInfo && status.user.screen_name === share.userInfo.screen_name))      /* your status*/
                    popupStatus = true;
            }
            else if (getOption("popup_new_replies"))
            {
                if (status.in_reply_to_screen_name && share.userInfo &&
                    status.in_reply_to_screen_name === share.userInfo.screen_name)
                    popupStatus = true;
            }

            if (status.id in share.popUppedIDs)
                popupStatus = false;

            if (!popupStatus)
            {
                // ignore this status and go to next step
                if (share.unPopUppedStatuses && share.unPopUppedStatuses.length)
                    showOldestUnPopUppedStatus();

                return;
            }

            share.popUppedIDs[status.id] = true;

            function proc() {
                if (share.unPopUppedStatuses && share.unPopUppedStatuses.length)
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
            if (share.unPopUppedStatuses && share.unPopUppedStatuses.length > 0)
                share.unPopUppedStatuses = statuses.concat(share.unPopUppedStatuses);
            else
                share.unPopUppedStatuses = statuses;

            showOldestUnPopUppedStatus();
        }

        // }} ======================================================================= //

        // Utils {{ ================================================================= //

        function showLoadingMessage() {
            if (my.twitterClientHeader)
            {
                let header = my.twitterClientHeader;
                let loading = genElem("description", { "style" : "text-align : center; font-weight : bold; font-size : 130%;" });
                loading.appendChild(document.createTextNode(".......... Loading .........."));
                header.userTweet.replaceChild(loading, header.userTweet.firstChild);
            }
        }

        function isRetryable(xhr) {
            return (xhr.status === 401)
                && ((xhr.responseText.indexOf("Could not authenticate you") !== -1) ||
                    (xhr.responseText.indexOf("This method requires authentication") !== -1));
        }

        function shortenURL(aURL) {
            const id  = getOption("jmp_id");
            const key = getOption("jmp_key");

            var xhr = new XMLHttpRequest();
            var endPoint = "http://api.j.mp/shorten?" +
                util.format('version=2.0.1&login=%s&apiKey=%s&longUrl=%s', id, key, encodeURIComponent(aURL));

            xhr.mozBackgroundRequest = true;
            xhr.open("GET", endPoint, false);
            xhr.send(null);

            var response = decodeJSON(xhr.responseText);

            if (response && response.results && response.results[aURL])
                return response.results[aURL].shortUrl;

            return aURL;
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

        function authorize() {
            gOAuth.asyncRequest(
                {
                    action   : gOAuth.info.requestToken,
                    method   : "GET",
                    accessor : {
                        consumerSecret : gOAuth.info.consumerSecret,
                        tokenSecret    : ""
                    },
                    authorize : true
                },
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if (xhr.status === 200)
                        {
                            var parts = xhr.responseText.split("&");

                            try
                            {
                                gOAuth.tokens.oauth_token        = parts[0].split("=")[1];
                                gOAuth.tokens.oauth_token_secret = parts[1].split("=")[1];

                                gBrowser.loadOneTab("http://twitter.com/oauth/authorize?oauth_token=" + gOAuth.tokens.oauth_token,
                                                    null, null, null, false);
                            }
                            catch (e)
                            {
                                display.notify(e + xhr.responseText);
                            }
                        }
                        else if (xhr.status >= 500)
                            display.notify("Whale error :: " + xhr.responseText);
                        else
                            display.notify("Unknown error :: " + xhr.responseText);
                    }
                }
            );
        }

        function reAuthorize() {
            util.setUnicharPref(gPrefKeys.oauth_token, "");
            util.setUnicharPref(gPrefKeys.oauth_token_secret, "");

            gStatuses.cache = null;
            gMentions.cache = null;

            authorizationSequence();
        }

        function authorizationSequence() {
            authorize();

            gPrompt.close();

            prompt.read(M({ja: "認証が終了したら Enter キーを押してください", en: "Press Enter When Authorization Finished:"}),
                        function (str) {
                            if (str === null)
                                return;

                            getAccessToken(function () { showFollowersStatus(); });
                        });
        }

        function getAccessToken(aCallBack) {
            gOAuth.asyncRequest(
                {
                    action : gOAuth.info.accessToken,
                    method : "GET"
                },
                function (aEvent, xhr) {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200)
                        {
                            try
                            {
                                var parts = xhr.responseText.split("&");

                                gOAuth.tokens.oauth_token = parts[0].split("=")[1];
                                gOAuth.tokens.oauth_token_secret = parts[1].split("=")[1];
                                util.setUnicharPref(gPrefKeys.oauth_token, gOAuth.tokens.oauth_token);
                                util.setUnicharPref(gPrefKeys.oauth_token_secret, gOAuth.tokens.oauth_token_secret);

                                if (typeof aCallBack === "function")
                                    aCallBack();
                            }
                            catch (e)
                            {
                                display.notify(e +  xhr.responseText);
                            }
                        }
                        else if (xhr.status >= 500)
                            log(LOG_LEVEL_ERROR, "whale error :: " + xhr.responseText);
                        else
                            log(LOG_LEVEL_ERROR, "unknown error :: " + xhr.responseText);
                    }
                }
            );
        }

        // }} ======================================================================= //

        // Actions {{ =============================================================== //

        function showFavorites(aTargetID) {
            gOAuth.asyncRequest(
                twitterAPI.get("getFavorites", (aTargetID ? ("?id=" + aTargetID) : "")),
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if (isRetryable(xhr))
                        {
                            showFavorites(aTargetID);
                            return;
                        }
                        if (xhr.status !== 200)
                        {
                            display.echoStatusBar(M({en: "Failed to get favorites", ja: "お気に入り一覧の取得に失敗しました"}));
                            return;
                        }

                        var statuses = decodeJSON(xhr.responseText);

                        callSelector(statuses, M({ja: "お気に入り一覧", en: "Favorites"}));
                    }
                });
        }

        function addFavorite(aStatusID, aDelete) {
            gOAuth.asyncRequest(
                twitterAPI.get(aDelete ? "destroyFavorite" : "createFavorite", aStatusID),
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if (isRetryable(xhr))
                        {
                            addFavorite(aStatusID, aDelete);
                            return;
                        }

                        var errorMsg = aDelete ? M({ja: "お気に入りから削除できませんでした", en: "Failed to remove status from favorites"})
                        : M({ja: "お気に入りに追加できませんでした", en: "Failed to add status to favorites"});
                        var successMsg = aDelete ? M({ja: "お気に入りから削除しました", en: "Removed status from favorites"})
                        : M({ja: "お気に入りに追加しました", en: "Added status to favorites"});


                        if (xhr.status !== 200)
                        {
                            display.echoStatusBar(errorMsg, 2000);
                            return;
                        }

                        var status = decodeJSON(xhr.responseText);
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

                        if (prompt.refresh)
                            prompt.refresh();
                    }
                }
            );
        }

        function search() {
            function doSearch(aWord) {
                if (!aWord)
                    return;

                gOAuth.asyncRequest(
                    twitterAPI.get("search", "?rpp=100&q=" + encodeURIComponent(aWord)),
                    function (aEvent, xhr) {
                        if (xhr.readyState === 4)
                        {
                            if (isRetryable(xhr))
                            {
                                doSearch(aWord);
                                return;
                            }

                            if (xhr.status !== 200)
                            {
                                display.echoStatusBar(M({ja: "検索に失敗しました",
                                                         en: "Failed to search word"}), 3000);
                                return;
                            }

                            var results = (decodeJSON( xhr.responseText) || {"results":[]}).results;

                            if (!results || !results.length) {
                                display.echoStatusBar(M({ja: aWord + L(" に対する検索結果はありません"),
                                                         en: "No results for " + aWord}), 3000);
                                return;
                            }

                            callSelector(results.map(filterSearchResult), 'Search result for "' + aWord + '"');
                        }
                    }
                );
            }

            gPrompt.close();
            prompt.read("search:", doSearch, null, null, null, 0, "twitter_search");
        }

        function copy(aMsg) {
            command.setClipboardText(aMsg);
            display.echoStatusBar(M({ja: "コピーしました", en: "Copied"}) + " : " + aMsg, 2000);
        }

        function reply(aUserID, aStatusID) {
            let init = "@" + aUserID + " ";
            tweet(init, aStatusID, init.length);
        }

        function sendDM(userID, statusID) {
            let init = "d " + userID + " ";
            tweet(init, statusID, init.length);
        }

        function quoteTweet(aUserID, aMsg) {
            tweet("RT @" + aUserID + ": " + aMsg);
        }

        function retweet(aID) {
            gOAuth.asyncRequest(
                twitterAPI.get("retweet", aID),
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if ((xhr.status === 401) && (xhr.responseText.indexOf("expired") !== -1))
                            reAuthorize(); // expired
                        else if (isRetryable(xhr))
                            retweet(aID);
                        else if (xhr.status !== 200)
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
                            var status    = decodeJSON(xhr.responseText);
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

        function tweet(aInitialInput, aReplyID, aCursorEnd) {
            var statusbar = document.getElementById('statusbar-display');
            var limit = 140;

            gPrompt.close();
            prompt.reader(
                {
                    message      : "tweet:",
                    initialcount : 0,
                    initialinput : aInitialInput,
                    group        : "twitter_tweet",
                    keymap       : getOption("tweet_keymap"),
                    cursorEnd    : aCursorEnd,
                    onChange     : function (arg) {
                        var current = arg.textbox.value;
                        var length  = current.length;
                        var count   = limit - length;
                        var msg     = M({ja: ("残り " + count + " 文字"), en: count});

                        if (count < 0)
                            msg = M({ja: ((-count) + " 文字オーバー"), en: ("Over " + (-count) + " characters")});

                        statusbar.label = msg;
                    },
                    callback: function postTweet(aTweet) {
                        statusbar.label = "";

                        if (aTweet === null)
                            return;

                        var parameters = [["source", "KeySnail"], ["status" , aTweet]];
                        if (aReplyID)
                            parameters.push(["in_reply_to_status_id", aReplyID.toString()]);;

                        var aQuery = "source=KeySnail&status=" + encodeURIComponent(aTweet);
                        if (aReplyID)
                            aQuery += "&in_reply_to_status_id=" + aReplyID;

                        var updateAPI        = twitterAPI.get("update");
                        updateAPI.send       = aQuery;
                        updateAPI.parameters = parameters;

                        gOAuth.asyncRequest(
                            updateAPI,
                            function (aEvent, xhr) {
                                if (xhr.readyState === 4)
                                {
                                    if (xhr.status === 401 && xhr.responseText.indexOf("expired") !== -1)
                                        reAuthorize();
                                    else if (isRetryable(xhr))
                                    {
                                        // retry
                                        log(LOG_LEVEL_DEBUG, "Failed to tweet. Retry");
                                        postTweet(aTweet);
                                    }
                                    else if (xhr.status !== 200)
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
                                        var status = decodeJSON(xhr.responseText);
                                        // immediately add
                                        gStatuses.cache.unshift(status);
                                        share.twitterImmediatelyAddedStatuses.push(status);

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
            gOAuth.asyncRequest(
                twitterAPI.get("destroyTweet", aStatusID),
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if (isRetryable(xhr))
                        {
                            deleteStatus(aStatusID);
                            return;
                        }

                        if (xhr.status !== 200)
                        {
                            display.echoStatusBar(M({ja: 'ステータスの削除に失敗しました。',
                                                     en: "Failed to delete status"}), 2000);
                            return;
                        }

                        // delete from cache
                        for (var i = 0; i < gStatuses.cache.length; ++i)
                        {
                            if (gStatuses.cache[i].id === aStatusID)
                            {
                                gStatuses.cache.splice(i, 1);
                                break;
                            }
                        }

                        setLastID(gStatuses);

                        display.echoStatusBar(M({ja: 'ステータスが削除されました',
                                                 en: "Status deleted"}), 2000);
                    }
                });
        }

        function showListStatuses(aScreenName, aListName) {
            gOAuth.asyncRequest(
                twitterAPI.get("getListStatuses", aScreenName, aListName, "?per_page=" + gTimelineCountBeginning),
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if (isRetryable(xhr))
                        {
                            showListStatuses(aScreenName, aListName);
                            return;
                        }

                        if (xhr.status !== 200)
                        {
                            display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。',
                                                     en: "Failed to get statuses"}), 2000);
                            return;
                        }

                        var statuses = decodeJSON(xhr.responseText) || [];
                        callSelector(
                            statuses,
                            M({ja: util.format("%s/%s のタイムライン", aScreenName, aListName),
                               en: util.format("Timeline of %s/%s", aScreenName, aListName)})
                        );
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
                gOAuth.asyncRequest(
                    twitterAPI.get("getLists", aScreenName),
                    function (aEvent, xhr) {
                        if (xhr.readyState === 4)
                        {
                            if (isRetryable(xhr))
                            {
                                showLists(aScreenName);
                                return;
                            }

                            if (xhr.status !== 200)
                            {
                                display.echoStatusBar(M({ja: 'リスト一覧の取得に失敗しました。',
                                                         en: "Failed to get lists"}), 2000);
                                return;
                            }

                            let result = decodeJSON(xhr.responseText);
                            if (!share.twitterListCache)
                                share.twitterListCache = {};
                            share.twitterListCache[aScreenName] = result;

                            showListsInPrompt(result);
                        }
                    });
            }

            function showListsInPrompt(cache) {
                let collection = Array.slice((cache || {lists:[]}).lists).map(
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
                return "(" + unreadCount + ") " + crawler.name;
            }

            let lists = [[TAG_ICON, crawlerToLabel(crawler), (function (name) {
                                               return function () {
                                                   self.showCrawledListStatuses.apply(null, name.split("/"));
                                               };
                                           })(name)]
                         for ([name, crawler] in Iterator(gLists))];

            let trackings = [[SEARCH_ICON, crawlerToLabel(crawler), (function (name) {
                                               return function () {
                                                   self.showCrawledTrackingStatuses.call(null, name);
                                               };
                                           })(name)]
                         for ([name, crawler] in Iterator(gTrackings))];

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
                    keymap     : getOption("switch_to_keymap"),
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
                (maps || []).forEach(function (m) m.forEach(function (s) map[s.id] = s));
                return map;
            }

            let map = createMap([gStatuses.cache, gMentions.cache]);

            gPrompt.forced = true;
            callSelector(conversations);

            function trail(from) {
                function next(status) {
                    gPrompt.forced = true;
                    callSelector(conversations);

                    if (status.in_reply_to_status_id)
                        trail(status.in_reply_to_status_id);
                }

                if (from in map)
                {
                    conversations.push(map[from]);
                    next(map[from]);
                }
                else
                {
                    util.httpGet(
                        "http://api.twitter.com/1/statuses/show/" + from + ".json",
                        false,
                        function (xhr) {
                            let result = decodeJSON("(" + xhr.responseText + ")");
                            conversations.push(result);

                            display.echoStatusBar(util.format(M({ja: "会話リストを取得中... (%s)",
                                                                 en: "Fetching conversations ... (%s)"}),
                                                              conversations.length));
                            next(result);
                        }
                    );
                }
            }

            trail(id);
        }

        function showCrawlersCache(crawler, arg, cacheFilter) {
            var updateForced = typeof arg === "number";

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

                    crawler.update(
                        function () {
                            callSelector(cacheFilter ? cacheFilter(crawler.cache) : crawler.cache, crawler.name);
                            setLastID(crawler);
                        },
                        updateForced,
                        false);
                }
            }
            else
            {
                // use cache
                callSelector(cacheFilter ? cacheFilter(crawler.cache) : crawler.cache, crawler.name);
                setLastID(crawler);
            }
        }

        function showFollowersStatus(arg) {
            showCrawlersCache(gStatuses, arg);
        }

        function showMentions(arg) {
            showCrawlersCache(gMentions, arg);
        }

        function showTargetStatus(target) {
            gOAuth.asyncRequest(
                twitterAPI.get("userTimeline", target, "?count=" + gTimelineCountEveryUpdates),
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if (isRetryable(xhr))
                        {
                            showTargetStatus(target);
                            return;
                        }

                        if (xhr.status !== 200)
                        {
                            display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。',
                                                     en: "Failed to get statuses"}), 2000);
                            return;
                        }

                        var statuses = decodeJSON(xhr.responseText) || [];
                        callSelector(statuses, M({ja: target + " のつぶやき一覧", en: "Tweets from " + target}));
                    }
                }
            );
        }

        // ================================================================================ //
        // Sub methods
        // ================================================================================ //

        function focusContent() {
            getBrowser().focus();
            _content.focus();
        }

        function createMessage(msg, status) {
            let specialPattern = /(@[a-zA-Z0-9_]+|((http|ftp)s?\:\/\/|www\.)[^\s]+)|(#[a-zA-Z0-9_]+)/g;

            let matched = msg.match(specialPattern);
            let message = genElem("description", { style : "-moz-user-select : text !important;" });

            if (matched)
            {
                for (let i = 0; i < matched.length; ++i)
                {
                    let pos   = msg.indexOf(matched[i]);
                    let left  = msg.slice(0, pos);
                    let right = msg.slice(pos + matched[i].length);

                    let url;
                    let type =
                        matched[i][0] === '@' ? "user" :
                        matched[i][0] === '#' ? "hash" : "url";

                    if (type === "user")
                        url = "http:twitter.com/" + matched[i].slice(1);
                    else if (type === "hash")
                        url = "http://twitter.com/search?q=" + encodeURIComponent(matched[i]);
                    else
                    {
                        url = matched[i];
                        if (url.indexOf("www") === 0)
                            url = "http://" + url;
                    }

                    message.appendChild(document.createTextNode(left));
                    message.appendChild(genElem("description", { "class"       : gLinkClass,
                                                                 "tooltiptext" : url,
                                                                 "value"       : matched[i] }));

                    msg = right;
                }

                if (msg.length)
                    message.appendChild(document.createTextNode(msg));
            }
            else
            {
                message.appendChild(document.createTextNode(msg));
            }

            if (status.in_reply_to_status_id)
            {
                let url = "http:twitter.com/" + status.in_reply_to_screen_name + "/status/" + status.in_reply_to_status_id;
                message.appendChild(genElem("description",
                                            {"class"       : gLinkClass,
                                             "tooltiptext" : url,
                                             "value"       : "[in reply to]"}));
            }

            return message;
        }

        function callSelector(aStatuses, aMessage, aNoFilter) {
            if (!aStatuses)
                return;

            var current = new Date();

            // ignore black users
            var statuses = aNoFilter ? aStatuses :
                aStatuses.filter(
                    function (status) gBlackUsers.every(function (name) status.user.screen_name !== name)
                );

            function favIconGetter(aRow) aRow[0].favorited ? FAVORITED_ICON : "";

            let preferScreenName = getOption("prefer_screen_name");
            let showSources      = getOption("show_sources");

            var collection = statuses.map(
                function (status) {
                    var created = Date.parse(status.created_at);
                    var matched = status.source ? status.source.match(">(.*)</a>") : "";

                    return [status,
                            status.user.profile_image_url,
                            preferScreenName ? status.user.screen_name : status.user.name,
                            html.unEscapeTag(status.text),
                            favIconGetter,
                            util.format("%s %s",
                                        getElapsedTimeString(current - created),
                                        showSources ? (matched ? matched[1] : "Web") : "",
                                        (status.in_reply_to_screen_name ?
                                         " to " + status.in_reply_to_screen_name : ""))];
                }
            );

            const ico = ICON   | IGNORE;
            const hid = HIDDEN | IGNORE;

            if (!aMessage) aMessage = M({ja: "タイムライン", en: "Timeline"});

            let currentID               = statuses[0] ? statuses[0].id : null;
            let selectedUserID          = statuses[0] ? statuses[0].user.screen_name : null;
            let selectedUserInReplyToID = statuses[0] ? statuses[0].in_reply_to_screen_name : null;

            let header = my.twitterClientHeader;
            let headerEnabled = getOption("enable_header");

            gPrompt.close();

            function onFinish() {
                if (headerEnabled)
                    header.container.setAttribute("hidden", true);
            }

            if (headerEnabled)
                header.container.setAttribute("hidden", false);

            prompt.selector(
                {
                    message    : "pattern:",
                    collection : collection,
                    // status, icon, name, message, fav-icon, info
                    flags      : [hid, ico, 0, 0, ico, 0],
                    header     : [M({ja: 'ユーザ', en: "User"}), aMessage, M({ja : "情報", en: 'Info'})],
                    style      : getOption("fancy_mode") ? null : ["color:#0e0067;", "", "color:#660025;"],
                    width      : getOption("main_column_width"),
                    beforeSelection : function (arg) {
                        if (!arg.row)
                            return;

                        let status = arg.row[0];

                        // accessible from out of this closure
                        my.twitterSelectedStatus = status;

                        selectedUserID          = status.user.screen_name;
                        currentID               = status.id;
                        selectedUserInReplyToID = status.in_reply_to_screen_name;

                        if (headerEnabled)
                        {
                            if (my.twitterClientHeaderUpdater)
                                clearTimeout(my.twitterClientHeaderUpdater);

                            function updateHeader() {
                                header.userIcon.setAttribute("src", arg.row[1]);
                                header.userIcon.setAttribute("tooltiptext", status.user.description);
                                header.userName.setAttribute("value", status.user.screen_name + " / " + status.user.name);
                                header.userName.setAttribute("tooltiptext", status.user.description);

                                setIconStatus(header.buttonHome, !!status.user.url);
                                if (status.user.url)
                                    header.buttonHome.setAttribute("onclick", genCommand.openLink(status.user.url));
                                else
                                    header.buttonHome.removeAttribute("onclick");

                                header.buttonTwitter.setAttribute("onclick", genCommand.openLink('http://twitter.com/' + status.user.screen_name));

                                header.userTweet.replaceChild(createMessage(html.unEscapeTag(status.text), status), header.userTweet.firstChild);

                                my.twitterClientHeaderUpdater = null;
                            }

                            // add delay
                            my.twitterClientHeaderUpdater = setTimeout(updateHeader, 90);
                        }
                    },
                    onFinish : onFinish,
                    stylist  : getOption("fancy_mode") ?
                        function (args, n, current) {
                            if (current !== collection)
                                return null;

                            let status = args[0];

                            let style = "";

                            if (share.userInfo)
                            {
                                if (status.user.screen_name === share.userInfo.screen_name)
                                    style += getOption("my_tweet_style");

                                if (status.in_reply_to_screen_name === share.userInfo.screen_name)
                                    style += getOption("reply_to_me_style");
                            }

                            if (status.user.screen_name === selectedUserID)
                            {
                                if (status.id === currentID)
                                    style += getOption("selected_row_style");
                                else
                                    style += getOption("selected_user_style");
                            }
                            else if (status.user.screen_name === selectedUserInReplyToID)
                                style += getOption("selected_user_reply_to_style");
                            else if (status.user.in_reply_to_screen_name &&
                                     status.user.in_reply_to_screen_name === selectedUserInReplyToID)
                                style += getOption("selected_user_reply_to_reply_to_style");
                            else if (status.retweeted_status)
                                style += getOption("retweeted_status_style");

                            return style;
                        } : null,
                    filter : function (aIndex) {
                        var status = statuses[aIndex];

                        return (aIndex < 0 ) ? [null] :
                            [{
                                 screen_name : status.user.screen_name,
                                 id          : status.id,
                                 user_id     : status.user.id,
                                 text        : html.unEscapeTag(status.text),
                                 favorited   : status.favorited,
                                 raw         : status
                             }];
                    },
                    keymap  : getOption("keymap"),
                    actions : gTwitterCommonActions
                });
        }

        function modifyCache(aId, proc) {
            for (let [, status] in Iterator(gStatuses.cache))
                if (status.id === aId)
                    proc(status);
        }

        function setLastID(crawler) {
            if (crawler.cache && crawler.cache.length)
            {
                crawler.lastID = crawler.cache[0].id;

                if (typeof crawler.lastIDHook === "function")
                    crawler.lastIDHook();
            }
        }

        function getStatusPos(aJSON, aID) {
            if (!aJSON)
                return 0;

            if (!aID)
                return aJSON.length;

            aID = +aID;        // string => number

            for (var i = 0; i < aJSON.length; ++i)
                if (aJSON[i].id === aID)
                    return i;

            return aJSON.length;
        }

        function setUserInfo() {
            gOAuth.asyncRequest(
                twitterAPI.get("verification"),
                function (aEvent, xhr) {
                    if (xhr.readyState === 4)
                    {
                        if (isRetryable(xhr))
                        {
                            log(LOG_LEVEL_DEBUG, "setUserInfo: retry");
                            setUserInfo();
                            return;
                        }

                        if (xhr.status !== 200)
                            return;

                        var account = decodeJSON("(" + xhr.responseText + ")");

                        share.userInfo = account;

                        log(LOG_LEVEL_DEBUG, "user info successfully set");
                    }
                });
        }

        /**
         * @public
         */
        var self = {
            // Context menu {{ ========================================================== //

            tweetBoxClicked: function (aEvent) {
                let elem   = aEvent.target;
                let text   = elem.value || "";
                let isLink = elem.getAttribute("class") === gLinkClass;
                let status = my.twitterSelectedStatus;

                if (aEvent.button === 2)
                {
                    // right click
                    if (isLink)
                    {
                        if (text[0] === '@')
                        {
                            let userName = text.slice(1);
                            showDynamicMenu(aEvent,
                                            [
                                                [util.format(M({ja: "%s のステータスを一覧表示", en: "Display %s's status"}), userName), "s",
                                                 root + util.format(".showTargetStatus('%s');", userName)],
                                                [util.format(M({ja: "%s の Twitter ホームへ", en: "%s in twitter"}), userName), "h",
                                                 genCommand.openLink("http://twitter.com/" + userName)]
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
                                [M({ja: "開く", en: "Open URL"}), "o", genCommand.openLink(url)],
                                [M({ja: "URL をコピー", en: "Copy URL"}), "c",
                                 'KeySnail.modules.command.setClipboardText("' + url + '")']
                            ];

                            if (url.match("^http://(j\\.mp|bit\\.ly)/"))
                            {
                                actions.push([M({ja: "URL がクリックされた回数を表示", en: "Inspect this link"}), "i",
                                              genCommand.openLink(url + "+")]);
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
                    reply(status.user.screen_name, status.id);
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

            listRelationShips: function () {
                gOAuth.asyncRequest(
                    twitterAPI.get("friends"),
                    function (aEvent, xhr) {
                        if (xhr.readyState === 4)
                        {
                            if (xhr.status !== 200)
                            {
                                if (isRetryable(xhr))
                                {
                                    log(LOG_LEVEL_DEBUG, "listRelationShips: retry %s", new Date());
                                    self.listRelationShips();
                                    return;
                                }

                            }

                            let relationships = decodeJSON(xhr.responseText);
                        }
                    }
                );
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
                let toggled = !getOption("popup_new_statuses");

                setOption("popup_new_statuses", toggled);
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
                tweet((arg ? "" : '"' + content.document.title + '" - ') + shortenURL(window.content.location.href));
            },

            showMentions: function () { showMentions.apply(this, arguments); },

            showDMs: function (arg) {
                gPrompt.forced = true;
                showLoadingMessage();
                showCrawlersCache(gDMs, arg, gSentDMs.cache ?
                                  function (c) c.concat(gSentDMs.cache).sort(function (a, b) b.id - a.id)
                                  : null);
            },

            showCrawledListStatuses: function (id, listName) {
                let crawler = gLists[id + "/" + listName];

                if (crawler)
                {
                    gPrompt.forced = true;
                    showCrawlersCache(crawler);
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
                let count = arg || gTimelineCountBeginning;
                if (count < 0)
                    count = gTimelineCountBeginning;

                gOAuth.asyncRequest(
                    twitterAPI.get("myTimeline", "?count=" + Math.min(count, 200)),
                    function (aEvent, xhr) {
                        if (xhr.readyState === 4)
                        {
                            if (xhr.status !== 200)
                            {
                                display.echoStatusBar(M({en: "Failed to get your statuses", ja: "ステータスの取得に失敗しました"}));
                                return;
                            }

                            var statuses = decodeJSON(xhr.responseText);
                            callSelector(statuses);
                        }
                    });
            },

            updateStatusbar: function () {
                // calc unread statuses count
                if (gStatuses.cache)
                {
                    let unreadStatusCount = getStatusPos(gStatuses.cache, gStatuses.lastID);
                    unreadStatusLabel.setAttribute("value", unreadStatusCount);
                    unreadStatusLabel.parentNode.setAttribute("tooltiptext",
                                                              unreadStatusCount + M({ja: " 個の未読ステータスがあります", en: " unread statuses"}));

                    log(1000, "statusbar count updated (statuses)");
                }

                if (gMentions.cache)
                {
                    let unreadMentionCount = getStatusPos(gMentions.cache, gMentions.lastID);
                    unreadMentionLabel.setAttribute("value", unreadMentionCount);
                    unreadMentionLabel.parentNode.setAttribute("tooltiptext",
                                                               unreadMentionCount + M({ja: " 個のあなたへの @ (言及) があります", en: " unread mentions"}));

                    log(1000, "statusbar count updated (mentinos)");
                }

                if (gDMs.cache)
                {
                    let unreadDMCount = getStatusPos(gDMs.cache, gDMs.lastID);
                    unreadDMLabel.setAttribute("value", unreadDMCount);
                    unreadDMLabel.parentNode.setAttribute("tooltiptext",
                                                          unreadDMCount + M({ja: " 個のあなた宛 DM があります", en: " direct messages"}));

                    log(1000, "statusbar count updated (dms)");
                }
            },

            updateListButton: function () {
                let listButtons = my.twitterClientHeader.listButtons;

                for (let [, crawler] in Iterator(gLists))
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

                for (let [, crawler] in Iterator(gTrackings))
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

            trackingButtonClicked: function (ev) {
                if (ev.button !== 2)
                    return;

                let name = ev.target.getAttribute("tooltiptext");

                if (name in gTrackings)
                {
                    showDynamicMenu(ev,
                                    [[M({ ja: '更新', en: 'Reflesh' }),
                                      null,
                                      root + util.format(".showCrawledTrackingStatuses('%s', true);", name)],
                                     [M({ ja: 'トラッキング間隔を変更', en: 'Change tracking interval' }),
                                      null,
                                      root + util.format(".changeTrackingInterval('%s');", name)],
                                     [M({ ja: 'トラッキングを終了', en: 'Cancel tracking this word' }),
                                      null,
                                      root + util.format(".removeTracking('%s');", name)]]);
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
            switchTo          : switchTo
        };

        // ============================================================ //
        // Initialize
        // ============================================================ //

        if (!share.popUppedIDs)
            share.popUppedIDs = {};

        if (!share.userInfo)
            self.setUserInfo();

        if (getOption("automatically_begin"))
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

        if (getOption("automatically_begin_list"))
        {
            for (let [, crawler] in Iterator(gLists))
            {
                if (crawler.cache)
                    continue;
                crawler.update();
            }

            self.updateListButton();
        }

        if (getOption("automatically_begin_tracking"))
        {
            for (let [, crawler] in Iterator(gTrackings))
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

ext.add("twitter-client-display-timeline", twitterClient.showTimeline,
        M({ja: 'TL を表示',
           en: "Display your timeline"}));

ext.add("twitter-client-tweet", function () { twitterClient.tweet(); },
        M({ja: 'つぶやく',
           en: "Tweet!"}));

ext.add("twitter-client-tweet-this-page", twitterClient.tweetWithTitleAndURL,
        M({ja: 'このページのタイトルと URL を使ってつぶやく',
           en: "Tweet with the title and URL of this page"}));

ext.add("twitter-client-search-word", twitterClient.search,
        M({ja: 'Twitter 検索',
           en: "Search word on Twitter"}));

ext.add("twitter-client-show-mentions", twitterClient.showMentions,
        M({ja: '@ 一覧表示 (自分への言及一覧)',
           en: "Display @ (Show mentions)"}));

ext.add("twitter-client-show-favorites", twitterClient.showFavorites,
        M({ja: '自分のお気に入りを一覧表示',
           en: "Display favorites"}));

ext.add("twitter-client-show-my-statuses", twitterClient.showUsersTimeline,
        M({ja: '自分のつぶやきを一覧表示',
           en: "Display my statuses"}));

ext.add("twitter-client-show-my-lists", twitterClient.showMyLists,
        M({ja: '自分のリストを一覧表示',
           en: "Display my lists"}));

ext.add("twitter-client-blacklist-manager", twitterClient.blackUsersManager,
        M({ja: 'ブラックリストの管理',
           en: "Launch blacklist manager"}));

ext.add("twitter-client-toggle-popup-status", twitterClient.togglePopupStatus,
        M({ja: 'ポップアップ通知の切り替え',
           en: "Toggle popup status"}));

ext.add("twitter-client-reauthorize", twitterClient.reAuthorize,
        M({ja: '再認証',
           en: "Reauthorize"}));

ext.add("twitter-client-switch-to", twitterClient.switchTo,
        M({ja: 'リスト, Home, Mentioins, Favorites などを選択',
           en: "Select Lists, Home, Mentions, Favirites, ..."}));

// }} ======================================================================= //

// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Yet Another Twitter Client KeySnail</name>
    <description>Make KeySnail behave like Twitter client</description>
    <description lang="ja">KeySnail を Twitter クライアントに</description>
    <version>2.1.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/yet-another-twitter-client-keysnail.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/yet-another-twitter-client-keysnail.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.4.6</minVersion>
    <include>main</include>
    <provides>
        <ext>twitter-client-display-timeline</ext>
        <ext>twitter-client-tweet</ext>
        <ext>twitter-client-tweet-this-page</ext>
        <ext>twitter-client-show-my-statuses</ext>
        <ext>twitter-client-show-my-lists</ext>
        <ext>twitter-client-show-mentions</ext>
        <ext>twitter-client-show-favorites</ext>
        <ext>twitter-client-search-word</ext>
        <ext>twitter-client-blacklist-manager</ext>
        <ext>twitter-client-toggle-popup-status</ext>
        <ext>twitter-client-reauthorize</ext>
    </provides>
    <require>
        <script>http://github.com/mooz/keysnail/raw/master/plugins/lib/oauth.js</script>
    </require>
    <options>
        <option>
            <name>twitter_client.automatically_begin</name>
            <type>boolean</type>
            <description>Automatically begin fetching the statuses</description>
            <description lang="ja">プラグインロード時、自動的にステータスの取得を開始するかどうか</description>
        </option>
        <option>
            <name>twitter_client.automatically_begin_list</name>
            <type>boolean</type>
            <description>Automatically begin fetching the list statuses</description>
            <description lang="ja">プラグインロード時、自動的にリストのステータスの取得を開始するかどうか</description>
        </option>
        <option>
            <name>twitter_client.timeline_count_beginning</name>
            <type>integer</type>
            <description>Number of timelines this client fetches in the beginning (default 80)</description>
            <description lang="ja">起動時に取得するステータス数 (デフォルト: 80)</description>
        </option>
        <option>
            <name>twitter_client.timeline_count_every_updates</name>
            <type>integer</type>
            <description>Number of timelines this client fetches at once (default 20)</description>
            <description lang="ja">初回以降の更新で一度に取得するステータス数 (デフォルト: 20)</description>
        </option>
        <option>
            <name>twitter_client.popup_new_statuses</name>
            <type>boolean</type>
            <description>Whether display pop up notification when statuses are updated or not</description>
            <description lang="ja">ステータス更新時にポップアップ通知を行うかどうか (デフォルト: OFF)</description>
        </option>
        <option>
            <name>twitter_client.popup_new_replies</name>
            <type>boolean</type>
            <description>Popup only new mentions</description>
            <description lang="ja">自分への返信だけポップアップ表示する (デフォルト: ON)</description>
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
            <name>twitter_client.black_users</name>
            <type>[string]</type>
            <description>Specify user id who you don&apos;t want to see in the timeline :)</description>
            <description lang="ja">タイムラインに表示させたくないユーザの id を配列で指定</description>
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
            <description lang="ja">ローカルキーマップ</description>
        </option>
        <option>
            <name>twitter_client.tweet_keymap</name>
            <type>object</type>
            <description>Local keymap for tweet input box</description>
            <description lang="ja">つぶやき入力部分のローカルキーマップ</description>
        </option>
        <option>
            <name>twitter_client.fancy_mode</name>
            <type>boolean</type>
            <description>Enable fancy mode</description>
            <description lang="ja">TL に色付けを行うかどうか</description>
        </option>
        <option>
            <name>twitter_client.enable_header</name>
            <type>boolean</type>
            <description>Enable header</description>
            <description lang="ja">ヘッダを表示するかどうか</description>
        </option>
        <option>
            <name>twitter_client.jmp_id</name>
            <type>string</type>
            <description>Specify ID of your j.mp account if you want use your one</description>
            <description lang="ja">j.mp の URL 短縮で独自アカウントを用いたい場合、その ID を指定</description>
        </option>
        <option>
            <name>twitter_client.jmp_key</name>
            <type>string</type>
            <description>Specify Key of your j.mp account if you want use your one</description>
            <description lang="ja">j.mp の URL 短縮で独自アカウントを用いたい場合、その Key を指定</description>
        </option>
        <option>
            <name>twitter_client.prefer_screen_name</name>
            <type>boolean</type>
            <description>If you prefer screen name to user name to be displayed, set this value to true.</description>
            <description lang="ja">TL 一覧などでユーザ名の代わりに ID (screen name) を表示したい場合 true へ設定.</description>
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

Here is the example settings. This makes twitter client plugin tweet-only.

>||
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

>||
key.setViewKey("t",
    function (ev, arg) {
        ext.exec("twitter-client-display-timeline", arg);
    }, "TL を表示", true);
||<

上記のようなコードを .keysnail.js へ記述しておくことにより (以下 「設定を行う」 と表記)、ブラウズ画面において t キーを押すことでこのクライアントを起動させることが可能となります。

タイムラインを表示させず即座につぶやきたいという場合には、次のような設定がおすすめです。

>||
key.setGlobalKey(["C-c", "t"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet", arg);
    }, "つぶやく", true);
||<

こうした設定を行っておくと C-c t を押すことで即座につぶやき画面を表示することが可能となります。

閲覧しているページのタイトルと URL をつぶやくことも可能です。以下のような設定を行っておきましょう。

>||
key.setGlobalKey(["C-c", "T"],
    function (ev, arg) {
        ext.exec("twitter-client-tweet-this-page", arg);
    }, "このページのタイトルと URL を使ってつぶやく", true);
||<

==== キーバインドの設定 ====

次のような設定を .keysnail.js の PRESERVE エリアへ貼り付けておくと、格段にに操作がしやすくなります。
(先ほどとは異なり .keysnail.js 先頭の PRESERVE エリアへ設定コードを記述しなければならないことに注意してください)

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

>||
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

>||
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

>||
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

// ChangeLog {{ ============================================================= //
//
// ==== 2.1.3 (2010 05/26) ====
//
// * Added word tracking feature.
//
// ==== 2.1.2 (2010 05/23) ====
//
// * Fixed the pop-up bug.
// * Added *sent* DMs to the `DMs'
//
// ==== 2.1.0 (2010 05/23) ====
//
// * Added "unread count" for each `List'
// * Made `List' statuses to be fetched automatically
//
// ==== 2.0.0 (2010 05/23) ====
//
// * Removed `Filter' (Redundant I think)
// * Enhanced `List' support.
// * Made code to be more generalized.
//
// ==== 1.6.4 (2010 03/14) ====
//
// * Added action refresh-or-back-to-timeline.
//
// ==== 1.6.3 (2010 03/14) ====
//
// * Now public method tweet() takes arguments
//
// ==== 1.6.2 (2010 03/03) ====
//
// * Made show-conversations works more speedy.
//
// ==== 1.6.1 (2010 03/03) ====
//
// * Added local action show-conversations.
//
// ==== 1.6.0 (2010 02/28) ====
//
// * Added support for hash tag.
// * Added support for in_reply_to_status_id.
//
// ==== 1.5.9 (2010 02/26) ====
//
// * Added option prefer_screen_name whith allows user to display screen name instead of user name.
//
// ==== 1.5.8 (2010 02/23) ====
//
// * Added option jmp_id and jmp_key which allows user to use their account of j.mp
//
// ==== 1.5.7 (2010 02/20) ====
//
// * Added option tweet_keymap
//
// ==== 1.5.6 (2010 01/31) ====
//
// * Made official ReTweet to be displayed in the timeline (default green color)
//
// ==== 1.5.5 (2010 01/16) ====
//
// * Added popup_new_replies option.
//   This option is only effective when the user set false to popup_new_statuses.
//
// ==== 1.5.4 (2010 01/03) ====
//
// * Set local keymap by default
//
// ==== 1.5.3 (2010 01/02) ====
//
// * Made unpopUppedStatuses global
//
// ==== 1.5.2 (2010 01/02) ====
//
// * Now user can select whether display header or not.
// * Automatically retry when request fails.
// * A lot of context menus are added.
//   Right click on the icon in the statusbar and @foo, http:://* in the message.
//
// ==== 1.5.1 (2010 01/02) ====
//
// * Added fancy mode, gorgeous header. Annoying?
//
// ==== 1.5.0 (2009 12/31) ====
//
// * Refined codes. Cache updater become singleton. Less Twitter API consumption.
//
// ==== 1.4.6 (2009 12/24) ====
//
// * Due to inserted prompt.refresh in add favorite action, the star icon becomed to be applied immediately.
//
// ==== 1.4.5 (2009 12/22) ====
//
// * Added tsubuyaki-senyo settings (tweets only)
//
// ==== 1.4.4 (2009 12/17) ====
//
// * Fixed the problem that the , in the URL does not handled properly.
// * Added mentions count and pretty icons.
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
// * Made all actions use gOAuth.asyncRequest() instead of oauthSyncRequest().
//
// }} ======================================================================= //
