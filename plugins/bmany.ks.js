var PLUGIN_INFO =
<KeySnailPlugin>
    <name>bmany</name>
    <description>Search bookmarks incrementally and go!</description>
    <description lang="ja">anything.el 気分でブックマークを操作</description>
    <version>0.1.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/bmany.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/bmany.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license document="http://www.opensource.org/licenses/mit-license.php">The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.5.4</minVersion>
    <include>main</include>
    <options>
        <option>
            <name>bmany.default_open_type</name>
            <type>string (current, tab, tabshifted)</type>
            <description>Default open type of bookmarks</description>
            <description lang="ja">ブックマークの開き方初期値</description>
        </option>
        <option>
            <name>bmany.folder_style</name>
            <type>string</type>
            <description>Style of the folder name</description>
            <description lang="ja">フォルダ名のスタイル</description>
        </option>
        <option>
            <name>bmany.keyword_style</name>
            <type>string</type>
            <description>Style of the keyword name</description>
            <description lang="ja">キーワード名のスタイル</description>
        </option>
        <option>
            <name>bmany.tag_style</name>
            <type>string</type>
            <description>Style of the tag name</description>
            <description lang="ja">タグ名のスタイル</description>
        </option>
        <option>
            <name>bmany.title_style</name>
            <type>string</type>
            <description>Style of the bookmark name</description>
            <description lang="ja">ブックマーク名のスタイル</description>
        </option>
        <option>
            <name>bmany.url_style</name>
            <type>string</type>
            <description>Style of the url</description>
            <description lang="ja">URL のスタイル</description>
        </option>
    </options>
    <provides>
        <ext>bmany-list-all-bookmarks</ext>
        <ext>bmany-list-toolbar-bookmarks</ext>
        <ext>bmany-list-bookmarks-with-keyword</ext>
        <ext>bmany-list-bookmarks-with-tag</ext>
        <ext>bmany-list-bookmarklets</ext>
    </provides>
    <detail><![CDATA[
=== Usage ===
==== Manipulating bookmarks with prompt.selector ====

This plugin enables you to list bookmarks / bookmarklets using prompt.selector (which is similar to anything.el) and open / execute / edit the item.

By pasting the settings below to the bottom of your .keysnail.js, you can list all bookmarks by pressing : b.

>|javascript|
key.setViewKey([':', 'b'], function (ev, arg) {
    ext.exec("bmany-list-all-bookmarks", arg, ev);
}, 'bmany - List all bookmarks');

key.setViewKey([':', 'B'], function (ev, arg) {
    ext.exec("bmany-list-bookmarklets", arg, ev);
}, "bmany - List all bookmarklets");

key.setViewKey([':', 'k'], function (ev, arg) {
    ext.exec("bmany-list-bookmarks-with-keyword", arg, ev);
}, "bmany - List bookmarks with keyword");

key.setViewKey([':', 't'], function (ev, arg) {
    ext.exec("bmany-list-bookmarks-with-tag", arg, ev);
}, "bmany - List bookmarks with tag");
||<

You can also list bookmarklets by pressing : B, bookmarks with keyword by pressing : k and bookmarks with tag by pressing : t.

This plugin caches the result. You can let bmany to refresh the cache by calling the command with prefix argument like C-u : b.

==== Manipulating the selected item ====

Once you select the item, press Enter or C-m and you can go to that page. By default, item will be opened in the current tab but you can customize this behavior by changing the option value.

For example, the setting below changes the default behavior to "Open item in the new foreground tab" from "Open item in the current tab". You can paste this setting to the PRESERVE area in your .keysnail.js.

>|javascript|
plugins.options["bmany.default_open_type"] = "tab";
||<

"current" means the current tab, "tab" means the new foreground tab and "tabshifted" means the new background tab.

Besides default behavior, you can select other actions by pressing C-i (Ctrl + i).

==== Special thanks ====

Nice icon from http://www.pixel-mixer.com
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== ブックマークを prompt.selector で操作 ====

ブックマークを prompt.selector で操作できるようにします。 anything.el ライクなインタフェースからブックマークの操作が行えるようになり、ちょっぴり幸せですね。

次のような設定を .keysnail.js の末尾へ仕込んでおけば : b と入力することによりブックマークを一覧表示し、アイテムを選択して開くなどすることが可能となります。

>|javascript|
key.setViewKey([':', 'b'], function (ev, arg) {
    ext.exec("bmany-list-all-bookmarks", arg, ev);
}, 'ブックマーク');

key.setViewKey([':', 'B'], function (ev, arg) {
    ext.exec("bmany-list-bookmarklets", arg, ev);
}, "bmany - ブックマークレットを一覧表示");

key.setViewKey([':', 'k'], function (ev, arg) {
    ext.exec("bmany-list-bookmarks-with-keyword", arg, ev);
}, "bmany - キーワード付きブックマークを一覧表示");

key.setViewKey([':', 't'], function (ev, arg) {
    ext.exec("bmany-list-bookmarks-with-tag", arg, ev);
}, "bmany - タグ付きブックマークを一覧表示");
||<

: B とすればブックマークレット一覧が表示され : k とすればキーワード付きのブックマークのみ、: t とすればタグ付きのブックマークのみがリストされます。

表示を高速化する為に、このプラグインでは初回コマンド実行時に結果をキャッシュします。明示的にキャッシュを更新する為には C-u : b のようにして前置引数をつけてコマンドを呼んでください。

==== 選択されたアイテムの操作 ====

アイテムを選択しそのまま Enter や C-m を入力すれば、そのページへとジャンプします。デフォルトでは現在のタブで開かれますが、新規タブで開きたい場合などはオプションの値を変更することで挙動を変更させることが可能です。

例えばデフォルトで「新しいタブを開きフォーカスを当てる」としたい場合は、次のような設定を .keysnail.js の PRESERVE エリアへ張り付ければ良いでしょう。

>|javascript|
plugins.options["bmany.default_open_type"] = "tab";
||<

現在のタブなら current, 新しいタブ (前面) なら tab, 新しいタブ (背面) なら tabshifted となっています。

また、アイテムが選択された状態で C-i (Ctrl + i) を入力すれば、デフォルトのもの以外にも様々な動作を選択することが可能です。

==== ローカルキーマップ ====

例えば次のような設定を .keysnail.js の PRESERVE エリアへ含めておくことにより Ctrl + Enter で「新しいタブでブックマークを開く(前面)」というアクションを実行することが可能となります。

>|javascript|
plugins.options["bmany.keymap"] = {
    "C-RET" : "open-foreground-tab,c"
};
||<

これにより

- 単なる Enter で確定した場合は現在のタブで開き
- Ctrl + Enter とした場合は前面のタブで開く

といった使い分けをすることができるわけです。

次の設定ではコマンドに cn といったフラグを追加しています。 c (continuous) は「コマンド実行後、プロンプトが閉じないようにする」ものであり、 n (next) は「コマンド実行後、一つ下へと自動的に移動する」というものです。

>|javascript|
plugins.options["bmany.keymap"] = {
    "O" : "open-background-tab,cn"
};
||<

==== 謝辞 ====

http://www.pixel-mixer.com のアイコンをベースに使わせて頂きました。
]]></detail>
</KeySnailPlugin>;

// Options {{ =============================================================== //

var optionsDefaultValue = {
    "folder_style"      : "",
    "keyword_style"     : 'font-weight:bold;',
    "tag_style"         : 'font-weight:bold;',
    "title_style"       : 'font-weight:bold;',
    "url_style"         : style.prompt.url,
    "default_open_type" : 'current',
    "keymap"            : {}
};

function getOption(aName) {
    var fullName = "bmany." + aName;

    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

function tap(msg) {
    util.message(msg || "nandayo!");
    return msg;
}

// }} ======================================================================= //

var bmany =
    (function () {
         const Cc = Components.classes;
         const Ci = Components.interfaces;

         const histService = PlacesUtils.history;
         const bmService   = PlacesUtils.bookmarks;
         const ioService   = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

         const defaultFavicon = "chrome://mozapps/skin/places/defaultFavicon.png";

         // PlacesUtils.placesRootId;
         // PlacesUtils.toolbarFolderId;
         // PlacesUtils.bookmarksMenuFolderId;
         // PlacesUtils.unfiledBookmarksFolderId;

         function getFaviconPath(aURL)
         {
             if (!aURL)
                 return defaultFavicon;

             if (typeof aURL === "string")
                 return aURL;

             return aURL.spec;
         }

         // Based on http://www.xuldev.org/blog/?p=181
         // via http://d.hatena.ne.jp/Griever/20090625/1245933515
         function filterBookmarks(aItemId, aFilter, aContainer)
         {
             var parentNode = PlacesUtils.getFolderContents(aItemId).root;

             if (!aContainer)
                 aContainer = [];

             for (var i = 0; i < parentNode.childCount; i++)
             {
                 var childNode = parentNode.getChild(i);

                 if (PlacesUtils.nodeIsBookmark(childNode))
                 {
                     let item = aFilter(childNode, parentNode);
                     if (item)
                         aContainer.push(item);
                 }
                 else if (PlacesUtils.nodeIsFolder(childNode))
                 {
                     arguments.callee(childNode.itemId, aFilter, aContainer);
                 }
             }

             return aContainer;
         }

         function getBookmarks(aItemId) {
             return filterBookmarks(
                 aItemId,
                 function (childNode, parentNode) [childNode.itemId,
                                                   folderIconGetter,
                                                   parentNode.title  || "",
                                                   getFaviconPath(childNode.icon),
                                                   childNode.title,
                                                   childNode.uri]
             );
         }

         function getBookmarksWithKeywords(aItemId) {
             return filterBookmarks(
                 aItemId,
                 function (childNode, parentNode) {
                     let keyword = bmService.getKeywordForURI(ioService.newURI(childNode.uri, null, null));

                     if (keyword)
                     {
                         return [childNode.itemId,
                                 folderIconGetter,
                                 parentNode.title || "",
                                 keyword || "",
                                 getFaviconPath(childNode.icon),
                                 childNode.title,
                                 childNode.uri];
                     }

                     return null;
                 }
             );
         }

         function getBookmarksWithTags(aItemId) {
             return filterBookmarks(
                 aItemId,
                 function (childNode, parentNode) {
                     let tags = PlacesUtils.tagging.getTagsForURI(ioService.newURI(childNode.uri, null, null), {});

                     if (tags.length)
                     {
                         return [childNode.itemId,
                                 folderIconGetter,
                                 parentNode.title || "",
                                 tags || "",
                                 getFaviconPath(childNode.icon),
                                 childNode.title,
                                 childNode.uri];
                     }

                     return null;
                 }
             );
         }

         function getBookmarklets(aItemId) {
             return filterBookmarks(
                 aItemId,
                 function (childNode, parentNode) {
                     if (childNode.uri.indexOf("javascript:") === 0)
                     {
                         let keyword = bmService.getKeywordForURI(ioService.newURI(childNode.uri, null, null));
                         return [childNode.itemId,
                                 folderIconGetter,
                                 parentNode.title  || "",
                                 keyword || "",
                                 getFaviconPath(childNode.icon),
                                 childNode.title,
                                 childNode.uri];
                     }

                     return null;
                 }
             );
         }

         // Misc values {{ =========================================================== //

         var actions = [
             [function (url, id) { self.go(url, "current");    },
              M({en: "Open link in current tab", ja: "現在のタブで開く"}),
              "open-current-tab"],
             [function (url, id) { self.go(url, "tab");        },
              M({en: "Open link in new tab (foreground)", ja: "新しいタブを前面に開く"}),
              "open-foreground-tab"],
             [function (url, id) { self.go(url, "tabshifted"); },
              M({en: "Open link in new tab (background)", ja: "新しいタブを背面に開く"}),
              "open-background-tab"],
             [function (url, id) { self.go(url, "window");     },
              M({en: "Open link in new window", ja: "新しいウィンドウで開く"}),
              "open-new-window"],
             [function (url, id) { self.go(url, "unique");     },
              M({en: "Open link in unique tab", ja: "既に開いていればそのタブを選択し、いなければ現在のタブで開く"}),
              "open-unique-tab"],
             [function (url, id) { PlacesUIUtils.showBookmarkDialog({ itemId:id }, window); },
              M({en: "Edit selected bookmark item", ja: "選択中のブックマークを編集"}),
              "edit-bookmark"]
         ];

         var cache = {};

         var commonKeyMap = getOption("keymap");

         const folderIcon = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0' +
             'U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGrSURBVDjLxZO7ihRBFIa/6u0ZW7GHBUV0' +
             'UQQTZzd3QdhMQxOfwMRXEANBMNQX0MzAzFAwEzHwARbNFDdwEd31Mj3X7a6uOr9BtzNjYjKBJ6ni' +
             'cP7v3KqcJFaxhBVtZUAK8OHlld2st7Xl3DJPVONP+zEUV4HqL5UDYHr5xvuQAjgl/Qs7TzvOOVAj' +
             'xjlC+ePSwe6DfbVegLVuT4r14eTr6zvA8xSAoBLzx6pvj4l+DZIezuVkG9fY2H7YRQIMZIBwycmz' +
             'H1/s3F8AapfIPNF3kQk7+kw9PWBy+IZOdg5Ug3mkAATy/t0usovzGeCUWTjCz0B+Sj0ekfdvkZ3a' +
             'bBv+U4GaCtJ1iEm6ANQJ6fEzrG/engcKw/wXQvEKxSEKQxRGKE7Izt+DSiwBJMUSm71rguMYhQKr' +
             'BygOIRStf4TiFFRBvbRGKiQLWP29yRSHKBTtfdBmHs0BUpgvtgF4yRFR+NUKi0XZcYjCeCG2smkz' +
             'LAHkbRBmP0/Uk26O5YnUActBp1GsAI+S5nRJJJal5K1aAMrq0d6Tm9uI6zjyf75dAe6tx/SsWeD/' +
             '/o2/Ab6IH3/h25pOAAAAAElFTkSuQmCC';

         function folderIconGetter() {
             return folderIcon;
         }

         const ico = ICON   | IGNORE;
         const hid = HIDDEN | IGNORE;

         // }} ======================================================================= //

         // Public {{ ================================================================ //

         let self = {
             get ACTION_CURRENT() { return 0; },
             get ACTION_TAB()     { return 1; },

             listBookmarks: function (arg, openType) {
                 if (arg || !cache.bookmarks)
                 {
                     cache.bookmarks = Array.concat.apply(
                         null,
                         [PlacesUtils.toolbarFolderId,
                          PlacesUtils.bookmarksMenuFolderId,
                          PlacesUtils.unfiledBookmarksFolderId].map(function (id) getBookmarks(id))
                     );
                 }

                 prompt.selector({
                                     message       : "pattern:",
                                     collection    : cache.bookmarks,
                                     //            : id, icon, folder, icon, title, uri
                                     flags         : [hid, ico, 0, ico, 0, 0],
                                     header        : ["Folder", "Title", "URL / Script"],
                                     width         : [17, 45, 38],
                                     style         : [getOption("folder_style"), getOption("title_style"), getOption("url_style")],
                                     actions       : actions,
                                     initialAction : openType,
                                     keymap        : commonKeyMap,
                                     filter        : function (i) (i >= 0) ?
                                         [cache.bookmarks[i][5], cache.bookmarks[i][0]] : []
                                 });
             },

             listToolbarBookmarks: function (arg, openType) {
                 if (arg || !cache.bookmarks)
                     cache.toolbarBookmarks = getBookmarks(PlacesUtils.toolbarFolderId);

                 prompt.selector({
                                     message       : "pattern:",
                                     collection    : cache.toolbarBookmarks,
                                     //            : id, icon, folder, icon, title, uri
                                     flags         : [hid, ico, 0, ico, 0, 0],
                                     header        : ["Title", "URL / Script"],
                                     width         : [17, 45, 38],
                                     style         : [getOption("folder_style"), getOption("title_style"), getOption("url_style")],
                                     actions       : actions,
                                     initialAction : openType,
                                     keymap        : commonKeyMap,
                                     filter        : function (i) (i >= 0) ?
                                         [cache.toolbarBookmarks[i][5], cache.toolbarBookmarks[i][0]] : []
                                 });
             },

             listBookmarksWithKeywords: function (arg, openType) {
                 if (arg || !cache.bookmarksWithKeywords)
                 {
                     cache.bookmarksWithKeywords = Array.concat.apply(
                         null,
                         [PlacesUtils.toolbarFolderId,
                          PlacesUtils.bookmarksMenuFolderId,
                          PlacesUtils.unfiledBookmarksFolderId].map(function (id) getBookmarksWithKeywords(id))
                     );
                 }

                 prompt.selector({
                                     message       : "pattern:",
                                     collection    : cache.bookmarksWithKeywords,
                                     //            : id, folder, keyword, (icon), title, uri
                                     flags         : [hid, ico, 0, 0, ico, 0, 0],
                                     header        : ["Folder", "Keyword", "Title", "URL / Script"],
                                     width         : [15, 15, 35, 35],
                                     style         : [getOption("folder_style"), getOption("keyword_style"),
                                                      getOption("title_style"), getOption("url_style")],
                                     actions       : actions,
                                     initialAction : openType,
                                     keymap        : commonKeyMap,
                                     filter        : function (i) (i >= 0) ?
                                         [cache.bookmarksWithKeywords[i][6], cache.bookmarksWithKeywords[i][0]] : []
                                 });
             },

             listBookmarksWithTags: function (arg, openType) {
                 if (arg || !cache.bookmarksWithTags)
                 {
                     cache.bookmarksWithTags = Array.concat.apply(
                         null,
                         [PlacesUtils.toolbarFolderId,
                          PlacesUtils.bookmarksMenuFolderId,
                          PlacesUtils.unfiledBookmarksFolderId].map(function (id) getBookmarksWithTags(id))
                     );
                 }

                 prompt.selector({
                                     message       : "pattern:",
                                     collection    : cache.bookmarksWithTags,
                                     //            : id, folder, tag, (icon), title, uri
                                     flags         : [hid, ico, 0, 0, ico, 0, 0],
                                     header        : ["Folder", "Tag", "Title", "URL / Script"],
                                     width         : [15, 15, 35, 35],
                                     style         : [getOption("folder_style"), getOption("tag_style"),
                                                      getOption("title_style"), getOption("url_style")],
                                     actions       : actions,
                                     initialAction : openType,
                                     keymap        : commonKeyMap,
                                     filter        : function (i) (i >= 0) ?
                                         [cache.bookmarksWithTags[i][6], cache.bookmarksWithTags[i][0]] : []
                                 });
             },

             listBookmarklets: function (arg, openType) {
                 if (arg || !cache.bookmarklets)
                 {
                     cache.bookmarklets = getBookmarklets(PlacesUtils.placesRootId);
                 }

                 prompt.selector({
                                     message       : "pattern:",
                                     collection    : cache.bookmarklets,
                                     //            : id, folder, keyword, icon, title, uri
                                     flags         : [hid, ico, 0, 0, ico, 0, 0],
                                     header        : ["Folder", "Keyword", "Title", "Script"],
                                     style         : [getOption("folder_style"), getOption("keyword_style"),
                                                      getOption("title_style"), getOption("url_style")],
                                     width         : [15, 15, 35, 35],
                                     actions       : actions,
                                     initialAction : openType,
                                     keymap        : commonKeyMap,
                                     filter        : function (i) (i >= 0) ?
                                         [cache.bookmarklets[i][6], cache.bookmarklets[i][0]] : []
                                 });
             },

             /**
              * Open given url or execute bookmarklet
              * @param {} aQuery
              * @param {} aOpenType
              */
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
             }
         };

         // }} ======================================================================= //

         return self;
     })();

// Export {{ ================================================================ //

plugins.bmany = bmany;

// }} ======================================================================= //

var openType = {
    "current"    : 0,
    "tab"        : 1,
    "tabshifted" : 2,
    "window"     : 3,
    "unique"     : 4
}[getOption("default_open_type")] || 0;

// Add exts {{ ============================================================== //

ext.add("bmany-list-all-bookmarks", function (ev, arg) { bmany.listBookmarks(arg, openType); },
        M({ja: "bmany - ブックマークを一覧表示",
           en: "bmany - List all bookmarks"}));

ext.add("bmany-list-toolbar-bookmarks", function (ev, arg) { bmany.listToolbarBookmarks(arg, openType); },
        M({ja: "bmany - ツールバーのブックマークを一覧表示",
           en: "bmany - List toolbar bookmarks"}));

ext.add("bmany-list-bookmarks-with-keyword", function (ev, arg) { bmany.listBookmarksWithKeywords(arg, openType); },
        M({ja: "bmany - キーワード付きブックマークを一覧表示",
           en: "bmany - List bookmarks with keyword"}));

ext.add("bmany-list-bookmarks-with-tag", function (ev, arg) { bmany.listBookmarksWithTags(arg, openType); },
        M({ja: "bmany - タグ付きブックマークを一覧表示",
           en: "bmany - List bookmarks with tag"}));

ext.add("bmany-list-bookmarklets", function (ev, arg) { bmany.listBookmarklets(arg, openType); },
        M({ja: "bmany - ブックマークレットを一覧表示",
           en: "bmany - List bookmarklets"}));

// }} ======================================================================= //
