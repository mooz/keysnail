KeySnail.Command = {
    modules: null,
    get gFindBar() {
        return typeof(gFindBar) == 'undefined' ?
            document.getElementById('FindToolbar') : gFindBar;
    },
    get autoCompleteController() {
        return Components.classes['@mozilla.org/autocomplete/controller;1']
            .getService(Components.interfaces.nsIAutoCompleteController);
    },

    init: function () {
        if (typeof(goDoCommand) == 'undefined') {
            document.defaultView.goDoCommand = function(aCommand) {
                try {
                    var controller = 
                        top.document.commandDispatcher.getControllerForCommand(aCommand);
                    if (controller && controller.isCommandEnabled(aCommand))
                        controller.doCommand(aCommand);
                }
                catch(e) {
                    this.message("An error " + e + " occurred executing the " + aCommand + " command\n");
                }
            };
        }
    },

    // ==================== Walk through elements  ====================

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

    isSkippable: function (aElement, aDoc) {
        return (aElement.style.display === 'none')
            || (aElement.style.visibility === 'hidden')
            || (aElement.readOnly)
            || aDoc.defaultView.getComputedStyle(aElement, null).width[0] == '0'
            || aDoc.defaultView.getComputedStyle(aElement, null).height[0] == '0';
    },

    focusElement: function (aElementsRetriever, aNum) {
        var doc = document.commandDispatcher.focusedWindow.document
            || gBrowser.contentWindow.document;
        var xPathResults = aElementsRetriever(doc);

        if (xPathResults.snapshotLength == 0) {
            return;
        }

        if (aNum >= xPathResults.snapshotLength) {
            aNum = xPathResults.snapshotLength - 1;
        }

        var item = xPathResults.snapshotItem(aNum);
        while (this.isSkippable(item, doc)) {
            if (aNum == xPathResults.snapshotLength - 1) {
                return;
            }
            item = xPathResults.snapshotItem(aNum + 1);
        }

        item.focus();
    },

    walkInputElement: function (aElementsRetriever, aForward, aCycle) {
        var doc = document.commandDispatcher.focusedWindow.document
            || gBrowser.contentWindow.document;
        var xPathResults = aElementsRetriever(doc);
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

        while (this.isSkippable(xPathResults.snapshotItem(next), doc)) {
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

    closeFindBar: function () {
        if (this.gFindBar && !this.gFindBar.hidden) {
            this.gFindBar.close();
        }
    },

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
        // item.length

        if (aArg > items.length - 1)
            aArg = items.length - 1;

        // this.modules.util.listProperty(items[aArg].node);

        // List all items
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

    inputHandleKey: function (aEvent, aCommand, aSelectedCommand, aDOMKey) {
        if (aEvent.originalTarget.localName == 'TEXTAREA') {
            // ########################################
            if (this.marked(aEvent)) {
                goDoCommand(aSelectedCommand);
            } else {
                goDoCommand(aCommand);
            }
        } else if (this.modules.util.isMenu()) {
            // ########################################
            this.autoCompleteHandleKey(aDOMKey);
        } else if (typeof(hBookmark.TagCompleter) != 'undefined') {
            // ########################################
            // hateb tag completion
            var newEvent = document.createEvent('KeyboardEvent');
            newEvent.initKeyEvent('keydown', true, true, null,
                                  false, false, false, false,
                                  aDOMKey, 0);
            // aEvent.originalTarget.dispatchEvent(newEvent);
            hBookmark.TagCompleter.InputHandler.prototype.inputKeydownHandler(newEvent);
        } else {
            // ########################################
            this.modules.key
                .generateKey(aEvent.originalTarget, aDOMKey, true);            
        }
    },

    // ==================== Editor Commands  ====================

    // original code from XUL/Migemo
    recenter: function (aEvent) {
        var frame = document.commandDispatcher.focusedWindow
                 || gBrowser.contentWindow;

        var selection = frame.getSelection();
        var range = frame.document.createRange();
        var elem;

        if (this.modules.util.isWritable()) {
            elem = aEvent.originalTarget;

            var box = elem.ownerDocument.getBoxObjectFor(elem);
            frame.scrollTo(box.x - frame.innerWidth / 2, box.y - frame.innerHeight / 2);
        }
        else {
            elem = frame.document.createElement('span');
            range.setStart(selection.focusNode, selection.focusOffset);
            range.setEnd(selection.focusNode, selection.focusOffset);
            range.insertNode(elem);

            var box = frame.document.getBoxObjectFor(elem);
            if (!box.x && !box.y)
                box = frame.document.getBoxObjectFor(elem.parentNode);

            frame.scrollTo(box.x - frame.innerWidth / 2, box.y - frame.innerHeight / 2);

            elem.parentNode.removeChild(elem);
            range.detach();
        }
    },

    // recenter: function (aEvent) {
    //     var selCon = this.modules.util.getSelectionController();
    //     this.modules.util.listProperty(selCon);
    //     // selCon.scrollSelectionIntoView(selCon.SELECTION_NORMAL,
    //     //                                selCon.SELECTION_ANCHOR_REGION,
    //     //                                true);
    //     // this.modules.util.listProperty(aEvent.target);
    //     // // var cursor = this.getPosition(aEvent.target);
    //     // this.message("Scroll Position : " + aEvent.target.scrollTop);
    //     // this.message("Cursor Position : " + cursor.x + ", " + cursor.y);
    // },

    // ==================== Insertion ==================== //

    openLine: function (aEvent) {
        this.modules.key.generateKey(aEvent.originalTarget,
                                     KeyEvent.DOM_VK_RETURN,
                                     true);
        goDoCommand("cmd_linePrevious");
        goDoCommand("cmd_endLine");
    },

    // ==================== Rectangle ==================== //

    /**
     * Do Emacs-like rectangle replacement
     * @param {textarea} aInput
     * @param {string} aAlt an alternative string
     * @return
     */
    replaceRectangle: function (aInput, aReplacement) {
        var oldScrollTop = aInput.scrollTop;

        var selStart = aInput.selectionStart;
        var selEnd = aInput.selectionEnd;

        // if (typeof(aInput.ksMarked) == "number" &&
        //     aInput.ksMarked > selEnd) {
        //     selEnd = aInput.ksMarked;
        // }

        var text = aInput.value;

        var lines = text.split('\n');

        // detect selection start line
        var count = 0, prevCount;
        var startLineNum, endLineNum; // line number
        for (var i = 0; i < lines.length; ++i) {
            prevCount = count;
            // includes last '\n' (+ 1)
            count += (lines[i].length + 1);
            
            if (typeof(startLineNum) == 'undefined' &&
                count >= selStart) {
                startLineNum = i;
                var startHeadCount = selStart - prevCount;
            }
            if (count >= selEnd) {
                endLineNum = i;
                var endHeadCount = selEnd - prevCount;
                break;
            }
        }

        // intra-line
        // (from - to) becomes rectangle-width
        var from, to;
        if (startHeadCount < endHeadCount) {
            from = startHeadCount;
            to   = endHeadCount;
        } else {
            from = endHeadCount;
            to   = startHeadCount;
        }

        // now we process chars
        var output = "";
        for (i = 0; i < startLineNum; ++i) {
            output += lines[i] + "\n";
        }

        // replace
        var padHead, padTail;
        var addedSpace = 0, addedSpaceLineCount = 0;
        for (i = startLineNum; i <= endLineNum; ++i) {
            padHead = lines[i].slice(0, from);
            if (padHead.length < from) {
                addedSpace += (from - padHead.length);
                addedSpaceLineCount++;
                padHead += new Array(from - padHead.length + 1).join(" ");            
            }
            padTail = lines[i].slice(to, lines[i].length);
            output += padHead + aReplacement + padTail + "\n";
        }

        // copy rest line
        for (; i < lines.length; ++i) {
            output += lines[i] + "\n";
        }

        // remove last "\n" and apply
        aInput.value = output.slice(0, output.length - 1);

        // set caret position
        var caretPos = 0;
        if (typeof(aInput.ksMarked) == "number") {
            var replaceeLen = to - from;
            var gap = aReplacement.length - replaceeLen;

            // we need to put caret on [*] position
            if (aInput.ksMarked == selEnd) {
                // [*] selStart <------------- mark (selEnd)
                // display.prettyPrint("[*] selStart <------------- mark (selEnd)");
                // ====================
                if (startHeadCount < endHeadCount) {
                    caretPos = selStart;
                } else {
                    caretPos = selStart + gap;
                }
            } else {
                // mark (selStart) -------------> selEnd [*]
                // display.prettyPrint("mark (selStart) -------------> selEnd [*]");
                // ====================
                // (gap in word count per line, between before and after) *
                // (line count)
                caretPos = selEnd + gap * (endLineNum - startLineNum + 1
                                           - addedSpaceLineCount);
                caretPos += addedSpace + addedSpaceLineCount;
            }
        }

        aInput.setSelectionRange(caretPos, caretPos);
        aInput.scrollTop = oldScrollTop;

        // quick hack
        var ev = {};
        ev.originalTarget = aInput;
        command.resetMark(ev);
    },

    openRectangle: function (aInput) {
        var begin = aInput.selectionStart;
        var end = aInput.selectionEnd;

        if (begin == end)
            return;

        var text = aInput.value;

        var lines = text.split('\n');

        // detect selection start line
        var count = 0;
        var beginLineNum, endLineNum;
        var i, prevCount;
        for (i = 0; i < lines.length; ++i) {
            prevCount = count;
            count += (lines[i].length + 1);
            
            if (typeof(beginLineNum) == 'undefined' &&
                count >= begin) {
                beginLineNum = i;
                var beginHeadCount = begin - prevCount;
            }
            if (count >= end) {
                endLineNum = i;
                var endHeadCount = end - prevCount;
                break;
            }
        }

        // get rectangle-width
        var width = (beginHeadCount < endHeadCount) ?
            endHeadCount - beginHeadCount : beginHeadCount - endHeadCount;
        
        this.replaceRectangle(aInput, new Array(width + 1).join(" "));
    },

    // ==================== Copy / Cut ==================== //

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

    // ==================== Select ==================== //

    selectAll: function (aEvent) {
        var orig = aEvent.originalTarget;
        goDoCommand('cmd_moveBottom');
        goDoCommand('cmd_selectTop');
        orig.ksMarked = orig.selectionEnd;
        // this.modules.util.print(orig.selectionStart);
        // this.modules.util.print(orig.selectionEnd);
    },

    // ==================== By line ==================== //

    previousLine: function (aEvent) {
        this.inputHandleKey(aEvent,
                            "cmd_linePrevious",
                            "cmd_selectLinePrevious",
                            KeyEvent.DOM_VK_UP);
    },

    nextLine: function (aEvent) {
        this.inputHandleKey(aEvent,
                            "cmd_lineNext",
                            "cmd_selectLineNext",
                            KeyEvent.DOM_VK_DOWN);
    },

   // ==================== By page ==================== //

    pageUp: function (aEvent) {
        this.inputHandleKey(aEvent,
                            "cmd_movePageUp",
                            "cmd_selectPageUp",
                            KeyEvent.DOM_VK_PAGE_UP);
    },

    pageDown: function (aEvent) {
        this.inputHandleKey(aEvent,
                            "cmd_movePageDown",
                            "cmd_selectPageDown",
                            KeyEvent.DOM_VK_PAGE_DOWN);
    },
 
    // ==================== Intra line ==================== //

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

    // ==================== Transformation ==================== //

    // processBackwardWord: function (aInput, aFilter) {
    //     var begin = aInput.selectionStart;
    //     var end   = aInput.selectionEnd;
    //     var text  = aInput.value;
    //     var subword = text.slice(0, end).match(/[a-zA-Z]+\s*$/);

    //     var wordBegin = !!subword ? end - subword[0].length : end;

    //     subword[0] = aFilter(subword[0]);

    //     aInput.value = text.slice(0, wordBegin) + subword[0] + text.slice(end);
    //     aInput.setSelectionRange(wordBegin, wordBegin);
    // },

    processForwardWord: function (aInput, aFilter) {
        var oldScrollTop = aInput.scrollTop;
        var begin = aInput.selectionStart;
        var end   = aInput.selectionEnd;
        var text  = aInput.value;
        var subword = text.slice(end).match(/[^a-zA-Z]*[a-zA-Z]+|[^a-zA-Z]+/);

        if (!!subword) {
            var wordEnd = end + subword[0].length;
            subword[0] = aFilter(subword[0]);
            aInput.value = text.slice(0, begin) + subword[0] + text.slice(wordEnd);
            aInput.setSelectionRange(wordEnd, wordEnd);
            // without a line below, textbox scrollTop becomes 0!
            aInput.scrollTop = oldScrollTop;
        }
    },

    capitalizeWord: function (aString) {
        var spaces = aString.match(/^[^a-zA-Z]*/);
        var wordBegin = !!spaces ? spaces[0].length : 0;
        return aString.slice(0, wordBegin)
            + aString.charAt(wordBegin).toUpperCase()
            + aString.slice(wordBegin + 1).toLowerCase();
    },

    // ==================== Complete move ==================== //

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

    // ==================== Mark ====================
    // original code from Firemacs
    // http://www.mew.org/~kazu/proj/firemacs/

    // predicative
    marked: function (aEvent) {
        var orig = aEvent.originalTarget;
        return (typeof(orig.ksMarked) == 'number' ||
                typeof(orig.ksMarked) == 'boolean');
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
            if (typeof(orig.selectionStart) == 'number' && orig.selectionStart >= 0) {
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