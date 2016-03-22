// PLUGIN INFO: {{{
var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Hatebnail</name>
    <description>Use Hatena bookmark extension from KeySnail!</description>
    <description lang="ja">はてなブックマーク拡張を KeySnail から使おう！</description>
    <version>1.3.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/hateb-keysnail-collabo.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/hateb-keysnail-collabo.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.5.6</minVersion>
    <include>main</include>
    <options>
        <option>
            <name>hatebnail.list_bookmarks_limit</name>
            <type>integer</type>
            <description>Limit count of bookmark items to be displayed (Default: 5000)</description>
            <description lang="ja">表示するブックマークの上限数 (デフォルト値: 5000)</description>
        </option>
        <option>
            <name>hatebnail.show_bookmark_key</name>
            <type>string</type>
            <description>Key bound to `Show comments of a link` in the HoK extended hint mode (Default: none)</description>
            <description lang="ja">HoK 拡張ヒントモードにおいて `リンク先のコメントを見る` へ割り当てるキー (デフォルト: 無し)</description>
        </option>
    </options>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
このプラグインをインストールすることにより
- list-hateb-comments
- list-hateb-items
- hateb-bookmark-this-page
といったエクステが追加されます。

M-x など (ext.select を呼び出すキー) を入力することにより、これらのコマンドを実行することができます。

また .keysnail.js 内に次のような設定を記述することにより、特定のキーへコマンドを割り当てておくことも可能です。

>|javascript|
key.setGlobalKey(["C-x", ";"], function (ev, arg) {
    ext.exec("list-hateb-items", arg);
}, "はてなブックマークのアイテムを一覧表示", true);

key.setViewKey("c", function (ev, arg) {
    ext.exec("list-hateb-comments", arg);
}, "はてなブックマークのコメントを一覧表示", true);

key.setViewKey('a', function (ev, arg) {
    ext.exec("hateb-bookmark-this-page");
}, 'このページをはてなブックマークに追加', true);
||<

上記のような設定により C-M-c で「現在閲覧しているページのはてなブックマークのコメント一覧」を、 C-x ; により「自分のはてなブックマーク一覧」を、それぞれ表示することが可能となります。

a を入力することで現在閲覧中のページをブックマークすることもできます。このとき、まずはじめにタグを入力するよう求められますので、補完機能等を使いながら適当なタグを入力してください。

タグを入力し終わり Enter を押すと、次のタグ入力へと移ります。タグ入力を終了させコメント入力へ進む場合は、タグ入力欄へ何も入力せずにそのまま Enter を押してください。
]]></detail>
</KeySnailPlugin>;
// }}}

// ChangeLog : {{{
//
// ==== 1.2.5 (2010 04/23) ====
//
// * Automatically log in when user haven't logged in to Hatena.
//
// ==== 1.2.4 (2010 02/15) ====
//
// * Lower compatibility
//
// ==== 1.2.3 (2010 02/08) ====
//
// * Made title in the popup message be equal to the of actual bookmarked page.
//
// ==== 1.2.0 (2010 01/23) ====
//
// * Added hateb-bookmark-this-page command
//
// ==== 1.2.0 (2009 12/20) ====
//
// * Supported , in the URL.
//
// ==== 1.1.9 (2009 12/05) ====
//
// * Supported % in the URL.
//
// ==== 1.1.8 (2009 11/23) ====
//
// * Added action "Open URL in the comment".
//
// ==== 1.1.7 (2009 11/15) ====
//
// * Added some useful actions.
//
// ==== 1.1.6 (2009 11/04) ====
//
// * Added option "hatebnail.list_bookmarks_limit".
//
// ==== 1.1.5 (2009 11/02) ====
//
// * Made "No bookmarks found" message displayed correctly.
//
// }}}

var hblist;

plugins.withProvides(function (provide) {
    provide("list-hateb-comments", listHBComments, M({
        ja: 'このページのはてなブックマークコメントを一覧表示',
        en: 'List hatena bookmark comments of this page'
    }));

    provide("list-hateb-items" , listHBItems, M({
        ja: "はてなブックマークのアイテムを一覧表示しジャンプ",
        en: 'List all hatena bookmark entries in prompt.selector'
    }));

    provide("hateb-bookmark-this-page", function (ev, arg) {
        addBookMark({
            postTwitter: arg
        });
    }, M({
        ja: "このページをはてなブックマークに追加",
        en: 'Add this page to the hatena bookmark'
    }));

    provide("hateb-bookmark-this-page-private", function (ev, arg) {
        addBookMark({
            postTwitter: arg,
            isPrivate: true
        });
    }, M({
        ja: "このページをはてなブックマークに追加（非公開）",
        en: 'Add this page to the hatena bookmark (private)'
    }));

    provide("hatebnail-login", loginWithPrompt, M({
        ja: "ユーザ名を入力してはてなにログイン",
        en: 'Login to Hatena by inputting user name'
    }));

    provide("hatebnail-logout", logout, M({
        ja: "はてなからログアウト",
        en: 'Log out from Hatena'
    }));
}, PLUGIN_INFO);

function doLogin(username, password, next) {
    display.echoStatusBar(M({
        ja: "ログアウト中です…",
        en: "Logout..."
    }));

    function afterLogout() {
        display.echoStatusBar(M({
            ja: "ログアウトしました",
            en: "Logged out"
        }));

        util.httpPost("https://www.hatena.ne.jp/login", {
            "name"     : username,
            "password" : password
        }, function () {
            display.echoStatusBar(M({
                ja: "ログインしました",
                en: "Logged in"
            }));

            while (!isLoggedIn())
                util.sleep(100);

            if (typeof next === "function")
                next();
        });
    }

    if (isLoggedIn())
        logout(afterLogout);
    else
        afterLogout();
}

function loginWithPrompt(next) {
    prompt.read("user: ", function (user) {
        if (!user) return;

        prompt.read("password: ", function (pass) {
            if (!pass) return;

            doLogin(user, pass, next);
        });
    });
}

function login(args) {
    let callback = args.callee;

    let pm = Cc['@mozilla.org/login-manager;1'].getService(Ci.nsILoginManager);
    let logins;
    ["http://www.hatena.ne.jp", "https://www.hatena.ne.jp"].some(
        function (url) logins = pm.findLogins({}, "https://www.hatena.ne.jp", "https://www.hatena.ne.jp", null)
    );

    if (logins && logins.length)
        doLogin(logins[0].username, logins[0].password);
    else
        loginWithPrompt(function () {
            callback.apply(this, args);
        });
}

function logout(callback) {
    util.httpPost("https://www.hatena.ne.jp/logout", {}, callback);
}

function isLoggedIn() !!hBookmark.User.user;

function addBookMark(options) {
    options = options || {};

    if (KeySnail.windowType !== "navigator:browser" || !("hBookmark" in window))
        return;

    if (!isLoggedIn()) {
        login(arguments);
        return;
    }

    const limit = 100;

    let tags         = hBookmark.model('Tag').findDistinctTags();
    let filteredTags = [for (tag of tags) tag.name];

    let currentMsg;

    function remainTextLengthWatcher(arg) {
        let current = arg.textbox.value;
        let tags    = current.match(/(?:\[.*\])*/)[0]; // always match
        let count   = limit - (current.length - tags.length);
        let msg     = M({ja: ("残り " + count + " 文字"), en: count});

        if (count < 0)
            msg = M({ja: ((-count) + " 文字オーバー"), en: (-count + " characters overed")});

        display.echoStatusBar(msg);
    }

    function uniq(array) {
        return array.reduce(
            function (accum, current) {
                if (accum.every(function (done) current !== done))
                    accum.push(current);
                return accum;
            }, []);
    }

    function tagsToMsg(tag) {
        return uniq(tag.split(" ").filter(function (s) !!s)).map(function (t) "[" + t + "]").join("");
    }

    function inputTag() {
        prompt.reader(
            {
                message    : "tag: ",
                completer  : completer.matcher.migemo(filteredTags),
                callback   : function (tag) {
                    inputPost(tagsToMsg(tag));
                }
            }
        );
    }

    let url   = content.location.href;
    let title = content.document.title;

    function inputPost(aInit) {
        aInit = aInit || "";

        let message = util.format("add %sbookmark%s:",
                                  options.isPrivate ? "*PRIVATE* " : "",
                                  options.postTwitter ? " (+ tweet)" : "");

        prompt.reader({
            message      : message,
            onChange     : remainTextLengthWatcher,
            initialInput : aInit,
            initialinput : aInit,
            cursorEnd    : aInit.length,
            callback     : function post(aMsg) {
                let bookmark = {
                    url     : url,
                    comment : aMsg
                };

                let command = new hBookmark.RemoteCommand("edit", {
                    bookmark: bookmark,
                    sendMail: options.sendMail,
                    isPrivate: options.isPrivate,
                    postFacebook: options.postFacebook,
                    postEvernote: options.postEvernote,
                    postTwitter: options.postTwitter,
                    postMixiCheck: options.postMixiCheck,
                    onComplete: function () {
                        hBookmark.HTTPCache.entry.clear(bookmark.url);
                        display.showPopup(M({ja: "ブックマークに追加しました", en: "Bookmarked"}), title, {
                            icon: PLUGIN_INFO.iconURL
                        });
                    },
                    onError: function () {
                        display.echoStatusBar(M({ja: "はてなブックマークの追加に失敗しました",
                                                 en: "Failed to add hatena bookmark"}), 3000);
                    }
                });

                command.execute();
            }
        });
    }

    inputTag();
}

function showCommentOfPage(aPageURL, aArg) {
    if (KeySnail.windowType != "navigator:browser" || !("hBookmark" in window))
        return;

    if (!isLoggedIn())
    {
        login(arguments);
        return;
    }

    const HB_USER_ICON = 0;
    const HB_USER_NAME = 1;
    const HB_TAGS      = 2;
    const HB_COMMENT   = 3;
    const HB_DATE      = 4;

    const B_URL = 'http://b.hatena.ne.jp/';

    function iconGetter([icon, name, tags, comment, date]) {
        return 'http://www.hatena.ne.jp/users/' +
            name.substring(0, 2) + '/' + name
            + '/profile_s.gif';
    }

    hBookmark.HTTPCache.comment.async_get(
        aPageURL,
        function (data) {
            if (!data || !data.title)
            {
                display.echoStatusBar(M({ja: 'ブックマークが見つかりませんでした',
                                         en: "No bookmarks found"}), 2000);
                return;
            }

            var collection = [];
            var bookmarks = data.bookmarks;

            for (var i = 0; i < bookmarks.length; ++i)
            {
                var bookmark = bookmarks[i];

                if (!bookmark.comment && (aArg == null))
                    continue;

                collection.push([iconGetter, bookmark.user, bookmark.tags.toString(), bookmark.comment, bookmark.timestamp]);
            }

            if (!collection.length)
            {
                display.echoStatusBar(M({ja: ((aArg == null) ? 'コメント付きの' : '') + 'ブックマークが見つかりませんでした',
                                         en: "No bookmarks found"}), 2000);
                return;
            }

            function getPermaLink(aRow) {
                var userLink = B_URL + aRow[HB_USER_NAME] + '/';
                var ymd = aRow[HB_DATE].split(' ')[0];
                return userLink + ymd.replace(/\//g, '') + '#bookmark-' +  bookmarks.eid;
            }

            prompt.selector(
                {
                    message    : "pattern:",
                    collection : collection,
                    flags      : [ICON | IGNORE, 0, 0, 0, 0],
                    style      : [null, style.prompt.description, style.prompt.description, style.prompt.description],
                    header     : ["User", "Tags", "Comment", "Date"],
                    width      : [15, 25, 45, 15],
                    actions    : [
                        [function (aIndex) {
                             if (aIndex >= 0) {
                                 var url = getPermaLink(collection[aIndex]);
                                 openUILinkIn(url, "tab");
                             }
                         },
                         M({ja: '選択中ユーザのブックマークコメントページを新しいタブで開く',
                            en: "Open User Comment Page in new tab"}),
                         "open-user-comment-page"],
                        [function (aIndex) {
                             if (aIndex >= 0) {
                                 command.setClipboardText(collection[aIndex][HB_COMMENT]);
                             }
                         },
                         M({ja: 'コメントをクリップボードにコピー',
                            en: "Copy selected comment"}),
                         "copy-comment,c"],
                        [function (aIndex) {
                             if (aIndex >= 0) {
                                 display.prettyPrint(collection[aIndex][HB_COMMENT], {timeout: 6000, fade: 300});
                             }
                         },
                         M({ja: 'コメントを全文表示',
                            en: "Display entire comment"}),
                         "display-whole-comment,c"],
                        [function (aIndex) {
                             var matched;
                             var comment = collection[aIndex][HB_COMMENT];

                             while ((matched = comment.match("(h?t?tps?|ftp)(://[a-zA-Z0-9/?;#_*,.:/=&%\\-]+)")))
                             {
                                 var prefix = (matched[1] == "ftp") ? "ftp" : "http";
                                 if (matched[1][matched[1].length - 1] == 's')
                                     prefix += "s";

                                 gBrowser.loadOneTab(prefix + matched[2], null, null, null, false);

                                 comment.text = comment.text.slice(comment.text.indexOf(matched[2]) + matched[2].length);
                             }
                         },
                         M({ja: 'コメント中の URL を開く',
                            en: 'Open URL in the comment'}),
                         "open-url-in-comment,c"]
                    ]
                }
            );
        });
};

function listHBComments(aEvent, aArg) {
    showCommentOfPage(content.location.href, aArg);
};

function listHBItems(aEvent, aArg) {
    if (KeySnail.windowType != "navigator:browser" || !("hBookmark" in window))
        return;

    if (!isLoggedIn())
    {
        login(arguments);
        return;
    }

    var limit = plugins.options["hatebnail.list_bookmarks_limit"] || 5000;

    const HB_ICON    = 0;
    const HB_TITLE   = 1;
    const HB_COMMENT = 2;
    const HB_URL     = 3;
    const HB_DATE    = 4;
    const HB_SEARCH  = 5;

    function iconGetter(aRow) {
        return aRow[HB_ICON] = util.getFaviconPath(aRow[HB_URL]);
    }

    function getDate(aString) {
        return L(aString.slice(0, 4) + " 年 " + aString.slice(4, 6) + " 月 " + aString.slice(6, 8)
                 + " 日 " + aString.slice(8, 10) + ":" + aString.slice(10, 12));
    }

    function getURL(aIndex) {
        return hblist[aIndex][HB_URL];
    }

    // by adding prefix arugment to force rebuild the cache
    if (!hblist || aArg != null)
    {
        var db = hBookmark.User.user.database.connection;
        var stmt = db.createStatement(["SELECT b.title, b.comment, b.url, b.date, b.search",
                                       "FROM bookmarks b",
                                       "ORDER BY b.date DESC"].join(" "));
        var count = 0;
        var bookmarks = [];

        while (stmt.executeStep() && count++ < limit)
        {
            // icon, title, comment, url, date, search,
            bookmarks.push([iconGetter, stmt.getString(0), stmt.getString(1),
                            stmt.getString(2), getDate(stmt.getString(3)), stmt.getString(4)]);
        }

        hblist = bookmarks;
    }

    prompt.selector(
        {
            message    : "pattern:",
            collection : hblist,
            flags      : [ICON | IGNORE, IGNORE, IGNORE, HIDDEN | IGNORE, IGNORE, HIDDEN],
            style      : [null, style.prompt.description, style.prompt.description],
            header     : ["Title", "Comment", "Date"],
            width      : [40, 45, 15],
            actions    : [
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "tab");
                     }
                 }, M({en: "Open Link in new tab (foreground)", ja: "新しいタブで開く (前面)"})],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "tabshifted");
                     }
                 }, M({en: "Open Link in new tab (background)", ja: "新しいタブで開く (背面)"})],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "window");
                     }
                 }, M({en: "Open Link in new window", ja: "新しいウィンドウで開く (背面)"})],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "current");
                     }
                 }, M({en: "Open Link in current tab", ja: "現在のタブで開く"})],
                [function (aIndex) {
                     if (aIndex >= 0)
                         hBookmark.AddPanelManager.showPanel(getURL(aIndex));
                 }, M({en: "Edit bookmars entry", ja: "選択中のブックマークエントリを編集"})],
               [function (aIndex) {
                     if (aIndex >= 0) {
                         var url = getURL(aIndex);
                         showCommentOfPage(url);
                     }
                 }, M({en: "Show comments of the selected item's page", ja: "選択中のブックマークエントリについたコメントを見る"})],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         var url = getURL(aIndex);
                         var match = url.match("(ftp|https?)://(.*)");
                         if (match) {
                             openUILinkIn("http://b.hatena.ne.jp/entry/" + match[2], "tab");
                         }
                     }
                 }, M({en: "Show hatena bookmark page of selected item", ja: "選択中アイテムのブックマークエントリページへ"})]
            ]
        }
    );
};

hook.addToHook('PluginLoaded', function () {
    if (!plugins.hok || !plugins.options["hatebnail.show_bookmark_key"])
        return;

    var actions = [
        [plugins.options["hatebnail.show_bookmark_key"],
         M({ja: "リンク先のコメントを見る", en:"Show comments of a link"}),
         function (e) {
             showCommentOfPage(e.href);
         },
         false, false, "a[href]"]
    ];

    function seekAction(aActions, aKey) {
        for (let i = 0; i < aActions.length; ++i) {
            if (aActions[i][0] === aKey) {
                return i;
            }
        }
        return -1;
    }

    actions.forEach(function (row) {
        var i = seekAction(plugins.hok.actions, row[0]);
        if (i >= 0) {
            plugins.hok.actions[i] = row;
        } else {
            plugins.hok.actions.push(row);
        }
    });
});
