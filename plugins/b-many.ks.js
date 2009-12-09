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

         // Based on http://www.xuldev.org/blog/?p=181
         // via http://d.hatena.ne.jp/Griever/20090625/1245933515
         function getRow(aItemId, aContainer) {
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
             return getRow(1).filter(function (elem, index, array) array.indexOf(elem) === index);
         }

         // Public {{ ================================================================ //

         let self = {
             go: function (aQuery, aOpenType) {
                 util.message(aQuery);

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

             list: function () {
                 let collection = getRows().sort(function (a, b) (a[1] > b[1] ? 1 : a[1] === b[1] ? 0 : -1));

                 function go(aOpenType) {
                     return function (i) { if (i >= 0) self.go(collection[i][3], aOpenType); };
                 }

                 prompt.selector({
                                     message    : "pattern:",
                                     collection : collection,
                                     header     : ["Keyword", "Title", "URL / Script"],
                                     width      : [20, 30, 50],
                                     flags      : [ICON | IGNORE, 0, IGNORE, IGNORE],
                                     actions    : [
                                         [go("current")    , M({en: "Open link in current tab", ja: "現在のタブで開く"})],
                                         [go("tab")        , M({en: "Open link in new tab (foreground)", ja: "新しいタブを前面に開く"})],
                                         [go("tabshifted") , M({en: "Open link in new tab (background)", ja: "新しいタブを背面に開く"})],
                                         [go("window")     , M({en: "Open link in new window", ja: "新しいウィンドウで開く"})],
                                         [go("unique")     , M({en: "Open link in unique tab", ja: "既に開いていればそのタブを選択し、いなければ現在のタブで開く"})]
                                     ],
                                     onChange   : function (arg) {
                                         // key     : modules.key.keyEventToString(aEvent),
                                         // textbox : textbox,
                                         // event   : aEvent,
                                         // context : selectorContext[SELECTOR_STATE_CANDIDATES],
                                         // finish  : self.finish
                                     }
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
        function () { bmany.list(); },
        M({ja: "B-Many - キーワードとブックマークレットを一覧表示",
           en: "B-many - List keywords and bookmarklets"}));

// }} ======================================================================= //