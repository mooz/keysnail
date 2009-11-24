// PLUGIN INFO: {{{
var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Hatebnail</name>
    <description>Use Hatena bookmark extension from KeySnail!</description>
    <description lang="ja">はてなブックマーク拡張を KeySnail から使おう！</description>
    <version>1.1.8</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/hateb-keysnail-collabo.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/hateb-keysnail-collabo.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.6</minVersion>
    <include>main</include>
    <provides>
        <ext>list-hateb-comments</ext>
        <ext>list-hateb-items</ext>
    </provides>
    <options>
        <option>
            <name>hatebnail.list_bookmarks_limit</name>
            <type>integer</type>
            <description>Limit count of bookmark items to be displayed (Default: 5000)</description>
            <description lang="ja">表示するブックマークの上限数 (デフォルト値: 5000)</description>
        </option>
    </options>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
このプラグインをインストールすることにより
- list-hateb-comments
- list-hateb-items
といったエクステが追加されます。

M-x など (ext.select を呼び出すキー) を入力することにより、これらのコマンドを実行することができます。

また .keysnail.js 内に次のような設定を記述することにより、特定のキーへコマンドを割り当てておくことも可能です。

>||
key.setGlobalKey(["C-M-c"], function (ev, arg) {
    ext.exec("list-hateb-comments", arg);
}, "はてなブックマークのコメントを一覧表示", true);

key.setGlobalKey(["C-x", ";"], function (ev, arg) {
    ext.exec("list-hateb-items", arg);
}, "はてなブックマークのアイテムを一覧表示", true);
||<

上記のような設定により C-M-c で「現在閲覧しているページのはてなブックマークのコメント一覧」を、 C-x ; により「自分のはてなブックマーク一覧」を、それぞれ表示することが可能となります。
]]></detail>
</KeySnailPlugin>;
// }}}

// ChangeLog : {{{
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

ext.add("list-hateb-comments", listHBComments, M({ja: 'このページのはてなブックマークコメントを一覧表示',
                                                  en: 'List hatena bookmark comments of this page'}));
ext.add("list-hateb-items"   , listHBItems,    M({ja: "はてなブックマークのアイテムを一覧表示しジャンプ",
                                                  en: 'List all hatena bookmark entries in prompt.selector'}));

function showCommentOfPage(aPageURL, aArg) {
    if (KeySnail.windowType != "navigator:browser" || !hBookmark)
        return;

    const HB_USER_ICON = 0;
    const HB_USER_NAME = 1;
    const HB_TAGS      = 2;
    const HB_COMMENT   = 3;
    const HB_DATE      = 4;

    const B_URL = 'http://b.hatena.ne.jp/';

    function iconGetter(aRow) {
        return aRow[HB_USER_ICON] = hBookmark.UserUtils.getProfileIcon(aRow[HB_USER_NAME]);
    }

    hBookmark.HTTPCache.comment.async_get(
        aPageURL,
        function (data) {
            if (!data || !data.title) {
                display.echoStatusBar(M({ja: 'ブックマークが見つかりませんでした',
                                         en: "No bookmarks found"}), 2000);
                return;
            }

            var collection = [];
            var bookmarks = data.bookmarks;

            for (var i = 0; i < bookmarks.length; ++i) {
                var bookmark = bookmarks[i];

                if (!bookmark.comment && (aArg == null))
                    continue;

                collection.push([iconGetter, bookmark.user, bookmark.tags.toString(), bookmark.comment, bookmark.timestamp]);
            }

            if (!collection.length) {
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
                    message: "pattern:",
                    collection: collection,
                    flags: [ICON | IGNORE, 0, 0, 0, 0],
                    style: ["color:blue;", "color:#3c5bff;", null, "color:#989898;"],
                    header: ["User", "Tags", "Comment", "Date"],
                    width: [15, 25, 45, 15],
                    actions: [
                        [function (aIndex) {
                             if (aIndex >= 0) {
                                 var url = getPermaLink(collection[aIndex]);
                                 openUILinkIn(url, "tab");
                             }
                         }, M({ja: '選択中ユーザのブックマークコメントページを新しいタブで開く',
                               en: "Open User Comment Page in new tab"})],
                        [function (aIndex) {
                             if (aIndex >= 0) {
                                 command.setClipboardText(collection[aIndex][HB_COMMENT]);
                             }
                         }, M({ja: 'コメントをクリップボードにコピー',
                               en: "Copy selected comment"})],
                        [function (aIndex) {
                             if (aIndex >= 0) {
                                 display.prettyPrint(collection[aIndex][HB_COMMENT], {timeout: 6000, fade: 300});
                             }
                         }, M({ja: 'コメントを全文表示',
                               en: "Display entire comment"})],
                        [function (aIndex) {
                             var matched;
                             var comment = collection[aIndex][HB_COMMENT];

                             while ((matched = comment.match("(h?t?tps?|ftp)(://[a-zA-Z0-9/?#_*.:/=&\\-]+)")))
                             {
                                 var prefix = (matched[1] == "ftp") ? "ftp" : "http";
                                 if (matched[1][matched[1].length - 1] == 's')
                                     prefix += "s";

                                 gBrowser.loadOneTab(prefix + matched[2], null, null, null, false);

                                 comment.text = comment.text.slice(comment.text.indexOf(matched[2]) + matched[2].length);
                             }
                         }, M({ja: 'コメント中の URL を開く',
                               en: 'Open URL in the comment'})]
                    ]
                }
            );
        });
};

function listHBComments(aEvent, aArg) {
    showCommentOfPage(content.location.href, aArg);
};

function listHBItems(aEvent, aArg) {
    if (KeySnail.windowType != "navigator:browser")
        return;

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
    if (!hblist || aArg != null) {
        if (!hBookmark.User.user) {
            hBookmark.User.login();
            util.sleep(2000);
        }

        var db = hBookmark.User.user.database.connection;
        var stmt = db.createStatement(["SELECT b.title, b.comment, b.url, b.date, b.search",
                                       "FROM bookmarks b",
                                       "ORDER BY b.date DESC"].join(" "));
        var count = 0;
        var bookmarks = [];
        while (stmt.executeStep() && count++ < limit) {
            // icon, title, comment, url, date, search,
            bookmarks.push([iconGetter, stmt.getString(0), stmt.getString(1),
                            stmt.getString(2), getDate(stmt.getString(3)), stmt.getString(4)]);
        }

        hblist = bookmarks;
    }

    prompt.selector(
        {
            message: "pattern:",
            collection: hblist,
            flags: [ICON | IGNORE, IGNORE, IGNORE, HIDDEN | IGNORE, IGNORE, HIDDEN],
            style: [null, "color:#0a1e89;", "color:#001d6b;"],
            header: ["Title", "Comment", "Date"],
            width: [40, 45, 15],
            actions: [
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
