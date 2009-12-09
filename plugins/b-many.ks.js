var PLUGIN_INFO =
<KeySnailPlugin>
    <name>B-many</name>
    <name lang="ja">ビーマニ</name>
    <description></description>
    <description lang="ja">キーワードとブックマークレット を anything する</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/b-many.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/b-many.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.8</minVersion>
    <include>main</include>
    <provides>
        <ext>prefer-ldrize-toggle-status</ext>
    </provides>
    <options>
        <option>
            <name>prefer_ldrize.keymap</name>
            <type>object</type>
            <description>Local keymaps in LDRize enabled site</description>
            <description lang="ja">LDRize が有効となっているサイトでのキーマップ</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Prefer LDRize ====
Have a nice browsing with LDRize and KeySnail!
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== LDRize を優先 ====
]]></detail>
</KeySnailPlugin>;

var bmany =
    (function () {
         const Cc = Components.classes;
         const Ci = Components.interfaces;

         var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
             .getService(Components.interfaces.nsINavBookmarksService);
         var ios = Components.classes["@mozilla.org/network/io-service;1"]
             .getService(Components.interfaces.nsIIOService);

         const defaultFavicon = "chrome://mozapps/skin/places/defaultFavicon.png";

         function getBookmarks(aItemId, aContainer, aParentName) {
             var parentNode = PlacesUtils.getFolderContents(aItemId).root;

             if (!aContainer)
                 aContainer = [];

             for (var i = 0; i < parentNode.childCount; i++)
             {
                 var childNode = parentNode.getChild(i);

                 if (PlacesUtils.nodeIsBookmark(childNode))
                 {
                     aContainer.push([aParentName || "",
                                      (childNode.icon || {spec : defaultFavicon}).spec,
                                      childNode.title,
                                      childNode.uri]);
                 }
                 else if (PlacesUtils.nodeIsFolder(childNode)
                          && !PlacesUtils.nodeIsLivemarkContainer(childNode))
                 {
                     arguments.callee(childNode.itemId, aContainer, childNode.title);
                 }
             }

             return aContainer;
         }

         // Based on http://www.xuldev.org/blog/?p=181
         // via http://d.hatena.ne.jp/Griever/20090625/1245933515
         function getBookmarksWithKeywords(aItemId, aContainer) {
             var parentNode = PlacesUtils.getFolderContents(aItemId).root;

             if (!aContainer)
                 aContainer = [];

             for (var i = 0; i < parentNode.childCount; i++)
             {
                 var childNode = parentNode.getChild(i);

                 if (PlacesUtils.nodeIsBookmark(childNode))
                 {
                     var uri     = ios.newURI(childNode.uri, null, null);
                     var keyword = bmsvc.getKeywordForURI(uri);

                     if (keyword || childNode.uri.indexOf("javascript:") === 0)
                     {
                         aContainer.push([(childNode.icon || {spec : defaultFavicon}).spec,
                                          keyword || "",
                                          childNode.title,
                                          childNode.uri]);
                     }
                 }
                 else if (PlacesUtils.nodeIsFolder(childNode)
                          && !PlacesUtils.nodeIsLivemarkContainer(childNode))
                 {
                     arguments.callee(childNode.itemId, aContainer);
                 }
             }

             return aContainer;
         }

         function getRows() {
             return getBookmarksWithKeywords(1).filter(function (elem, index, array) array.indexOf(elem) === index);
         }

         function getRows2() {
             return getBookmarks(1).filter(function (elem, index, array) array.indexOf(elem) === index);
         }

         var actions = [
             [function (url) { self.go(url, "current");    }, M({en: "Open link in current tab", ja: "現在のタブで開く"})],
             [function (url) { self.go(url, "tab");        }, M({en: "Open link in new tab (foreground)", ja: "新しいタブを前面に開く"})],
             [function (url) { self.go(url, "tabshifted"); }, M({en: "Open link in new tab (background)", ja: "新しいタブを背面に開く"})],
             [function (url) { self.go(url, "window");     }, M({en: "Open link in new window", ja: "新しいウィンドウで開く"})],
             [function (url) { self.go(url, "unique");     }, M({en: "Open link in unique tab", ja: "既に開いていればそのタブを選択し、いなければ現在のタブで開く"})]
         ];

         var cache = {};

         // Public {{ ================================================================ //

         let self = {
             go: function (aQuery, aOpenType) {
                 if (!aQuery)
                     return;

                 if (aQuery.indexOf("javascript:") === -1)
                     aQuery = getShortcutOrURI(aQuery);

                 if (aQuery.indexOf("javascript:") === 0)
                 {
                     // bookmarklet
                     try
                     {
                         loadURI(aQuery);
                     }
                     catch (x) {}
                 }
                 else
                 {
                     if (aOpenType === "unique")
                     {
                         var tabs = gBrowser.mTabContainer.childNodes;
                         for (var i = 0; i < tabs.length; ++i)
                         {
                             if (tabs[i].linkedBrowser.currentURI.spec === aQuery)
                             {
                                 gBrowser.mTabContainer.selectedIndex = i;
                                 return;
                             }
                         }

                         aOpenType = "tab";
                     }

                     // tab        => foreground
                     // tabshifted => background
                     // window     => new window
                     // current    => current tab
                     openUILinkIn(aQuery, aOpenType || "current");
                 }
             },

             listBookmarklets: function (ev, arg) {
                 if (arg !== null || !cache.bookmarklets)
                     cache.bookmarklets = getRows().sort(function (a, b) (a[1] > b[1] ? 1 : a[1] === b[1] ? 0 : -1));

                 prompt.selector({
                                     message    : "pattern:",
                                     collection : cache.bookmarklets,
                                     header     : ["Keyword", "Title", "URL / Script"],
                                     width      : [20, 30, 50],
                                     flags      : [ICON | IGNORE, 0, IGNORE, IGNORE],
                                     actions    : actions,
                                     filter: function (i) [i >= 0 ? cache.bookmarklets[i][3] : null]
                                 });
             },

             listBookmarks: function (ev, arg) {
                 if (arg !== null || !cache.bookmarks)
                     cache.bookmarks = getRows2();

                 prompt.selector({
                                     message    : "pattern:",
                                     collection : cache.bookmarks,
                                     flags      : [0, ICON | IGNORE, 0, 0],
                                     // 
                                     header     : ["Folder", "Title", "URL / Script"],
                                     width      : [17, 38, 45],
                                     style      : [null, "font-weight:bold;", "color:#04169b;"],
                                     // 
                                     actions    : actions,
                                     filter     : function (i) [i >= 0 ? cache.bookmarks[i][3] : null]
                                 });
             }
         };

         // }} ======================================================================= //

         return self;
     })();

// Export {{ ================================================================ //

plugins.bmany = bmany;

// }} ======================================================================= //

// Add exts {{ ============================================================== //

ext.add("bmany-list-keywords-and-bookmarklet",
        function () { bmany.listBookmarklets(); },
        M({ja: "B-Many - キーワードとブックマークレットを一覧表示",
           en: "B-many - List keywords and bookmarklets"}));

ext.add("bmany-list-all-bookmarks",
        function () { bmany.listBookmarks(); },
        M({ja: "B-Many - ブックマークを一覧表示",
           en: "B-many - List all bookmarks"}));

// }} ======================================================================= //