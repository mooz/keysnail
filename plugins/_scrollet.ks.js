// Most functions in this plugin are borrowed from buffer.js of liberator

/***** BEGIN LICENSE BLOCK ***** {{{
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

Copyright (c) 2006-2009 by Martin Stubenschrott <stubenschrott@vimperator.org>

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
}}} ***** END LICENSE BLOCK *****/

// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Scrollet!</name>
    <name lang="ja">スクロレット！</name>
    <description>Provides various scroll commands</description>
    <description lang="ja">様々なスクロールコマンドを提供します</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/_scrollet.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/_scrollet.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.1.3</minVersion>
    <include>main</include>
    <provides>
        <ext>scrollet-scroll-line-down</ext>
        <ext>scrollet-scroll-line-up</ext>
        <ext>scrollet-scroll-document-down</ext>
        <ext>scrollet-scroll-document-up</ext>
        <ext>scrollet-scroll-document-right</ext>
        <ext>scrollet-scroll-document-left</ext>
        <ext>scrollet-scroll-percent</ext>
    </provides>
    <detail><![CDATA[
=== What's this ===
==== Provides various scroll commands ====

If you want to scroll half a page down by SPC and C-v, paste the code below to the bottom of your .keysnail.js.

>||
key.setViewKey([['SPC'], ['C-v']], function (ev, arg) {
    ext.exec("scrollet-scroll-document-down", arg);
}, 'Scroll document down');

key.setViewKey('M-v', function (ev, arg) {
    ext.exec("scrollet-scroll-document-up", arg);
}, 'Scroll document up');
||<

You can scroll to the {prefix argument} percent of the document by putting the setting belowto your .keysnail.js.

>||
key.setViewKey('%', function (ev, arg) {
    ext.exec("scrollet-scroll-percent", arg);
}, 'Scroll to {prefix argument} percent of the document');
||<

For example, press C-u 75 % and you can scroll to the 75 percent of the current document.

==== Methods ====

Besides these exts, this plugin provides a lot of methods which can be used from .keysnail.js and other plugins.

These picked up methods are especially useful.

- plugins.scrollet.scrollPages(pages)
 - Scroll page by {pages}
- plugins.scrollet.scrollByScrollSize(arg, direction)
 - Scroll by {half a page in pixels} * arg
- plugins.scrollet.scrollToPercentiles(x, y)
 - Scroll to x, y in percent of the document
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===
==== 様々なスクロールコマンドを提供 ====

Firefox デフォルトのスクロールコマンドはあまり融通が効きません。そこで、このプラグインの出番というわけです。

例えば半画面スクロール。 SPC と C-v は半画面スクロールが良い！ という方は次のような設定を .keysnail.js の末尾へ張り付けておきましょう。

>||
key.setViewKey([['SPC'], ['C-v']], function (ev, arg) {
    ext.exec("scrollet-scroll-document-down", arg);
}, '半画面スクロールダウン');

key.setViewKey('M-v', function (ev, arg) {
    ext.exec("scrollet-scroll-document-up", arg);
}, '半画面スクロールアップ');
||<

また、今見ているページの「70 パーセント辺りまでスクロールしたいな」というときは次のキーバインドが使えます。

>||
key.setViewKey('%', function (ev, arg) {
    ext.exec("scrollet-scroll-percent", arg);
}, '前置引数で指定した割合までページをスクロール');
||<

これを C-u 75 % のようにして呼べば、ページの 75 パーセントまで一気にスクロールすることができてしまいます。

==== メソッド ====

このプラグインはエクステだけでなく、初期化ファイルや他のプラグイン中から使用可能なメソッドも提供します。

以下のメソッドが特に便利でしょう。

- plugins.scrollet.scrollPages(pages)
 - pages 画面分スクロール
- plugins.scrollet.scrollByScrollSize(arg, direction)
 - 半画面 * arg 分スクロール
- plugins.scrollet.scrollToPercentiles(x, y)
 - x, y それぞれのスクロール率をパーセンテージ指定
    ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
//
// ==== 0.0.1 (2009 12/09) ====
//
// * First release
//
// }} ======================================================================= //

// Main {{ ================================================================== //

var scrollet =
    (function() {
         function checkScrollYBounds(win, direction)
         {
             // if (direction > 0 && win.scrollY >= win.scrollMaxY || direction < 0 && win.scrollY == 0)
             //       return;
         }

         function findScrollableWindow()
         {
             let win = window.document.commandDispatcher.focusedWindow;
             if (win && (win.scrollMaxX > 0 || win.scrollMaxY > 0))
                 return win;

             win = window.content;
             if (win.scrollMaxX > 0 || win.scrollMaxY > 0)
                 return win;

             for (let frame in util.Array.itervalues(win.frames))
                 if (frame.scrollMaxX > 0 || frame.scrollMaxY > 0)
                     return frame;

             return win;
         }

         // both values are given in percent, -1 means no change
         function scrollToPercentiles(horizontal, vertical)
         {
             let win = findScrollableWindow();
             let h, v;

             if (horizontal < 0)
                 h = win.scrollX;
             else
                 h = win.scrollMaxX / 100 * horizontal;

             if (vertical < 0)
                 v = win.scrollY;
             else
                 v = win.scrollMaxY / 100 * vertical;

             win.scrollTo(h, v);
         }

         var self = {
             /**
              * @property {number} The buffer's horizontal scroll percentile.
              */
             get scrollXPercent()
             {
                 let win = findScrollableWindow();
                 if (win.scrollMaxX > 0)
                     return Math.round(win.scrollX / win.scrollMaxX * 100);
                 else
                     return 0;
             },

             /**
              * @property {number} The buffer's vertical scroll percentile.
              */
             get scrollYPercent()
             {
                 let win = findScrollableWindow();
                 if (win.scrollMaxY > 0)
                     return Math.round(win.scrollY / win.scrollMaxY * 100);
                 else
                     return 0;
             },

             /**
              * Scrolls to the bottom of the current buffer.
              */
             scrollBottom: function ()
             {
                 scrollToPercentiles(-1, 100);
             },

             /**
              * Scrolls the buffer laterally <b>cols</b> columns.
              *
              * @param {number} cols The number of columns to scroll. A positive
              *     value scrolls right and a negative value left.
              */
             scrollColumns: function (cols)
             {
                 let win = findScrollableWindow();
                 const COL_WIDTH = 20;

                 if (cols > 0 && win.scrollX >= win.scrollMaxX || cols < 0 && win.scrollX == 0)
                     return;

                 win.scrollBy(COL_WIDTH * cols, 0);
             },

             /**
              * Scrolls to the top of the current buffer.
              */
             scrollEnd: function ()
             {
                 scrollToPercentiles(100, -1);
             },

             /**
              * Scrolls the buffer vertically <b>lines</b> rows.
              *
              * @param {number} lines The number of lines to scroll. A positive
              *     value scrolls down and a negative value up.
              */
             scrollLines: function (lines)
             {
                 let win = findScrollableWindow();
                 checkScrollYBounds(win, lines);
                 win.scrollByLines(lines);
             },

             /**
              * Scrolls the buffer vertically <b>pages</b> pages.
              *
              * @param {number} pages The number of pages to scroll. A positive
              *     value scrolls down and a negative value up.
              */
             scrollPages: function (pages)
             {
                 let win = findScrollableWindow();
                 checkScrollYBounds(win, pages);
                 win.scrollByPages(pages);
             },

             /**
              * Scrolls the buffer vertically 'scroll' lines.
              *
              * @param {boolean} direction The direction to scroll. If true then
              *     scroll up and if false scroll down.
              */
             scrollByScrollSize: function (arg, direction)
             {
                 direction = direction ? 1 : -1;
                 arg = arg || 1;
                 let win = findScrollableWindow();

                 checkScrollYBounds(win, direction);
                 win.scrollBy(0, (win.innerHeight / 2 * direction) * arg);
             },

             /**
              * Scrolls the buffer to the specified screen percentiles.
              *
              * @param {number} x The horizontal page percentile.
              * @param {number} y The vertical page percentile.
              */
             scrollToPercentiles: function (x, y)
             {
                 scrollToPercentiles(x, y);
             },

             /**
              * Scrolls the buffer to the specified screen pixels.
              *
              * @param {number} x The horizontal pixel.
              * @param {number} y The vertical pixel.
              */
             scrollTo: function (x, y)
             {
                 content.scrollTo(x, y);
             },

             /**
              * Scrolls the current buffer laterally to its leftmost.
              */
             scrollStart: function ()
             {
                 scrollToPercentiles(0, -1);
             },

             /**
              * Scrolls the current buffer vertically to the top.
              */
             scrollTop: function ()
             {
                 scrollToPercentiles(-1, 0);
             }
         };

         return self;
     })();

// }} ======================================================================= //

// Add exts {{ ============================================================== //

ext.add("scrollet-scroll-line-down", function (ev, arg) {
            scrollet.scrollLines(Math.max(arg, 1));
        }, M({en: "Scroll line down", ja: "一行スクロールダウン"}));

ext.add("scrollet-scroll-line-up", function (ev, arg) {
            scrollet.scrollLines(-Math.max(arg, 1));
        }, M({en: "Scroll line up", ja: "一行スクロールアップ"}));

ext.add("scrollet-scroll-document-down", function (ev, arg) {
            scrollet.scrollByScrollSize(arg, true);
        }, M({en: "Scroll document down", ja: "半画面スクロールダウン"}));

ext.add("scrollet-scroll-document-up", function (ev, arg) {
            scrollet.scrollByScrollSize(arg, false);
        }, M({en: "Scroll document up", ja: "半画面スクロールアップ"}));

ext.add("scrollet-scroll-document-right", function (ev, arg) {
            scrollet.scrollColumns(Math.max(arg, 1));
        }, M({en: "Scroll document to the right", ja: "右へスクロール"}));

ext.add("scrollet-scroll-document-left", function (ev, arg) {
            scrollet.scrollColumns(-Math.max(arg, 1));
        }, M({en: "Scroll document to the left", ja: "左へスクロール"}));

ext.add("scrollet-scroll-percent", function (ev, arg) {
            if (typeof arg !== 'number')
                return;

            if (arg > 0 && arg <= 100)
                scrollet.scrollToPercentiles(scrollet.scrollXPercent, arg);
        }, M({en: "Scroll document to the left", ja: "前置引数で指定した割合までページをスクロール"}));

// }} ======================================================================= //

// Export library {{ ======================================================== //

plugins.scrollet = scrollet;

// }} ======================================================================= //
