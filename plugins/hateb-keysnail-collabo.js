my.showCommentOfPage = function (aPageURL, aArg) {
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
                display.echoStatusBar("No bookmarks", 2000);
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
                         }, "Open User Comment Page in new tab"]
                    ]
                }
            );
        });
};

my.listHBComments = function (aEvent, aArg) {
    my.showCommentOfPage(content.location.href, aArg);
};

my.listHbookmark = function (aEvent, aArg) {
    if (KeySnail.windowType != "navigator:browser")
        return;

    var limit = 4000;

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
        return aString.slice(0, 4) + " 年 " + aString.slice(4, 6) + " 月 " + aString.slice(6, 8)
            + " 日 " + aString.slice(8, 10) + ":" + aString.slice(10, 12);
    }

    function getURL(aIndex) {
        return my.hblist[aIndex][HB_URL];
    }

    // by adding prefix arugment to force rebuild the cache
    if (!my.hblist || aArg != null) {
        if (!hBookmark.User.user) {
            hBookmark.User.login();
            macro.sleep(2000);
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

        my.hblist = bookmarks;
    }

    prompt.selector(
        {
            message: "pattern:",
            collection: my.hblist,
            flags: [ICON | IGNORE, IGNORE, IGNORE, HIDDEN | IGNORE, IGNORE, HIDDEN],
            style: [null, null, "color:#001d6b;"],
            header: ["Title", "Comment", "Date"],
            width: [40, 45, 15],
            actions: [
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "tab");
                     }
                 }, "Open Link in new tab (foreground)"],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "tabshifted");
                     }
                 }, "Open Link in new tab (background)"],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "window");
                     }
                 }, "Open Link in new window"],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         openUILinkIn(getURL(aIndex), "current");
                     }
                 }, "Open Link in current tab"],
                [function (aIndex) {
                     if (aIndex >= 0)
                         hBookmark.AddPanelManager.showPanel(getURL(aIndex));
                 }, "Edit bookmark entry"],
               [function (aIndex) {
                     if (aIndex >= 0) {
                         var url = getURL(aIndex);
                         my.showCommentOfPage(url);
                     }
                 }, "Show comments of the selected item's page"],
                [function (aIndex) {
                     if (aIndex >= 0) {
                         var url = getURL(aIndex);
                         var match = url.match("(ftp|https?)://(.*)");
                         if (match) {
                             openUILinkIn("http://b.hatena.ne.jp/entry/" + match[2], "tab");
                         }
                     }
                 }, "Show hatena bookmark page of selected item"]
            ]
        }
    );
};

my.listHistoryRecentryVisited = function (aEvent, aArg) {
    var db = util.getPlacesDB();                 
    var stmt = db.createStatement(["SELECT DISTINCT b.title, p.url",
                                   "FROM moz_bookmarks b, moz_places p, moz_historyvisits h",
                                   "WHERE p.id = b.fk AND h.place_id = p.id",
                                   "ORDER BY h.visit_date DESC"].join(" "));
    var count = 0;
    var bookmarks = [];

    function iconGetter(aRow) {
        return util.getFaviconPath(aRow[2]);
    }

    while (stmt.executeStep() && count++<1000) {
        var title = stmt.getString(0);
        var url = stmt.getString(1);
        bookmarks.push([iconGetter, title, url]);
    }
    prompt.selector({
                        message: "pattern:",
                        callback: function (aIndex) {
                            if (aIndex >= 0) {
                                gBrowser.loadOneTab(bookmarks[aIndex][2], null, null, null, aArg != null);
                            }
                        },
                        collection: bookmarks,
                        flags: [ICON | IGNORE, 0, 0]
                    });
};

my.listAllBookmarks = function (aEvent, aArg) {
    var db = util.getPlacesDB();                 
    var stmt = db.createStatement("SELECT b.title, p.url FROM moz_bookmarks b JOIN moz_places p ON p.id = b.fk");
    var count = 0;
    var bookmarks = [];

    function iconGetter(aRow) {
        return util.getFaviconPath(aRow[2]);
    }

    while (stmt.executeStep() && count++ != 5000) {
        var title = stmt.getString(0);
        var url = stmt.getString(1);
        bookmarks.push([iconGetter, title, url]);
    }

    prompt.selector({
                        message: "pattern: ",
                        callback: function (aIndex) {
                            if (aIndex >= 0) {
                                gBrowser.loadOneTab(bookmarks[aIndex][2], null, null, null, aArg != null);
                            }
                        },
                        flags: [ICON | IGNORE, 0, 0],
                        collection: bookmarks
                    });
};

my.listHistoryWithKeyword = function (aEvent) {
    var db = util.getPlacesDB();
    var stmt = db.createStatement("SELECT moz_bookmarks.title, moz_places.url, moz_keywords.keyword FROM moz_bookmarks JOIN moz_places ON moz_places.id = moz_bookmarks.fk JOIN moz_keywords ON moz_keywords.id = moz_bookmarks.keyword_id");
    var count = 0;
    var bookmarks = [];

    function iconGetter(aRow) {
        return aRow[0] = util.getFaviconPath(aRow[2]);
        // return util.getFaviconPath(row[2]);
    }

    while (stmt.executeStep() && count++!=1000) {
        var title = stmt.getString(0);
        var url = stmt.getString(1);
        var keyword = stmt.getString(2);
        bookmarks.push([iconGetter, title + " (" + keyword + ")", url]);
    }
    prompt.selector({
                        message: "pattern: ",
                        callback: function (aIndex) {
                            if (aIndex >= 0) {}
                        },
                        flags: [ICON | IGNORE, 0, 0],
                        collection: bookmarks
                    });
};

shell.add("hbc", my.listHBComments, 'はてブコメント一覧');
shell.add("list-history-recently-visited", my.listHistoryRecentryVisited, 'ブックマークした履歴のうち最近訪れたもの一覧');
shell.add("list-all-bookmarks", my.listAllBookmarks, 'ブクマ一覧');
shell.add("list-bookmarks-with-keyword", my.listHistoryWithKeyword, 'キーワードの付いたブクマ一覧');
shell.add("hatena-bookmark", my.listHbookmark, "はてなブックマークのアイテムを一覧表示しジャンプ");

key.setGlobalKey(["C-M-c"], my.listHBComments, "現在のページのはてなブックマークコメントを一覧表示", true);
key.setGlobalKey(["C-x", ";"], my.listHbookmark, "はてなブックマークを一覧表示", true);
