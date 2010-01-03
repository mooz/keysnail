// ChangeLog {{ ============================================================= //
//
// ==== 1.5.3 (2009 01/02) ====
//
// * Made unpopUppedStatuses global
//
// ==== 1.5.2 (2009 01/02) ====
//
// * Now user can select whether display header or not.
// * Automatically retry when request fails.
// * A lot of context menus are added.
//   Right click on the icon in the statusbar and @foo, http:://* in the message.
//
// ==== 1.5.1 (2009 01/02) ====
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
// * Made all actions use oauthASyncRequest() instead of oauthSyncRequest().
//
// }} ======================================================================= //

const Cc = Components.classes;
const Ci = Components.interfaces;

var optionsDefaultValue = {
    "log_level"                             : LOG_LEVEL_MESSAGE,
    "update_interval"                       : 60 * 1000,      // 1 minute
    "mentions_update_interval"              : 60 * 1000 * 20, // 20 minute
    "use_popup_notification"                : true,
    "main_column_width"                     : [11, 70, 19],
    "timeline_count_beginning"              : 80,
    "timeline_count_every_updates"          : 20,
    "unread_status_count_style"             : "color:#383838;font-weight:bold;",
    "automatically_begin"                   : true,
    "keymap"                                : {},
    "block_users"                           : [],
    "black_users"                           : [],
    "enable_header"                         : true,
    // fancy mode settings
    "fancy_mode"                            : true,
    "normal_tweet_style"                    : "color:black;",
    "my_tweet_style"                        : "color:#0a00d5;",
    "reply_to_me_style"                     : "color:#930c00;",
    "selected_row_style"                    : "background-color:#93c6ff; color:black; outline: 1px solid #93c6ff !important;",
    "selected_user_style"                   : "background-color:#ddedff; color:black;",
    "selected_user_reply_to_style"          : "background-color:#ffd4ff; color:black;",
    "selected_user_reply_to_reply_to_style" : "background-color:#ffe9d4; color:black;"
};

function getOption(aName) {
    var fullName = "twitter_client." + aName;
    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

function getBrowserWindows() {
    var windows = [];

    var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);
    var enumerator = wm.getEnumerator("navigator:browser");

    while (enumerator.hasMoreElements())
    {
        windows.push(enumerator.getNext());
    }

    return windows;
}

function notifyWindows(aNotifier, aArg) {
    getBrowserWindows().forEach(function (win) aNotifier(win, aArg));
}

function updateAllStatusbars() {
    notifyWindows(function (win) {
                      try
                      {
                          win.KeySnail.modules.plugins.twitterClient.updateStatusbar();
                      }
                      catch (x) {}
                  });
}

function openLink(url) {
    return 'openUILinkIn("' + url + '", "tab")';
}

// Log {{ =================================================================== //

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

// }} ======================================================================= //

// Persistent object {{ ===================================================== //

var json = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);

function getExtensionDir(aName) {
    if (typeof util.getExtensionLocalDirectory === 'function')
        return util.getExtensionLocalDirectory(aName); // 1.2.9 later
    else
        return util.getExtentionLocalDirectory(aName); // 1.2.8 (typo)
}

function getPersistentObjFile(aName) {
    let dir = getExtensionDir('yatck');
    dir.append(aName.replace(/-/g, "_") + ".json");

    return dir;
}

function saveObj(aName, aObj) {
    let file    = getPersistentObjFile(aName);
    let encoded = json.encode(aObj);

    util.writeTextFile(encoded, file.path, true);
}

function restoreObj(aName) {
    let file = getPersistentObjFile(aName);
    let str;

    try {
        str = util.readTextFile(file.path);
    } catch (x) {
        return null;
    }

    return json.decode(str);
}

// }} ======================================================================= //

function Widget(xml) {
    this.initialize(xml);
}

Widget.prototype = {
    root  : document.documentElement,
    panel : util.xmlToDom(<panel noautohide="true" />),
    child : null,

    initialize: function (xml) {
        this.child = util.xmlToDom(xml);
        this.panel.appendChild(this.child);
        this.root.appendChild(this.panel);
    },

    show: function () {
        let cb = getBrowser().mCurrentBrowser;
        this.panel.openPopup(cb, "overlay",
                             (cb.boxObject.width - this.panel.boxObject.width) / 2,
                             (cb.boxObject.height - this.panel.boxObject.height) / 2,
                             false, true);
    },

    hide: function () {
        this.panel.hidePopup();
    }
};

var twitterClient =
    (function () {
         // ================================================================================ //

         const root = "KeySnail.modules.plugins.twitterClient";

         const linkClass = "ks-text-link";

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

         var twitterStatusesPending;
         var twitterMentionsPending;

         share.twitterImmediatelyAddedStatuses = [];

         var twitterCommonActions = [
             [function (status) {
                  if (status) tweet();
              }, M({ja: "つぶやく : ", en: ""}) + "Tweet",
              "tweet"],
             // ======================================== //
             [function (status) {
                  if (status) reply(status.screen_name, status.id);
              }, M({ja: "このつぶやきに返信 : ", en: ""}) + "Send reply message",
             "reply"],
             // ======================================== //
             [function (status) {
                  if (status) quoteTweet(status.screen_name, html.unEscapeTag(status.text));
              }, M({ja: "このつぶやきを => コメント付き ", en: ""}) + "RT (QT): Quote tweet",
             "retweet"],
             // ======================================== //
             [function (status) {
                  if (status) retweet(status.id);
              }, M({ja: "このつぶやきを => 公式 ", en: ""}) + "RT : Official Retweet",
              "official-retweet"],
             // ======================================== //
             [function (status) {
                  if (status) deleteStatus(status.id);
              }, M({ja: "このつぶやきを => 削除 : ", en: ""}) + "Delete this status",
              "delete-tweet"],
             // ======================================== //
             [function (status) {
                  if (status) addFavorite(status.id, status.favorited);
              }, M({ja: "このつぶやきを => お気に入りへ追加 / 削除 : ", en: ""}) + "Add / Remove this status to favorites",
              "add-to-favorite,c"],
             // ======================================== //
             [function (status) {
                  if (status) gBrowser.loadOneTab("http://twitter.com/" + status.screen_name
                                                  + "/status/" + status.id, null, null, null, false);
              }, M({ja: "このつぶやきを => Twitter で見る : ", en: ""}) + "Show status in web page",
              "view-in-twitter,c"],
             // ======================================== //
             [function (status) {
                  if (status) copy(html.unEscapeTag(status.text));
              }, M({ja: "このつぶやきを => クリップボードにコピー : ", en: ""}) + "Copy selected message",
              "copy-tweet,c"],
             // ======================================== //
             [function (status) {
                  if (status) display.prettyPrint(html.unEscapeTag(status.text), {timeout: 6000, fade: 200});
              }, M({ja: "このつぶやきを => 全文表示 : ", en: ""}) + "Display entire message",
              "display-entire-message,c"],
             // ======================================== //
             [function (status) {
                  if (status) showTargetStatus(status.screen_name);
              }, M({ja: "このユーザのつぶやきを一覧表示 : ", en: ""}) + "Show Target status",
              "show-target-status"],
             // ======================================== //
             [function (status) {
                  if (status) showFavorites(status.user_id);
              }, M({ja: "このユーザのふぁぼり一覧を表示 : ", en: ""}) + "Show this user's favorites",
              "show-user-favorites"],
             // ======================================== //
             [function (status) {
                  if (status) showMentions();
              }, M({ja: "自分の @ を一覧表示 : ", en: ""}) + "Show mentions",
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
                  command.setClipboardText(status.screen_name);
              }, M({ja: "このユーザの id をコピー : ", en: ""}) + "Copy id of the selected user",
              "copy-user-id,c"],
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
                  if (!status) return;
                  showLists(status.screen_name);
              }, M({ja: "このユーザのリストを一覧表示 : ", en: ""}) + "Show selected user's lists",
              "show-selected-users-lists"]
         ];

         // ================================================================================ //


         // Prompt handling {{ ======================================================= //

         let tPrompt = {
             forced  : false,
             get visible() {
                 return !document.getElementById("keysnail-prompt").hidden;
             },
             close   : function () {
                 if (tPrompt.forced)
                 {
                     tPrompt.forced = false;

                     if (tPrompt.visible)
                     {
                         prompt.finish(true);
                     }
                 }
             }
         };

         // }} ======================================================================= //

         if (!share.twitterClientSettings)
         {
             share.twitterClientSettings = {};
             share.twitterClientSettings.blackUsers = restoreObj("blackusers") || [];
         }

         // Update interval in mili second
         var updateInterval = getOption("update_interval");

         // Update interval in mili second
         var mentionsUpdateInterval = getOption("mentions_update_interval");

         // Show popup when timeline is updated
         var popUpStatusWhenUpdated = getOption("use_popup_notification");

         // [User name, Message, Information] in percentage
         var mainColumnWidth = getOption("main_column_width");

         var blockUsers = getOption("block_users");
         var blackUsers = share.twitterClientSettings.blackUsers;

         // ================================================================================ //
         // Timeline
         // ================================================================================ //

         var timelineCountBeginning    = getOption("timeline_count_beginning");
         var timelineCountEveryUpdates = getOption("timeline_count_every_updates");

         function normalizeCount(n) {
             if (n <= 0)
                 n = 20;
             if (n > 200)
                 n = 200;

             return n;
         }

         timelineCountBeginning    = normalizeCount(timelineCountBeginning);
         timelineCountEveryUpdates = normalizeCount(timelineCountEveryUpdates);

         var timelineCount = timelineCountBeginning;

         // ================================================================================ //
         // Unread handler
         // ================================================================================ //

         const LAST_STATUS_KEY  = "extensions.keysnail.plugins.twitter_client.last_status_id";
         const LAST_MENTION_KEY = "extensions.keysnail.plugins.twitter_client.last_mention_id";

         var lastID = {
             get status() {
                 return util.getUnicharPref(LAST_STATUS_KEY);
             },

             set status(val) {
                 util.setUnicharPref(LAST_STATUS_KEY, val);
             },

             get mention() {
                 return util.getUnicharPref(LAST_MENTION_KEY);
             },

             set mention(val) {
                 util.setUnicharPref(LAST_MENTION_KEY, val);
             }
         };

         // ================================================================================ //
         // Statusbar
         // ================================================================================ //

         const statusesIcon = 'data:image/png;base64,' +
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

         const mentionsIcon = 'data:image/png;base64,' +
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

         function setAttributes(aElem, aAttributes)
         {
             if (aAttributes)
             {
                 for (let [key, value] in Iterator(aAttributes))
                 {
                     aElem.setAttribute(key, value);
                 }
             }
         }

         function genElem(aName, aAttributes)
         {
             let elem = document.createElement(aName);
             setAttributes(elem, aAttributes);
             return elem;
         }

         function applyMenu(aMenu, aMenuSeed) {
             function genMenuItem([label, command]) {
                 let item;

                 if (command instanceof Array)
                 {
                     item = genElem("menu", { "label" : label });

                     let popup = genElem("menupopup");
                     command.forEach(function (r) { popup.appendChild(genMenuItem(r)); });
                     item.appendChild(popup);
                 }
                 else if (label && command)
                 {
                     item = genElem("menuitem", { "label" : label, "oncommand" : command });
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

         const CONTAINER_ID      = "keysnail-twitter-client-container";
         const UNREAD_STATUS_ID  = "keysnail-twitter-client-unread-status";
         const UNREAD_MENTION_ID = "keysnail-twitter-client-unread-mention";

         var statusbar           = document.getElementById("status-bar");
         var statusbarPanel      = document.getElementById("keysnail-status");
         var container           = document.getElementById(CONTAINER_ID);
         var unreadStatusLabel   = document.getElementById(UNREAD_STATUS_ID);
         var unreadMentionLabel  = document.getElementById(UNREAD_MENTION_ID);

         var unreadStatusLabelStyle = getOption("unread_status_count_style");

         function insertAfter(parent, node, referenceNode) {
	     parent.insertBefore(node, referenceNode.nextSibling);
         }

         // create statusbar icon
         if (!container)
         {
             // create a new one
             container = genElem("statusbarpanel", { align : "center", id : CONTAINER_ID });
             let box, icon;

             // ================================================== //

             box  = genElem("hbox", { align : "center", flex : 1 });
             icon = genElem("image", { src : statusesIcon });
             unreadStatusLabel = genElem("label", { id : UNREAD_STATUS_ID, flex : 1, value : "-" });
             box.appendChild(icon);
             box.appendChild(unreadStatusLabel);
             container.appendChild(box);

             // ================================================== //

             box = box.cloneNode(true);
             box.childNodes[0].setAttribute("src", mentionsIcon);
             unreadMentionLabel = box.childNodes[1];
             unreadMentionLabel.setAttribute("id", UNREAD_MENTION_ID);

             container.appendChild(box);

             // ================================================== //

             insertAfter(statusbar, container, statusbarPanel);

             // ================================================== //

             let menu = my.twitterClientStatusBarMenu = createMenu(
                 [
                     [M({ja: "お気に入り一覧", en: "Display favorites"}),
                      "KeySnail.modules.ext.exec('twitter-client-show-favorites')"],
                     [M({ja: "自分のステータス一覧", en: "Display my statuses"}),
                      "KeySnail.modules.ext.exec('twitter-client-show-my-statuses')"],
                     [M({ja: "自分のリスト一覧", en: "Display my lists"}),
                      "KeySnail.modules.ext.exec('twitter-client-show-my-lists')"],
                     [M({ja: "再認証", en: "Reauthorize"}),
                      "KeySnail.modules.ext.exec('twitter-client-reauthorize')"]
                 ]
             );

             container.appendChild(menu);
         }

         unreadStatusLabel.setAttribute("style", unreadStatusLabelStyle);
         unreadStatusLabel.parentNode.onclick = function (ev) {
             if (ev.button === 2)
                 my.twitterClientStatusBarMenu.openPopupAtScreen(ev.screenX, ev.screenY, true);
             else
                 self.showTimeline();
         };

         unreadMentionLabel.setAttribute("style", unreadStatusLabelStyle);
         unreadMentionLabel.parentNode.onclick = function (ev) {
             if (ev.button === 2)
                 my.twitterClientStatusBarMenu.openPopupAtScreen(ev.screenX, ev.screenY, true);
             else
                 self.showMentions();
         };

         // Header {{ ================================================================ //

         if (getOption("enable_header") && !my.twitterClientHeader)
         {
             const HOME_ICON = 'data:image/png;base64,' +
                 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAY1BMVEUAAAB7QylRU1AsbCZAcDxR' +
                 'bUuVYDQ+gDhub221by56fHmmdkO4dy5OlUJcj1WwfTi7gTOKioi6hT5XplK3jlrGkU7ElVaanJlw' +
                 'tWOkpqOqrKnSq3ODxHany6HJy8ja2tfu8O0sQw6vAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgA' +
                 'AAAJcEhZcwAACxMAAAsTAQCanBgAAACLSURBVBjTbc/bDoMgEEVRLBXtACJXL2CZ///KjvWhNO15' +
                 'WzsTEhj7v4dSqrWKOcf52zkn1zg6l3IyjWt1IQdxeo50/ESsUgYpPqYiZBAdlWQqvle704wZizgC' +
                 'AKLtrlcpwLJQANaEjcJ42U8HwrZZPLzWxLWsE8K+21pK8Zx5Pdz70dJu/TBw/vPvFwypDHUFCMVW' +
                 'AAAAAElFTkSuQmCC';

             const TWITTER_ICON = 'data:image/png;base64,' +
                 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAG1BMVEUgAAAAgbgRlsghrN4ove9V' +
                 '0vyg2OvX8vz9//ye2HpLAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsT' +
                 'AQCanBgAAABhSURBVAjXY2Dg6GCAgI70Bgij1aUCxsjo6AAJtrikl1d0gBnGxsYZIAaQNvYAMpqN' +
                 'oSLNxkDFIDXNShlgGsiwgGhvUgICkJltQkCGBsguQ0FBQQsgg6M9LS0NrBqoGagYAPOBHbWsz4eA' +
                 'AAAAAElFTkSuQmCC';

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

             const HEAD_CONTAINER_ID  = "keysnail-twitter-client-head-container";
             const HEAD_USER_ICON     = "keysnail-twitter-client-user-icon";
             const HEAD_USER_INFO     = "keysnail-twitter-client-user-info";
             const HEAD_USER_NAME     = "keysnail-twitter-client-user-name";
             const HEAD_USER_TWEET    = "keysnail-twitter-client-user-tweet";

             const HEAD_USER_BUTTON_HOME    = "keysnail-twitter-client-user-button-home";
             const HEAD_USER_BUTTON_TWITTER = "keysnail-twitter-client-user-button-twitter";

             const HEAD_MENU         = "keysnail-twitter-client-header-menu";
             const HEAD_DYNAMIC_MENU = "keysnail-twitter-client-header-dynamic-menu";

             let tooltipTextTwitter = M({ja: "このユーザの Twitter ページへ", en: "Visit this user's page on twitter"});
             let tooltipTextHome    = M({ja: "このユーザのホームページへ", en: "Visit this user's homepage"});
             let tooltipTextReflesh = M({ja: "更新", en: "Refresh"});
             let tooltipTextClose   = M({ja: "閉じる", en: "Close"});

             let containerXML =
                 <vbox style="margin-left  : 4px;
                              margin-right : 4px;">
                     <hbox align="center">
                         <description flex="1" width="100%" style="font-weight:bold;" id={HEAD_USER_NAME} />
                         <spacer flex="1" />
                         <toolbarbutton tooltiptext={tooltipTextReflesh} image={REFRESH_ICON}
                                        oncommand={"KeySnail.modules.prompt.finish(true);" + root + ".showTimeline();"} />
                         <toolbarbutton tooltiptext={tooltipTextClose} class="tab-close-button"
                                        oncommand="KeySnail.modules.prompt.finish(true);" />
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
                                      margin           : 4px;
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

             my.twitterClientHeader = {
                 container     : container,
                 userIcon      : document.getElementById(HEAD_USER_ICON),
                 userInfo      : document.getElementById(HEAD_USER_INFO),
                 userName      : document.getElementById(HEAD_USER_NAME),
                 userTweet     : document.getElementById(HEAD_USER_TWEET),
                 //
                 buttonTwitter : document.getElementById(HEAD_USER_BUTTON_TWITTER),
                 buttonHome    : document.getElementById(HEAD_USER_BUTTON_HOME),
                 //
                 normalMenu    : document.getElementById(HEAD_MENU),
                 dynamicMenu   : document.getElementById(HEAD_DYNAMIC_MENU)
             };

             // set up normal menu
             applyMenu(my.twitterClientHeader.normalMenu,
                       [
                           [M({ja: "コピー", en: "Copy"}), root + ".copyCurrentStatus();"],
                           // ================================================== //
                           [M({ja: "返信", en: "Reply"}), root + ".replyToCurrentStatus();"],
                           // ================================================== //
                           ["Retweet (Quote tweet)", root + ".retweetCurrentStatus();"],
                           // ================================================== //
                           [null, null],
                           // ================================================== //
                           [M({ja: "このユーザの操作", en: "This user"}),
                            [
                                [M({ja: "ステータス一覧", en: "Display this user's statuses"}),
                                 root + ".showCurrentTargetStatus();"],
                                // ================================================== //
                                [M({ja: "リスト一覧", en: "Display this user's lists"}),
                                 root + ".showCurrentTargetLists();"],
                                // ================================================== //
                                [M({ja: "ブラックリストへ追加", en: "Add this user to the black list"}),
                                 root + ".addCurrentTargetToBlacklist();"]
                            ]
                           ]
                       ]);
         }

         function showDynamicMenu(aEvent, aMenuSeed) {
             let menu = createMenu(aMenuSeed);
             menu.setAttribute("id", HEAD_DYNAMIC_MENU);

             my.twitterClientHeader.container
                 .replaceChild(menu, my.twitterClientHeader.dynamicMenu);

             my.twitterClientHeader.dynamicMenu = menu;

             menu.openPopupAtScreen(aEvent.screenX, aEvent.screenY, true);
         }

         function setIconStatus(elem, status) {
             elem.setAttribute("disabled", !status);
             if (status)
                 elem.removeAttribute("style");
             else
                 elem.setAttribute("style", "opacity:0.25;");
         }

         // }} ======================================================================= //

         // ============================== Arrange services ============================== //

         try {
             var alertsService = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
         } catch (x) {
             popUpStatusWhenUpdated = false;
         }

         var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

         // Popup notifications {{ =================================================== //

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
             var status = share.unPopUppedStatuses.pop();

             if ((blockUsers && blockUsers.some(function (username) username == status.user.screen_name))
                 || (share.userInfo && status.user.screen_name == share.userInfo.screen_name))
             {
                 if (share.unPopUppedStatuses && share.unPopUppedStatuses.length)
                 {
                     showOldestUnPopUppedStatus();
                 }

                 return;
             }

             // Codes below are no longer need because cache updater became singleton

             // var browserWindow = wm.getMostRecentWindow("navigator:browser");
             // if (!browserWindow || browserWindow !== window)
             // {
             //     return;
             // }

             function proc() {
                 if (!share.unPopUppedStatuses || !share.unPopUppedStatuses.length)
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
             if (share.unPopUppedStatuses && share.unPopUppedStatuses.length > 0)
                 share.unPopUppedStatuses = statuses.concat(share.unPopUppedStatuses);
             else
                 share.unPopUppedStatuses = statuses;

             showOldestUnPopUppedStatus();
         }

         // }} ======================================================================= //

         // Hook application quit {{ ================================================= //

         // if (!share.twitterClientQuitObserver)
         // {
         //     const topicId = 'quit-application-granted';

         //     function quitObserver() {
         //         this.register();
         //     }

         //     quitObserver.prototype = {
         //         observe: function(subject, topic, data) {

         //             this.unregister();
         //         },

         //         register: function() {
         //             var observerService = Cc["@mozilla.org/observer-service;1"]
         //                 .getService(Ci.nsIObserverService);
         //             observerService.addObserver(this, topicId, false);
         //         },

         //         unregister: function() {
         //             var observerService = Cc["@mozilla.org/observer-service;1"]
         //                 .getService(Ci.nsIObserverService);
         //             observerService.removeObserver(this, topicId);
         //         }
         //     };

         //     share.twitterClientQuitObserver = new quitObserver();
         // }

         // }} ======================================================================= //

         // Utils {{ ================================================================= //

         function isRetryable(xhr) {
             return (xhr.status === 401)
                 && (xhr.responseText.indexOf("Could not authenticate you") !== -1);
         }

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

             if (share.twitterImmediatelyAddedStatuses.length)
             {
                 // remove immediately added statuses
                 var removeCount = aOld.indexOf(share.twitterImmediatelyAddedStatuses[0]) + 1;

                 if (removeCount > 0)
                 {
                     aOld.splice(0, removeCount);
                 }
             }

             share.twitterImmediatelyAddedStatuses = [];

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

         // }} ======================================================================= //

         // OAuth {{ ================================================================= //

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

             var oAuthArgs  = OAuth.getParameterMap(message.parameters);
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
                 // try
                 // {
                 //     let headers = {};

                 //     xhr.getAllResponseHeaders()
                 //         .split(/\r?\n/).forEach(
                 //             function (h) {
                 //                 var pair = h.split(': ');
                 //                 if (pair && pair.length > 1)
                 //                 {
                 //                     headers[pair.shift()] = pair.join('');
                 //                 }
                 //             });

                 //     if ("X-RateLimit-Remaining" in headers)
                 //     {
                 //         util.message("remains => %s / %s",
                 //                      headers["X-RateLimit-Remaining"],
                 //                      headers["X-RateLimit-Limit"]);
                 //     }
                 // }
                 // catch (x) {}

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
             share.twitterStatusesJSONCache = null;
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
                             log(LOG_LEVEL_ERROR, "whale error :: " + xhr.responseText);
                         }
                         else
                         {
                             // unknown error
                             log(LOG_LEVEL_ERROR, "unknown error :: " + xhr.responseText);
                         }
                     }
                 }
             );
         }

         // }} ======================================================================= //

         // Actions {{ =============================================================== //

         function showFavorites(aTargetID) {
             oauthASyncRequest(
                 {
                     action: "http://twitter.com/favorites.json" + (aTargetID ? ("?id=" + aTargetID) : ""),
                     method: "GET"
                 },
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
                     if (xhr.readyState == 4)
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


                         if (xhr.status != 200)
                         {
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

                 oauthASyncRequest(
                     {
                         action: "http://search.twitter.com/search.json?q=" + encodeURIComponent(aWord) + "&rpp=100",
                         method: "POST"
                     },
                     function (aEvent, xhr) {
                         if (xhr.readyState == 4)
                         {
                             if (isRetryable(xhr))
                             {
                                 doSearch(aWord);
                                 return;
                             }

                             if (xhr.status != 200)
                             {
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
                                     actions: twitterCommonActions
                                 });
                         }
                     }
                 );
             }

             prompt.read("search:", doSearch, null, null, null, 0, "twitter_search");
         }

         function copy(aMsg) {
             command.setClipboardText(aMsg);
             display.echoStatusBar(M({ja: "コピーしました", en: "Copied"}) + " : " + aMsg, 2000);
         }

         function reply(aUserID, aStatusID) {
             tweet("@" + aUserID + " ", aStatusID);
         }

         function quoteTweet(aUserID, aMsg) {
             tweet("RT @" + aUserID + ": " + aMsg);
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
                         else if (isRetryable(xhr))
                         {
                             retweet(aID);
                         }
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
                     callback: function postTweet(aTweet) {
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
                                     if (xhr.status === 401 && xhr.responseText.indexOf("expired") != -1)
                                     {
                                         // token expired
                                         reAuthorize();
                                     }
                                     else if (isRetryable(xhr))
                                     {
                                         // retry
                                         log(LOG_LEVEL_DEBUG, "Failed to tweet. Retry");
                                         postTweet(aTweet);
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
                                         share.twitterStatusesJSONCache.unshift(status);
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
             oauthASyncRequest(
                 {
                     action : "http://twitter.com/statuses/destroy/" + aStatusID + ".json",
                     method : "DELETE"
                 },
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
                         for (var i = 0; i < share.twitterStatusesJSONCache.length; ++i)
                         {
                             if (share.twitterStatusesJSONCache[i].id == aStatusID)
                             {
                                 share.twitterStatusesJSONCache.splice(i, 1);
                                 break;
                             }
                         }

                         setLastStatus(share.twitterStatusesJSONCache);

                         display.echoStatusBar(M({ja: 'ステータスが削除されました',
                                                  en: "Status deleted"}), 2000);
                     }
                 });
         }

         function showListStatuses(aScreenName, aListName) {
             oauthASyncRequest(
                 {
                     action : util.format("http://api.twitter.com/1/%s/lists/%s/statuses.json?per_page=%s",
                                          aScreenName, aListName, timelineCountBeginning),
                     host   : "http://api.twitter.com/",
                     method : "GET"
                 },
                 function (aEvent, xhr) {
                     if (xhr.readyState == 4)
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

                         var statuses = util.safeEval("(" + xhr.responseText + ")") || [];
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

             oauthASyncRequest(
                 {
                     action : "http://api.twitter.com/1/" + aScreenName + "/lists.json",
                     host   : "http://api.twitter.com/",
                     method : "GET"
                 },
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

                         let result = util.safeEval("(" + xhr.responseText + ")");

                         let collection = Array.slice((result || {lists:[]}).lists).map(
                             function (list)
                                 [
                                     list.name,
                                     list.description,
                                     list.member_count,
                                     list.subscriber_count
                                 ]
                         );

                         tPrompt.close();

                         prompt.selector(
                             {
                                 message    : "lists:",
                                 collection : collection,
                                 // name, description, member_count, subscriber_count
                                 flags      : [0, 0, 0, 0],
                                 header     : [M({ja: 'リスト名', en: "List name"}),
                                               M({ja: '説明', en: "Description"}),
                                               M({ja: 'フォロー中', en: "Following"}),
                                               M({ja: 'リストをフォロー', en: "Follower"})],
                                 callback   : function (i) {
                                     if (i >= 0)
                                         showListStatuses(aScreenName, collection[i][0]);
                                 }
                             });
                     }
                 });
         }

         function showMentions(aArg) {
             var updateForced = (aArg != null);

             if (updateForced || !share.twitterMentionsJSONCache)
             {
                 if (twitterStatusesPending)
                 {
                     display.echoStatusBar(M({ja: 'Twitter へリクエストを送信しています。しばらくお待ち下さい。',
                                              en: "Requesting to the Twitter ... Please wait."}), 2000);
                 }
                 else
                 {
                     self.updateMentionsCache(
                         function () {
                             callSelector(share.twitterMentionsJSONCache);
                             setLastMention(share.twitterMentionsJSONCache);
                         }, updateForced);
                 }
             }
             else
             {
                 // use cache
                 callSelector(share.twitterMentionsJSONCache);
                 setLastMention(share.twitterMentionsJSONCache);
             }

         }

         function showFollowersStatus(aArg) {
             var updateForced = (aArg != null);

             if (updateForced || !share.twitterStatusesJSONCache)
             {
                 if (twitterStatusesPending)
                 {
                     display.echoStatusBar(M({ja: 'Twitter へリクエストを送信しています。しばらくお待ち下さい。',
                                              en: "Requesting to the Twitter ... Please wait."}), 2000);
                 }
                 else
                 {
                     // rebuild cache
                     self.updateStatusesCache(
                         function () {
                             if (share.twitterStatusesJSONCache)
                             {
                                 callSelector(share.twitterStatusesJSONCache);
                                 setLastStatus(share.twitterStatusesJSONCache);
                             }
                         }, updateForced);
                 }
             }
             else
             {
                 // use cache
                 callSelector(share.twitterStatusesJSONCache);
                 setLastStatus(share.twitterStatusesJSONCache);
             }
         }

         function showTargetStatus(target) {
             oauthASyncRequest(
                 {
                     action : "http://twitter.com/statuses/user_timeline/" + target + ".json?count=" + timelineCountEveryUpdates,
                     method : "GET"
                 },
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

                         var statuses = util.safeEval(xhr.responseText) || [];
                         callSelector(statuses, M({ja: target + " のつぶやき一覧", en: "Tweets from " + target}));
                     }
                 });
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

         function focusContent() {
             getBrowser().focus();
             _content.focus();
         }

         function createMessage(msg) {
             let userNamePattern = /(@[a-zA-Z0-9_]+|((https?\:\/\/|www\.)[^\s]+)([^\w\s\d]*))/g;

             let matched = msg.match(userNamePattern);

             let message = genElem("description", {
                                       style   : "-moz-user-select : text !important;"
                                   });

             if (matched)
             {
                 for (let i = 0; i < matched.length; ++i)
                 {
                     let pos   = msg.indexOf(matched[i]);
                     let left  = msg.slice(0, pos);
                     let right = msg.slice(pos + matched[i].length);

                     let url;
                     let type = matched[i][0] === '@' ? "user" : "url";

                     if (type === "user")
                     {
                         url = "http:twitter.com/" + matched[i].slice(1);
                     }
                     else
                     {
                         url = matched[i];
                         if (url.indexOf("www") === 0)
                             url = "http://" + url;
                     }

                     message.appendChild(document.createTextNode(left));
                     message.appendChild(genElem("description", {"class"       : linkClass,
                                                                 "tooltiptext" : url,
                                                                 "value"       : matched[i]}));

                     msg = right;
                 }

                 if (msg.length)
                     message.appendChild(document.createTextNode(msg));
             }
             else
             {
                 message.appendChild(document.createTextNode(msg));
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

             if (!aMessage) aMessage = M({ja: "タイムライン", en: "Timeline"});

             let currentID               = statuses[0].id;
             let selectedUserID          = statuses[0].user.screen_name;
             let selectedUserInReplyToID = statuses[0].in_reply_to_screen_name;

             let header = my.twitterClientHeader;
             let headerEnabled = getOption("enable_header");

             tPrompt.close();

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
                     width      : mainColumnWidth,
                     beforeSelection : function (arg) {
                         let status = arg.row[0];

                         // accessible from out of this closure
                         my.twitterSelectedStatus = status;

                         selectedUserID          = status.user.screen_name;
                         currentID               = status.id;
                         selectedUserInReplyToID = status.in_reply_to_screen_name;

                         if (headerEnabled)
                         {

                             header.userIcon.setAttribute("src", arg.row[1]);
                             header.userIcon.setAttribute("tooltiptext", status.user.description);
                             header.userName.setAttribute("value", status.user.screen_name + " / " + status.user.name);
                             header.userName.setAttribute("tooltiptext", status.user.description);

                             setIconStatus(header.buttonHome, !!status.user.url);
                             if (status.user.url)
                                 header.buttonHome.setAttribute("onclick", openLink(status.user.url));
                             else
                                 header.buttonHome.removeAttribute("onclick");

                             header.buttonTwitter.setAttribute("onclick", openLink('http://twitter.com/' + status.user.screen_name));

                             header.userTweet.replaceChild(createMessage(html.unEscapeTag(status.text)), header.userTweet.firstChild);
                         }
                     },
                     onFinish : onFinish,
                     stylist  : getOption("fancy_mode") ?
                         function (row, n, current) {
                             if (current !== collection)
                             {
                                 // nothing to do in action mode
                                 return null;
                             }

                             let status = row[0];

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
                                 {
                                     // selected row
                                     style += getOption("selected_row_style");
                                 }
                                 else
                                 {
                                     style += getOption("selected_user_style");
                                 }
                             }
                             else if (status.user.screen_name === selectedUserInReplyToID)
                             {
                                 style += getOption("selected_user_reply_to_style");
                             }
                             else if (status.user.in_reply_to_screen_name === selectedUserInReplyToID)
                             {
                                 style += getOption("selected_user_reply_to_reply_to_style");
                             }

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
                                  favorited   : status.favorited
                              }];
                     },
                     keymap  : getOption("keymap"),
                     actions : twitterCommonActions
                 });
         }

         function modifyCache(aId, proc) {
             for each (var status in share.twitterStatusesJSONCache)
             {
                 if (status.id === aId)
                 {
                     proc(status);
                 }
             }
         }

         function setLastStatus(aStatuses) {
             if (aStatuses.length)
             {
                 lastID.status = aStatuses[0].id;
                 updateAllStatusbars();
             }
         }

         function setLastMention(aStatuses) {
             if (aStatuses.length)
             {
                 lastID.mention = aStatuses[0].id;
                 updateAllStatusbars();
             }
         }

         function getStatusPos(aJSON, aID) {
             if (!aID)
                 return aJSON.length;

             for (var i = 0; i < aJSON.length; ++i)
             {
                 if (aJSON[i].id == aID)
                     return i;
             }

             return aJSON.length;
         }

         function setUserInfo() {
             oauthASyncRequest(
                 {
                     action: "http://twitter.com/account/verify_credentials.json",
                     method: "GET"
                 },
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

                         var account = util.safeEval('(' + xhr.responseText + ')');

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
                 let isLink = elem.getAttribute("class") === linkClass;
                 let status = my.twitterSelectedStatus;

                 if (aEvent.button === 2)
                 {
                     // right click
                     if (isLink)
                     {
                         if (text[0] == '@')
                         {
                             let userName = text.slice(1);
                             showDynamicMenu(aEvent,
                                             [
                                                 [util.format(M({ja: "%s のステータスを一覧表示", en: "Display %s's status"}), userName),
                                                  root + util.format(".showTargetStatus('%s');", userName)],
                                                 [util.format(M({ja: "%s の Twitter ホームへ", en: "%s in twitter"}), userName),
                                                  openLink("http://twitter.com/" + userName)]
                                             ]);
                         }
                         else
                         {
                             let url = text;
                             let actions = [
                                 [M({ja: "開く", en: "Open URL"}), openLink(url)],
                                 [M({ja: "URL をコピー",
                                     en: "Copy URL"}),
                                  'KeySnail.modules.command.setClipboardText("' + url + '")']
                             ];

                             if (url.match("^http://(j\\.mp|bit\\.ly)/"))
                             {
                                 actions.push([M({ja: "この URL が何回クリックされたか調査", en: "Inspect this link"}),
                                               openLink(url + "+")]);
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
                 tPrompt.forced = true;
                 showTargetStatus(aUserID);
             },

             replyToCurrentStatus: function () {
                 let status = my.twitterSelectedStatus;
                 if (status)
                 {
                     tPrompt.forced = true;
                     reply(status.user.screen_name, status.id);
                 }
             },

             retweetCurrentStatus: function () {
                 let status = my.twitterSelectedStatus;
                 if (status)
                 {
                     tPrompt.forced = true;
                     quoteTweet(status.user.screen_name, html.unEscapeTag(status.text));
                 }
             },

             showCurrentTargetStatus: function () {
                 let status = my.twitterSelectedStatus;
                 if (status)
                 {
                     tPrompt.forced = true;
                     showTargetStatus(status.user.screen_name);
                 }
             },

             showCurrentTargetLists: function () {
                 let status = my.twitterSelectedStatus;
                 if (status)
                 {
                     tPrompt.forced = true;
                     showLists(status.user.screen_name);
                 }
             },

             addCurrentTargetToBlacklist: function () {
                 let status = my.twitterSelectedStatus;
                 if (status)
                 {
                     let id = status.user.screen_name;

                     for (let [, user] in Iterator(blackUsers))
                     {
                         if (user === id)
                         {
                             log(LOG_LEVEL_DEBUG, "%s is already in the black list");
                             return;
                         }
                     }

                     blackUsers.push(id);

                     let msg = util.format("added %s to the black list", id);

                     log(LOG_LEVEL_DEBUG, msg);
                     display.echoStatusBar(msg);

                     saveObj("blackusers", blackUsers);
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

             updateStatusesCache: function (aAfterWork, aNoRepeat, aCalledFromTimer) {
                 twitterStatusesPending = true;

                 oauthASyncRequest(
                     {
                         action : "http://twitter.com/statuses/friends_timeline.json?count=" + timelineCount,
                         method : "GET"
                     },
                     function (aEvent, xhr) {
                         if (xhr.readyState === 4)
                         {
                             twitterStatusesPending = false;

                             if (xhr.status !== 200)
                             {
                                 if (isRetryable(xhr))
                                 {
                                     log(LOG_LEVEL_DEBUG, "updateStatusesCache: retry %s", new Date());
                                     self.updateStatusesCache(aAfterWork, aNoRepeat, aCalledFromTimer);
                                     return;
                                 }

                                 display.echoStatusBar(M({ja: 'ステータスの取得に失敗しました。',
                                                          en: "Failed to get statuses"}), 2000);
                             }
                             else
                             {
                                 var statuses = util.safeEval(xhr.responseText) || [];
                                 share.twitterStatusesJSONCache = combineJSONCache(statuses, share.twitterStatusesJSONCache);
                                 timelineCount = timelineCountEveryUpdates;
                                 updateAllStatusbars();
                             }

                             log(LOG_LEVEL_DEBUG, "[%s] (%s) update status cache from '%s' %s",
                                 xhr.status, !!aCalledFromTimer, window.document.title, new Date());

                             if ((!aNoRepeat && !share.twitterStatusesCacheUpdater) || aCalledFromTimer)
                             {
                                 share.twitterStatusesCacheUpdater = setTimeout(
                                     function () {
                                         self.updateStatusesCache(null, false, true);
                                     }, updateInterval);

                                 if (!my.twitterDelegateStatusesUpdater)
                                 {
                                     my.twitterDelegateStatusesUpdater =
                                         window.addEventListener(
                                             "unload", function () {
                                                 share.twitterStatusesCacheUpdater = null;

                                                 for (let [, win] in Iterator(getBrowserWindows()))
                                                 {
                                                     try
                                                     {
                                                         log(LOG_LEVEL_DEBUG, "delegated to %s", win.document.title);

                                                         if (win !== window &&
                                                             win.KeySnail   &&
                                                             win.KeySnail.modules.plugins.twitterClient)
                                                         {
                                                             win.KeySnail.modules.plugins.twitterClient.updateStatusesCache();
                                                             break;
                                                         }
                                                     }
                                                     catch (x)
                                                     {
                                                         log(LOG_LEVEL_WARNING, x);
                                                     }
                                                 }
                                             }, false);
                                 }
                             }

                             if (typeof aAfterWork === "function")
                                 aAfterWork();
                         }
                     });
             },

             updateMentionsCache: function (aAfterWork, aNoRepeat, aCalledFromTimer) {
                 twitterMentionsPending = true;

                 oauthASyncRequest(
                     {
                         action: "http://twitter.com/statuses/mentions.json",
                         method: "GET"
                     },
                     function (aEvent, xhr) {
                         if (xhr.readyState === 4)
                         {
                             twitterMentionsPending = false;

                             if (xhr.status != 200)
                             {
                                 if (isRetryable(xhr))
                                 {
                                     log(LOG_LEVEL_DEBUG, "updateMentionsCache: retry %s", new Date());
                                     self.updateMentionsCache(aAfterWork, aNoRepeat, aCalledFromTimer);
                                     return;
                                 }
                                 display.echoStatusBar(M({en: "Failed to get mentions", ja: "言及一覧の取得に失敗しました"}));
                             }
                             else
                             {
                                 var statuses = util.safeEval(xhr.responseText);
                                 share.twitterMentionsJSONCache = combineJSONCache(statuses, share.twitterMentionsJSONCache);
                                 updateAllStatusbars();
                             }

                             if ((!aNoRepeat && !share.twitterMentionsCacheUpdater) || aCalledFromTimer)
                             {
                                 share.twitterMentionsCacheUpdater = setTimeout(
                                     function () {
                                         self.updateMentionsCache(null, false, true);
                                     }, mentionsUpdateInterval);

                                 if (!my.twitterDelegateMentionsUpdater)
                                 {
                                     my.twitterDelegateMentionsUpdater =
                                         window.addEventListener(
                                             "unload",
                                             function () {
                                                 share.twitterMentionsCacheUpdater = null;

                                                 for (let [, win] in Iterator(getBrowserWindows()))
                                                 {
                                                     try
                                                     {
                                                         if (win !== window &&
                                                             win.KeySnail   &&
                                                             win.KeySnail.modules.plugins.twitterClient)
                                                         {
                                                             win.KeySnail.modules.plugins.twitterClient.updateMentionsCache();
                                                             break;
                                                         }
                                                     }
                                                     catch (x)
                                                     {
                                                         log(LOG_LEVEL_WARNING, x);
                                                     }
                                                 }
                                             }, false);
                                 }
                             }

                             if (typeof aAfterWork === "function")
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

             showUsersTimeline: function (ev, arg) {
                 let count = arg || timelineCountBeginning;
                 if (count < 0)
                     count = timelineCountBeginning;

                 oauthASyncRequest(
                     {
                         action: "http://twitter.com/statuses/user_timeline.json?count=" + Math.min(count, 200),
                         method: "GET"
                     },
                     function (aEvent, xhr) {
                         if (xhr.readyState == 4)
                         {
                             if (xhr.status != 200)
                             {
                                 display.echoStatusBar(M({en: "Failed to get your statuses", ja: "ステータスの取得に失敗しました"}));
                                 return;
                             }

                             var statuses = util.safeEval('(' + xhr.responseText + ')');
                             callSelector(statuses);
                         }
                     });
             },

             updateStatusbar: function () {
                 // calc unread statuses count
                 if (share.twitterStatusesJSONCache)
                 {
                     let unreadStatusCount = getStatusPos(share.twitterStatusesJSONCache, lastID.status);
                     unreadStatusLabel.setAttribute("value", unreadStatusCount);
                     unreadStatusLabel.parentNode.setAttribute("tooltiptext",
                                                               unreadStatusCount + M({ja: " 個の未読ステータスがあります", en: " unread statuses"}));

                     log(1000, "statusbar count updated (statuses)");
                 }

                 if (share.twitterMentionsJSONCache)
                 {
                     let unreadMentionCount = getStatusPos(share.twitterMentionsJSONCache, lastID.mention);
                     unreadMentionLabel.setAttribute("value", unreadMentionCount);
                     unreadMentionLabel.parentNode.setAttribute("tooltiptext",
                                                                unreadMentionCount + M({ja: " 個のあなた宛メッセージがあります", en: " unread mentions"}));

                     log(1000, "statusbar count updated (mentinos)");
                 }
             },

             setUserInfo: setUserInfo
         };

         return self;
     })();

plugins.twitterClient = twitterClient;

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

ext.add("twitter-client-toggle-popup-status", twitterClient.togglePopupStatus,
        M({ja: 'ポップアップ通知の切り替え',
           en: "Toggle popup status"}));

ext.add("twitter-client-reauthorize", twitterClient.reAuthorize,
        M({ja: '再認証',
           en: "Reauthorize"}));

// }} ======================================================================= //

if (!share.userInfo)
{
    twitterClient.setUserInfo();
}

if (share.twitterStatusesJSONCache && share.twitterMentionsJSONCache)
{
    log(LOG_LEVEL_DEBUG, "cache updaters are already arranged");
    twitterClient.updateStatusbar();
}
else
{
    if (getOption("automatically_begin"))
    {
        if (!share.twitterStatusesJSONCache)
            twitterClient.updateStatusesCache();

        if (!share.twitterMentionsJSONCache)
            twitterClient.updateMentionsCache();
    }
}

// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Yet Another Twitter Client KeySnail</name>
    <description>Make KeySnail behave like Twitter client</description>
    <description lang="ja">KeySnail を Twitter クライアントに</description>
    <version>1.5.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/yet-another-twitter-client-keysnail.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/yet-another-twitter-client-keysnail.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.8</minVersion>
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
            <description lang="ja">プラグインロード時、自動的にステータスの取得を開始するかどうか (初回起動時間の短縮につながる)</description>
        </option>
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
plugins.options["twitter_client.use_popup_notification"]       = false;
plugins.options["twitter_client.automatically_begin"]          = false;
plugins.options["twitter_client.timeline_count_beginning"]     = 0;
plugins.options["twitter_client.timeline_count_every_updates"] = 0;
||<
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== 起動 ====

ステータスバーの吹き出しアイコンを左クリックすることで Twitter の TL を表示させることができます。

これは M-x などのキーから ext.select() を呼び出し twitter-client-display-timeline を選ぶのと同じことです。

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

このままではアルファベットが入力できないので、もし絞り込み健作などでアルファベットを入力したくなった場合は C-z を入力するか 「閉じる」 ボタン左の 「地球マーク」 をクリックし、編集モードへと切り替えてください。

==== ヘッダ ====

TL 上部の 「ヘッダ」 部分には、選択中ユーザのアイコンやメッセージなどが表示されます。ユーザ名やアイコンの上へマウスカーソルを持っていくことで、そのユーザの自己紹介を見ることが可能です。

また、メッセージ中に @username といった表記や http:// といった URL があった場合は自動的にリンクが貼られます。

このリンクをそのまま左クリックするとそのページへジャンプします。また、右クリックにより様々な処理を選ぶことも可能となっています。

例えば j.mp や bit.ly のリンク上で右クリックをすれば、その URL が何回クリックされたかを調査することができます。自分の紹介した URL が全然クリックされていなくても、気にしないようにしましょう。

ヘッダ右上の 「更新」 ボタンと 「閉じる」 ボタンは見落とされがちですが、有事の際には必ず役に立ってくれることでしょう。

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

twitter_client.use_popup_notification オプションが true に設定されていれば、新しいつぶやきが届いた際にポップアップで通知が行われるようになります。

また、クライアント実行中にもアクションからこの値を切り替えることが可能です。

=== つぶやき専用 ===

つぶやき専用で TL の表示はしない、自動更新とかもいらないよ、という方向けの設定を以下に示します。

>||
style.register("#keysnail-twitter-client-container{ display:none !important; }");
plugins.options["twitter_client.use_popup_notification"]       = false;
plugins.options["twitter_client.automatically_begin"]          = false;
plugins.options["twitter_client.timeline_count_beginning"]     = 0;
plugins.options["twitter_client.timeline_count_every_updates"] = 0;
||<

この設定は http://10sr.posterous.com/tltweetkeysnail-yatwitterclient を参考にさせていただいたものです。
]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //
