KeySnail.Command = {
    modules: null,
    gFindBar: null,
    autoCompleteController: null,

    init: function () {
        this.gFindBar = gFindBar ? gFindBar :
            document.getElementById('FindToolbar');
        this.autoCompleteController =
            Components.classes['@mozilla.org/autocomplete/controller;1']
            .getService(Components.interfaces.nsIAutoCompleteController);
    },

    // ==================== Walk through elements  ====================

    elementsRetriever: function (aXPath) {
        var document = document.commandDispatcher.focusedWindow;// gBrowser.contentWindow.document;
        return document.evaluate(aXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    },

    elementsRetrieverTextarea: function (aDocument) {
        // var document = gBrowser.contentWindow.document;
        // Note: type="search" is Safari specific
        var xPathExp = '//input[@type="text" or @type="password" or @type="search" or not(@type)] | //textarea';
        return aDocument.evaluate(xPathExp, aDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    },

    elementsRetrieverButton: function (aDocument) {
        // var document = gBrowser.contentWindow.document;
        var xPathExp = '//input[@type="submit" or @type="reset" or @type="button" or @type="image"]';
        return aDocument.evaluate(xPathExp, aDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    },

    isSkippable: function (aElement) {
        return (aElement.style.display === 'none')
            || (aElement.style.visibility === 'hidden')
            || (aElement.readOnly);
        // 'readonly' in aElement
    },

    focusElement: function (aElementsRetriever, aNum) {
        var xPathResults = aElementsRetriever(document.commandDispatcher.focusedWindow.document
                                              || gBrowser.contentWindow.document);

        if (xPathResults.snapshotLength == 0) {
            return;
        }

        if (aNum >= xPathResults.snapshotLength) {
            aNum = xPathResults.snapshotLength - 1;
        }

        var item = xPathResults.snapshotItem(aNum);
        while (this.isSkippable(item)) {
            if (aNum == xPathResults.snapshotLength - 1) {
                return;
            }
            item = xPathResults.snapshotItem(aNum + 1);
        }

        item.focus();
    },

    walkInputElement: function (aElementsRetriever, aForward, aCycle) {
        var xPathResults = aElementsRetriever(document.commandDispatcher.focusedWindow.document
                                              || gBrowser.contentWindow.document);
        var focused = document.commandDispatcher.focusedElement;

        var elemCount = xPathResults.snapshotLength;

        if (!elemCount || !focused) {
            return;
        }

        for (var i = 0; i < elemCount; ++i) {
            if (focused == xPathResults.snapshotItem(i)) {
                break;
            }
        }

        if (i == elemCount) {
            return;
        }

        var next = this.getNextIndex(i, elemCount, aForward, aCycle);
        if (next < 0) {
            return;
        }

        while (this.isSkippable(xPathResults.snapshotItem(next))) {
            next = this.getNextIndex(next, elemCount, aForward, aCycle);
            if (next < 0) {
                return;
            }
        }

        xPathResults.snapshotItem(next).focus();
    },

    getNextIndex: function (aCurrent, aCount, aForward, aCycle) {
        var next = aForward ? aCurrent + 1 : aCurrent - 1;

        if (next < 0 || next >= aCount) {
            if (!aCycle) {
                return -1;
            }
            if (next < 0) {
                next = aCount - 1;
            } else {
                next = 0;
            }
        }

        return next;
    },

    // ==================== console ==================== //

    clearConsole: function () {
        var Cc = Components.classes;
        var Ci = Components.interfaces;
        var windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"]
            .getService(Ci.nsIWindowMediator);
        var enumerator = windowMediator.getEnumerator(null);

        while (enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            var clear = win.document.getElementById("Console:clear");
            if (clear) {
                clear.doCommand();
                break;
            }
        }
    },

    // ==================== incremental search ==================== //

    iSearchForward: function () {
        if (this.gFindBar.hidden) {
            this.gFindBar.onFindCommand();
        } else {
            this.gFindBar.onFindAgainCommand(false);
            this.gFindBar._findField.focus();
        }
    },

    iSearchBackward: function () {
        if (this.gFindBar.hidden) {
            this.gFindBar.onFindCommand();
        } else {
            this.gFindBar.onFindAgainCommand(true);
            this.gFindBar._findField.focus();
        }
    },

    focusToById: function (aId) {
        var elem = document.getElementById(aId);
        if (elem) {
            elem.select();
            elem.focus();
        }
    },

    bookMarkToolBarJumpTo: function (aEvent, aArg) {
        if (!aArg || aArg < 0)
            aArg = 0;

        var toolbarBookMarks = document.getElementById('bookmarksBarContent');
        var items = toolbarBookMarks.getElementsByTagName('toolbarbutton');
        // this.message("ブックマークツールバーには " + items.length + " 個");

        if (aArg > items.length - 1)
            aArg = items.length - 1;

        // this.modules.util.listProperty(items[aArg].node);

        // 一覧表示したいならこっち
        // for (i = 0; i < items.length; ++i) {
        //     this.message("Name : " + items[i].label);
        //     this.message("URI : " + items[i].node.uri);
        //     // PlacesUIUtils.openNodeIn(items[i].node, "tab");
        // }

        PlacesUIUtils.openNodeIn(items[aArg - 1].node, "tab");
    },

    autoCompleteHandleKey: function (aKeyEvent) {
        this.autoCompleteController.handleKeyNavigation(aKeyEvent);
    },

    getPosition: function (e) {
        e = e || window.event;
        var cursor = {x:0, y:0};
        if (e.pageX || e.pageY) {
            cursor.x = e.pageX;
            cursor.y = e.pageY;
        }
        else {
            var de = content.document.documentElement;
            var b = content.document.body;
            cursor.x = e.clientX +
                (de.scrollLeft || b.scrollLeft) - (de.clientLeft || 0);
            cursor.y = e.clientY +
                (de.scrollTop || b.scrollTop) - (de.clientTop || 0);
        }
        return cursor;
    },

    // ==================== Editor Commands  ====================

    recenter: function (aEvent) {
        this.modules.util.listProperty(aEvent.target);
        // var cursor = this.getPosition(aEvent.target);
        this.message("Scroll Position : " + aEvent.target.scrollTop);
        this.message("Cursor Position : " + cursor.x + ", " + cursor.y);
    },

    openLine: function (aEvent) {
        this.modules.key.generateKey(aEvent.target,
                                     KeyEvent.DOM_VK_RETURN,
                                     true);
        goDoCommand("cmd_linePrevious");
        goDoCommand("cmd_endLine");
    },

    killLine: function (aEvent) {
        if (this.marked(aEvent)) {
            this.resetMark(aEvent);
        }

        goDoCommand('cmd_selectEndLine');
        goDoCommand('cmd_copy');
        goDoCommand('cmd_deleteToEndOfLine');
    },

    copyRegion: function (aEvent) {
        goDoCommand('cmd_copy');
        this.resetMark(aEvent);
    },

    previousLine: function (aEvent) {
        if (this.modules.util.isMenu()) {
            this.autoCompleteHandleKey(KeyEvent.DOM_VK_UP);
        } else {
            // editable and not on autocomplete widget
            if (this.marked(aEvent)) {
                goDoCommand('cmd_selectLinePrevious');
            } else {
                goDoCommand('cmd_linePrevious');
            }
        }
    },

    nextLine: function (aEvent) {
        if (this.modules.util.isMenu()) {
            this.autoCompleteHandleKey(KeyEvent.DOM_VK_DOWN);
        } else {
            // editable and not on autocomplete widget
            if (this.marked(aEvent)) {
                goDoCommand('cmd_selectLineNext');
            } else {
                goDoCommand('cmd_lineNext');
            }
        }
    },

    previousChar: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectCharPrevious');
        } else {
            goDoCommand('cmd_charPrevious');
        }
    },

    nextChar: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectCharNext');
        } else {
            goDoCommand('cmd_charNext');
        }
    },

    previousWord: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectWordPrevious');
        } else {
            goDoCommand('cmd_wordPrevious');
        }
    },

    nextWord: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectWordNext');
        } else {
            goDoCommand('cmd_wordNext');
        }
    },

    beginLine: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectBeginLine');
        } else {
            goDoCommand('cmd_beginLine');
        }
    },

    endLine: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectEndLine');
        } else {
            goDoCommand('cmd_endLine');
        }
    },

    pageUp: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectPageUp');
        } else {
            goDoCommand('cmd_movePageUp');
        }
    },

    pageDown: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectPageDown');
        } else {
            goDoCommand('cmd_movePageDown');
        }
    },

    moveTop: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectTop');
        } else {
            goDoCommand('cmd_moveTop');
        }
    },

    moveBottom: function (aEvent) {
        if (this.marked(aEvent)) {
            goDoCommand('cmd_selectBottom');
        } else {
            goDoCommand('cmd_moveBottom');
        }
    },

    selectAll: function (aEvent) {
        var orig = aEvent.originalTarget;
        goDoCommand('cmd_moveBottom');
        goDoCommand('cmd_selectTop');
        orig.ksMarked = orig.selectionEnd;
        this.modules.util.print(orig.selectionStart);
        this.modules.util.print(orig.selectionEnd);
    },

    // ==================== Mark ====================
    // original code from Firemacs
    // http://www.mew.org/~kazu/proj/firemacs/

    // predicative
    marked: function (aEvent) {
        var orig = aEvent.originalTarget;
        return (typeof(orig.ksMarked) == 'number'
                || typeof(orig.ksMarked) == 'boolean');
    },

    setMark: function (aEvent) {
        var orig = aEvent.originalTarget;
        if (typeof(orig.selectionStart) == 'number') {
            orig.ksMarked = orig.selectionStart;
        } else {
            orig.ksMarked = true;
        }
        this.modules.display.echoStatusBar('Mark set', 2000);
    },

    resetMark: function (aEvent) {
        var orig = aEvent.originalTarget;
        var mark = orig.ksMarked;

        if (mark == undefined) {
            goDoCommand('cmd_selectNone');
            return;
        }

        orig.ksMarked = null;

        try {
            if (typeof(orig.selectionStart) == 'number' &&
                orig.selectionStart >= 0) {
                if (mark && (orig.selectionStart < mark)) {
                    // [cursor] <=========== [mark]
                    orig.selectionEnd = orig.selectionStart;
                } else {
                    // [mark] ===========> [cursor]
                    orig.selectionStart = orig.selectionEnd;
                }
            } else {
                goDoCommand('cmd_selectNone');
            }
        } catch (e) {
            // on find bar
            // [nsIDOMNSHTMLInputElement.selectionStart]"
            //  nsresult: "0x80004005 (NS_ERROR_FAILURE)"
        }
    },

    message: KeySnail.message
};