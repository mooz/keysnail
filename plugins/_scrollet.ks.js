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

// ChangeLog {{ ============================================================= //
//
// ==== 0.0.7 (2010 10/24) ====
//
// * Made `scrollet-scroll-percent` work properly. Thx to harnack.
//
// ==== 0.0.6 (2010 04/02) ====
//
// * Made scroll commands work properly
//
// ==== 0.0.5 (2010 03/24) ====
//
// * Color scheme
//
// ==== 0.0.4 (2009 12/11) ====
//
// * Power upped mark system.
//
// ==== 0.0.3 (2009 12/11) ====
//
// * Mark system has become support the caret position in caret-mode and edit-mode.
//
// ==== 0.0.2 (2009 12/10) ====
//
// * Added mark sytem
//
// ==== 0.0.1 (2009 12/09) ====
//
// * First release
//
// }} ======================================================================= //

const NS_XHTML = 'http://www.w3.org/1999/xhtml';
const NS_XUL   = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

function generateXPath(elem)
{
    let prefix       = {};
    prefix[NS_XHTML] = 'xhtml';
    prefix[NS_XUL]   = 'xul';

    function safeGetAttribute(elem, name) (name in elem ? elem : elem.wrappedJSObject).getAttribute(name);
    function xpathAttribute(name, key, value) util.format('//%s[@%s="%s"]', name, key, value);
    function commonElementCount(elems, name, max)
    {
        let count = 1;

        for (let i = 0; i < max; ++i)
        {
            if (elems[i].localName === name)
                count++;
        }

        return count;
    }

    let doc       = elem.ownerDocument;
    let isContent = doc.toString().indexOf("XULDocument") === -1;

    let name;
    if (isContent)
        name = function (elem) util.format("%s", elem.localName.toLowerCase());
    else
        name = function (elem) util.format("%s:%s", prefix[elem.namespaceURI || NS_XHTML], elem.localName.toLowerCase());

    let id  = safeGetAttribute(elem, "id");
    if (id)
        return [xpathAttribute(name(elem), "id", id), isContent];

    let xPath =
        (function walker(childs)
         {
             let query;

             for (let i = 0; i < childs.length; ++i)
             {
                 if (childs[i] === elem)
                 {
                     return util.format("/%s[%s]",
                                        name(childs[i]),
                                        commonElementCount(childs, name(childs[i]), i));
                 }

                 query = walker(childs[i].childNodes);

                 if (query)
                 {
                     if (query.indexOf("//") === 0)
                         return query;

                     let id  = safeGetAttribute(childs[i], "id");
                     if (id)
                         return xpathAttribute(name(childs[i]), "id", id) + query;

                     return util.format("/%s[%s]",
                                        name(childs[i]),
                                        commonElementCount(childs, name(childs[i]), i)) + query;
                 }
             }

             return null;
         })(doc.childNodes);

    return [xPath, isContent];
}

function evalXPath(aQuery, aIsContent)
{
    function nsResolver(prefix) {
        var ns = {
            'xhtml' : NS_XHTML,
            'xul'   : NS_XUL
        };
        return ns[prefix] || NS_XHTML;
    }

    let doc = aIsContent ? content.document : document;

    return doc.evaluate(aQuery, doc, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}

// Mark {{ ============================================================== //

const DEFAULT_MODE = key.modes.VIEW;

var modes = {
    VIEW  : key.modes.VIEW,
    EDIT  : key.modes.EDIT,
    CARET : key.modes.CARET
};

var marksHolder = {};

function getMarks(win)
{
    var marks = content.document.__ksScrolletMarks__;
    if (!marks)
        marks = content.document.__ksScrolletMarks__ = {};

    // var markHolder = content.document.__ksScrolletMarkHolder__;
    // if (!markHolder)
    //     markHolder = content.document.__ksScrolletMarkHolder__ = createMarkHolder();

    // var marks = markHolder[mode];
    // if (!marks)
    //     marks = {};

    // var uri   = win.location.href;
    // var marks = markHolder[mode][uri];

    // if (!marks)
    //     marks = markHolder[mode][uri] = {};

    return marks;
}

function getSelection(aWin)
{
    var win = new XPCNativeWrapper(aWin || window.content.window);
    return win.getSelection();
}

function Mark()
{
    // view
    var scrollX;
    var scrollY;
    // edit
    var input;
    // caret
    var range;
    // common
    // var isContent;
    // var xPath;
    var date;
    var mode;
    // var url;
}

Mark.prototype.set = function (win)
{
    var mode = getCurrentMode();

    switch (mode)
    {
    case modes.VIEW:
        this.scrollX = win.scrollX;
        this.scrollY = win.scrollY;
        break;
    case modes.CARET:
        let sel = getSelection(win);
        if (sel.rangeCount === 0)
        {
            // move caret to the head of document
            let r         = win.document.createRange();
            let container = win.document.body;
            r.setStart(container, 0);
            r.setEnd(container, 0);
            sel.addRange(r);
            this.range = r;
        }
        else
        {
            this.range = sel.getRangeAt(0);
        }
        break;
    case modes.EDIT:
        this.input = document.commandDispatcher.focusedElement;
        this.start = this.input.selectionStart;
        // [this.xPath, this.isContent] = generateXPath(this.input);
        break;
    }

    this.mode = mode;
    this.url = win.location.href;

    this.date = Date.now();
};

Mark.prototype.toString = function () {
    switch (this.mode)
    {
    case modes.VIEW:
        return util.format("(%s, %s)", this.scrollX, this.scrollY);
    case modes.CARET:
        let range = this.range;
        try
        {
            return util.format("%s %s [%s]",
                               range.endOffset,
                               M({ja: "文字目", en: "count of "}),
                               range.commonAncestorContainer.textContent
                              );
        }
        catch (x)
        {
            return "";
        }
    case modes.EDIT:
        return util.format("%s %s [%s]",
                           this.start,
                           M({ja: "文字目", en: "count of "}),
                           this.input.value);
    default:
        return "";
        break;
    }
};

// }} ======================================================================= //

// Utils {{ ================================================================= //

function getCurrentMode()
{
    var ev = { originalTarget : document.commandDispatcher.focusedElement || content.document };

    if (!ev.originalTarget.localName)
        ev.originalTarget = { localName : "" };

    return key.getCurrentMode(ev);
}

function findScrollableWindow()
{
    let win;

    try
    {
        win = window.document.commandDispatcher.focusedWindow;
        if (win && (win.scrollMaxX > 0 || win.scrollMaxY > 0))
            return win;

        win = window.content;
        if (win.scrollMaxX > 0 || win.scrollMaxY > 0)
            return win;

        for (let frame in win.frames)
            if (frame.scrollMaxX > 0 || frame.scrollMaxY > 0)
                return frame;
    }
    catch (x)
    {
        win = window.content;
    }

    return win;
}

// }} ======================================================================= //

var scrollet =
    (function () {
         function checkScrollYBounds(win, direction)
         {
             return false;
             // return !(direction > 0 && win.scrollY >= win.scrollMaxY || direction < 0 && win.scrollY == 0);
         }

         // Scroll methods {{ ======================================================== //

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

         // }} ======================================================================= //

         // Public {{ ================================================================ //

         var self = {
             /**
              * @property {number} The buffer's horizontal scroll percentile.
              */
             get scrollXPercent()
             {
                 return self.scrollXPercentForWin();
             },

             /**
              * @property {number} The buffer's vertical scroll percentile.
              */
             get scrollYPercent()
             {
                 return self.scrollYPercentForWin();
             },

             get currentWindow()
             {
                 return findScrollableWindow();
             },

             scrollXPercentForWin: function(aWin) {
                 let win = aWin || findScrollableWindow();
                 if (win.scrollMaxX > 0)
                     return Math.round(win.scrollX / win.scrollMaxX * 100);
                 else
                     return 0;
             },

             scrollYPercentForWin: function(aWin) {
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
                 if (checkScrollYBounds(win, lines))
                     return;
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
                 if (checkScrollYBounds(win, pages))
                     return;
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

                 if (checkScrollYBounds(win, direction))
                     return;
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
             },

             setMark: function (aKey)
             {
                 var win   = findScrollableWindow();
                 var marks = getMarks(win);

                 marks[aKey] = new Mark();
                 marks[aKey].set(win);
             },

             jumpToMark: function (aMark)
             {
                 if (!aMark)
                     return;

                 var win = findScrollableWindow();

                 switch (aMark.mode)
                 {
                 case modes.VIEW:
                     win.scrollTo(aMark.scrollX, aMark.scrollY);
                     break;
                 case modes.EDIT:
                     let input = aMark.input;

                     // let result = evalXPath(aMark.xPath, aMark.isContent);
                     // input = aMark.input = result.snapshotItem(0);
                     // input = input.wrappedJSObject;
                     input.focus();
                     input.selectionStart = input.selectionEnd = aMark.start;

                     // try {
                     //     input.focus();
                     //     input.selectionStart = input.selectionEnd = aMark.start;
                     // } catch (x) {
                     //     let result = evalXPath(aMark.xPath, aMark.isContent);
                     //     window.alert(result.snapshotLength);
                     //     input = aMark.input = result.snapshotItem(0);
                     //     input.selectionStart = input.selectionEnd = aMark.start;
                     // }

                     command.recenter({originalTarget : aMark.input});
                     break;
                 case modes.CARET:
                     util.setBoolPref("accessibility.browsewithcaret", true);

                     let doc   = win.document;
                     let range = aMark.range;

                     let sel = getSelection(win);
                     let r   = doc.createRange();

                     let container = range.endContainer;

                     sel.removeAllRanges();

                     r.setStart(container, range.endOffset);
                     r.setEnd(container, range.endOffset);

                     sel.addRange(r);

                     // we need to reflesh the range in mark too
                     aMark.range = r;

                     // ======== scroll ======== //

                     var elem = doc.createElement('span');
                     r.setStart(sel.focusNode, sel.focusOffset);
                     r.setEnd(sel.focusNode, sel.focusOffset);
                     r.insertNode(elem);

                     var box = doc.getBoxObjectFor(elem);
                     if (!box.x && !box.y)
                         box = doc.getBoxObjectFor(elem.parentNode);

                     win.scrollTo(box.x - win.innerWidth / 2, box.y - win.innerHeight / 2);

                     elem.parentNode.removeChild(elem);
                     range.detach();

                     break;
                 }
             },

             getMarksForWin: function (aWin)
             {
                 var win   = aWin || findScrollableWindow();
                 var marks = getMarks(win);

                 return marks;
             }
         };

         // }} ======================================================================= //

         return self;
     })();

// }} ======================================================================= //

// Misc {{ ================================================================== //

function getElapsedTimeString(aMillisec)
{
    function format(num, str) Math.floor(num) + " " + str;

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
        }, M({en: "Scroll document to the specified percent",
              ja: "前置引数で指定した割合までページをスクロール"}));

ext.add("scrollet-set-mark", function (ev, arg) {
            var description = {};
            description[modes.VIEW]  = M({en: "Input the mark:", ja: "現在のスクロール位置を保存:"});
            description[modes.EDIT]  = M({en: "Input the mark:", ja: "現在のカーソル位置を保存:"});
            description[modes.CARET] = M({en: "Input the mark:", ja: "現在のキャレット位置を保存:"});

            prompt.reader(
                {
                    message: description[getCurrentMode()],
                    onChange: function (arg) {
                        var current = arg.textbox.value;
                        if (current)
                            arg.finish();
                    },
                    collection: null,
                    callback: function (aStr) {
                        if (aStr === null)
                            return;

                        scrollet.setMark(aStr);
                    }
                }
            );
        }, M({en: "Save current scroll / caret position to the mark", ja: "現在のスクロール位置 / キャレット位置を保存"}));

ext.add("scrollet-jump-to-mark", function (ev, arg) {
            function recoverFocus()
            {
                gBrowser.focus();
                _content.focus();
            }

            var win   = scrollet.currentWindow;
            var marks = scrollet.getMarksForWin(win);
            var mode  = getCurrentMode();

            var current = Date.now();
            var collection = [for (k of Object.keys(marks)) [
                marks[k].mode,
                k,
                marks[k],
                getElapsedTimeString(current - marks[k].date)
            ]].sort(
                function (a, b) (a[0] > b[0] ? 1 : a[0] === b[0] ? 0 : -1)
            );

            var selectedMark;

            prompt.selector(
                {
                    message: M({en: "Jump to:", ja: "ジャンプ先:"}),
                    onChange: function (arg) {
                        if (arg.event.keyCode === KeyEvent.DOM_VK_SHIFT ||
                            arg.event.keyCode === KeyEvent.DOM_VK_TAB)
                        {
                            return;
                        }

                        var current = arg.textbox.value;
                        if (current)
                        {
                            selectedMark = current;
                            arg.finish();
                        }
                    },
                    collection: collection,
                    flags: [IGNORE, 0, IGNORE, IGNORE],
                    header: [
                        M({ja: "モード", en: "Mode"}),
                        M({ja: "マーク", en: "Mark"}),
                        M({ja: "位置", en: "Position"}),
                        M({ja: "記録された時間", en: "Recorded time"})
                    ],
                    style: [
                        "text-align:right;margin-right:1em;",
                        "font-weight:bold;",
                        null,
                        style.prompt.description
                    ],
                    width: [
                        20, 10, 40, 30
                    ],
                    supressRecoverFocus: true,
                    callback: function (i) {
                        let key  = (i < 0) ? null : selectedMark || collection[i][1];
                        let mark;

                        if (!key || !(mark = marks[key]))
                        {
                            if (mode !== modes.EDIT)
                                recoverFocus();
                            return;
                        }

                        scrollet.jumpToMark(mark);

                        if (mark.mode !== modes.EDIT)
                            recoverFocus();
                    }
                }
            );
        }, M({en: "Jump to the saved position", ja: "マークに保存された位置へジャンプ"}));

// }} ======================================================================= //

// Export library {{ ======================================================== //

plugins.scrollet = scrollet;

// }} ======================================================================= //

// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Scrollet!</name>
    <description>Provides various scroll commands and mark system</description>
    <description lang="ja">強力なマークシステムと様々なスクロールコマンドを提供します</description>
    <version>0.0.9</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/_scrollet.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/_scrollet.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.5.4</minVersion>
    <include>main</include>
    <provides>
        <ext>scrollet-scroll-line-down</ext>
        <ext>scrollet-scroll-line-up</ext>
        <ext>scrollet-scroll-document-down</ext>
        <ext>scrollet-scroll-document-up</ext>
        <ext>scrollet-scroll-document-right</ext>
        <ext>scrollet-scroll-document-left</ext>
        <ext>scrollet-scroll-percent</ext>
        <ext>scrollet-set-mark</ext>
        <ext>scrollet-jump-to-mark</ext>
    </provides>
    <detail><![CDATA[
=== What's this ===
==== Mark system ====

Do you want records the scroll / caret position of document temporarily?

Scrollet provides the mark system which allows you to record the current scroll / caret position to the certain keys.

Paste the code below to the bottom of your .keysnail.js.

>|javascript|
key.setGlobalKey("C-1", function (ev, arg) {
    ext.exec("scrollet-set-mark", arg, ev);
}, "Save current scroll position to the mark", true);

key.setGlobalKey("C-2", function (ev, arg) {
    ext.exec("scrollet-jump-to-mark", arg, ev);
}, "Jump to the saved position", true);
||<

Now you can record the current scroll / caret position by pressing C-1 and C-2. By pressing C-1, the prompt will appear and if you press some key (may be alphabet?), current scroll / caret position will be recorded to that key.

You can recover the scroll / caret position by pressing C-2 and the key which has the scroll position you gaved.

Here is the settings which emulates the keybindings of register in Emacs.

>|javascript|
key.setGlobalKey(['C-x', 'r', 'SPC'], function (ev, arg) {
    ext.exec("scrollet-set-mark", arg, ev);
}, "Save current scroll position to the mark", true);

key.setGlobalKey(['C-x', 'r', 'j'], function (ev, arg) {
    ext.exec("scrollet-jump-to-mark", arg, ev);
}, "Jump to the saved position", true);
||<

==== Provides various scroll commands ====

If you want to scroll half a page down by SPC and C-v, paste the code below to the bottom of your .keysnail.js.

>|javascript|
key.setViewKey([['SPC'], ['C-v']], function (ev, arg) {
    ext.exec("scrollet-scroll-document-down", arg);
}, 'Scroll document down');

key.setViewKey([['b'], ['M-v']], function (ev, arg) {
    ext.exec("scrollet-scroll-document-up", arg);
}, 'Scroll document up');
||<

You can scroll to the {prefix argument} percent of the document by putting the setting belowto your .keysnail.js.

>|javascript|
key.setViewKey('%', function (ev, arg) {
    ext.exec("scrollet-scroll-percent", arg);
}, 'Scroll to {prefix argument} percent of the document');
||<

For example, press C-u 75 % and you can scroll to the 75 percent of the current document.

==== Methods ====

Besides these exts, this plugin provides a lot of methods which can be used from .keysnail.js and other plugins.

These picked up methods are especially useful.

- plugins.scrollet.scrollLines(lines)
 - Scroll lines by {lines}. (Negative {lines} means scroll up)
- plugins.scrollet.scrollPages(pages)
 - Scroll page by {pages}
- plugins.scrollet.scrollByScrollSize(arg, direction)
 - Scroll by {half a page in pixels} * arg. When direction is true, scrolls down.
- plugins.scrollet.scrollToPercentiles(x, y)
 - Scroll to x, y in percent of the document
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===

==== マークシステム ====

一時的にページのスクロール位置や、カーソル位置を保存しておきたいと思ったことはありませんか？

このプラグインが提供するマークシステムを使えば、ページのスクロール位置やカーソル位置を一時的に保存しておき、あとでその場所までジャンプすることが可能となります。

次のような設定を .keysnail.js ファイル末尾へ張り付けてみてください。

>|javascript|
key.setGlobalKey("C-1", function (ev, arg) {
    ext.exec("scrollet-set-mark", arg, ev);
}, "現在の位置をマークに保存", true);

key.setGlobalKey("C-2", function (ev, arg) {
    ext.exec("scrollet-jump-to-mark", arg, ev);
}, "マークに保存された位置へジャンプ", true);
||<

この設定により C-1 を押すことで現在の位置を保存し、 C-2 を押すことで保存された位置へとジャンプすることが可能となります。

C-1 を押すとプロンプトが現れるので、適当なキー (アルファベット) を入力してください。そのキーへとスクロール位置 / カーソル位置が保存されます。

保存された位置へとジャンプするには C-2 を入力してください。プロンプトが現れるので、先ほどのキーを入力してやれば、その位置へとスクロールが行われます。キーを入力するのでなく、十字キーや TAB を使ってマークを選択しても OK です。

以下に Emacs のレジスタシステムに似たキーバインド例を示します。長ったらしいですが、何回も打ち込んでいると慣れてくるものです。

>|javascript|
key.setGlobalKey(['C-x', 'r', 'SPC'], function (ev, arg) {
    ext.exec("scrollet-set-mark", arg, ev);
}, "現在の位置をマークに保存", true);

key.setGlobalKey(['C-x', 'r', 'j'], function (ev, arg) {
    ext.exec("scrollet-jump-to-mark", arg, ev);
}, "マークに保存された位置へジャンプ", true);
||<

ややこしい Emacs のキーバインドが覚えられて一石二丁ですね。

==== 様々なスクロールコマンドを提供 ====

Firefox デフォルトのスクロールコマンドはあまり融通が効きません。このプラグインは、もう少し柔軟なスクロールコマンドをいくつか提供します。

例えば半画面スクロール。 SPC と C-v は半画面スクロールが良い！ という方は次のような設定を .keysnail.js の末尾へ張り付けておきましょう。

>|javascript|
key.setViewKey([['SPC'], ['C-v']], function (ev, arg) {
    ext.exec("scrollet-scroll-document-down", arg);
}, '半画面スクロールダウン');

key.setViewKey([['b'], ['M-v']], function (ev, arg) {
    ext.exec("scrollet-scroll-document-up", arg);
}, '半画面スクロールアップ');
||<

また、今見ているページの「75 パーセント辺りまでスクロールしたいな」というときは次のキーバインドが使えます。

>|javascript|
key.setViewKey('%', function (ev, arg) {
    ext.exec("scrollet-scroll-percent", arg);
}, '前置引数で指定した割合までページをスクロール');
||<

これを C-u 75 % のようにして呼べば、ページの 75 パーセントまで一気にスクロールすることができてしまいます。

==== メソッド ====

このプラグインはエクステだけでなく、初期化ファイルや他のプラグイン中から使用可能なメソッドも提供します。

以下のメソッドが特に便利でしょう。

- plugins.scrollet.scrollLines(lines)
 - lines 行だけスクロール (lines が負のときスクロールアップ)
- plugins.scrollet.scrollPages(pages)
 - pages 画面分スクロール (pages が負のときスクロールアップ
- plugins.scrollet.scrollByScrollSize(arg, direction)
 - 半画面 * arg 分スクロール (direction が false のときスクロールアップ)
- plugins.scrollet.scrollToPercentiles(x, y)
 - x, y それぞれのスクロール率をパーセンテージ指定
    ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //
