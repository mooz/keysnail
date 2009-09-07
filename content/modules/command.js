/**
 * @fileOverview
 * @name command.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Command = {
    modules: null,
    killBuffer: null,

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
            document.defaultView.goDoCommand = function (aCommand) {
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

    // ==================== Command interpreter ====================

    createCommandList: function () {
        if (this.commandList) {
            return this.commandList;
        }

        var moduleList = [str for each (str in
                                        (function (o) {
                                             for (var k in o) yield k;
                                         })(KeySnail.modules))];

        var commandList = [];

        moduleList.forEach(
            function (aModuleName) {
                for (var property in this.modules[aModuleName]) {
                    var cand = this.modules[aModuleName][property]; 
                    if (typeof(cand) == 'function') {
                        var arg = cand.toString().split('\n')[0].match(/\(.*\)/);
                        commandList.push(aModuleName + "." + property + arg + ";");
                    }
                }
            }, this);

        return commandList;
    },

    interpreter: function () {
        with (this.modules) {
            prompt.substrMatch = false;
            prompt.read("Command?:",
                        function (aStr) {
                            Function("with (KeySnail.modules) { " + aStr + " }")();
                            prompt.substrMatch = false;
                        }, null, this.createCommandList(),
                        null, 0, "command");
        }
    },

    // ==================== Walk through elements  ====================

    /**
     * @param {} aDocument
     * @return
     */
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

    isNotVisible: function (aElement, aDoc) {
        var style = aDoc.defaultView.getComputedStyle(aElement, null);
        return style.display == 'none'
            || style.visibility == 'hidden'
            || style.width[0] == '0'
            || style.height[0] == '0';
    },

    isSkippable: function (aElement, aDoc) {
        return (aElement.readOnly)
            || this.isNotVisible(aElement, aDoc);
    },

    /**
     * Retrieve element using <aElementsRetriever> and focus to the <aNum>'rd element
     * @param {function} aElementsRetriever
     * @param {integer} aNum
     */
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
            aNum++;
            if (aNum >= xPathResults.snapshotLength - 1) {
                return;
            }
            item = xPathResults.snapshotItem(aNum);
        }

        item.focus();
    },

    /**
     *
     * @param {function} aElementsRetriever
     * @param {boolean} aForward
     * @param {boolean} aCycle
     */
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
            // no element focused
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

        var elem = xPathResults.snapshotItem(next);

        xPathResults.snapshotItem(next).focus();
    },

    getNextIndex: function (aCurrent, aMax, aForward, aCycle) {
        var next = aForward ? aCurrent + 1 : aCurrent - 1;

        if (next < 0 || next >= aMax) {
            if (!aCycle)
                return -1;

            if (next < 0) {
                next = aMax - 1;
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
            aArg = 1;

        var toolbarBookMarks = document.getElementById('bookmarksBarContent');
        var items = toolbarBookMarks.getElementsByTagName('toolbarbutton');

        var urlList = [];

        // [[url1, title1],
        //  [url2, title2],
        //  [url3, title3], ...]
        for (var i = 0; i < items.length; ++i) {
            if (items[i].node.uri.match(/^(https?|ftp):/)) {
                urlList.push([items[i].node.uri, items[i].label]);
            }
        }

        if (aArg > urlList.length - 1)
            aArg = urlList.length;

        with (this.modules) {
        prompt.read("Places:",
                    function (aStr) {
                        if (aStr) {
                            key.viewURI(aStr);                            
                        }
                    },
                    null,
                    urlList,
                    urlList[aArg - 1][0],
                    aArg - 1,
                    "url");
        }
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
        } else {
            // ########################################
            this.modules.key
                .generateKey(aEvent.originalTarget, aDOMKey, true, 'keydown');
            this.modules.key
                .generateKey(aEvent.originalTarget, aDOMKey, true, 'keypress');
        }
    },

    // ==================== Editor Commands  ====================

    recenter: function (aEvent) {
        var frame = document.commandDispatcher.focusedWindow
            || gBrowser.contentWindow;

        if (aEvent.originalTarget.localName == 'TEXTAREA') {
            var textarea = aEvent.originalTarget;
            var box = textarea.ownerDocument.getBoxObjectFor(textarea);
            var style = frame.document.defaultView.getComputedStyle(textarea, null);

            // get cursor line number in the textarea (zero origin)
            var lines = textarea.value.split('\n');        
            var selStart = textarea.selectionStart;
            for (var i = 0, count = 0; i < lines.length; ++i) {
                count += (lines[i].length + 1);
                if (count > selStart) {
                    var cursorLineNum = i;
                    break;
                }
            }

            // fix Firefox bug (?)
            if (textarea.scrollTop == 0 && selStart == textarea.value.length)
                textarea.scrollTop = textarea.scrollHeight;

            // get line height in pixel value
            var lineHeight = parseInt(style.lineHeight.match("^[0-9]+"));
            // beggining position of the textarea
            var destX = box.x;
            var destY = box.y + lineHeight * cursorLineNum - textarea.scrollTop;

            frame.scrollTo(destX - frame.innerWidth / 2, destY - frame.innerHeight / 2);
        } else {
            // original code from XUL/Migemo
            var selection = frame.getSelection();
            var range = frame.document.createRange();
            var elem = frame.document.createElement('span');
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
     * Get selection information;
     * line number and char count from head of line.
     * @param {[string]} aLines 
     * @param {integer} aSelStart beggining of the selection
     * @param {integer} aSelEnd end of the selection
     * @returns {[integer, integer, integer, integer]} 
     */
    getSelectionInfo: function (aLines, aSelStart, aSelEnd) {
        // detect selection start line
        var count = 0, prevCount;
        var startLineNum, endLineNum; // line number
        var startHeadCount = 0, endHeadCount = 0;
        for (var i = 0; i < aLines.length; ++i) {
            prevCount = count;
            // includes last '\n' (+ 1)
            count += (aLines[i].length + 1);

            if (typeof(startLineNum) == 'undefined' &&
                count > aSelStart) {
                startLineNum = i;
                startHeadCount = aSelStart - prevCount;
            }
            if (count > aSelEnd) {
                endLineNum = i;
                endHeadCount = aSelEnd - prevCount;
                break;
            }
        }

        return [startLineNum, endLineNum, startHeadCount, endHeadCount];
    },

    /**
     * Delete rectangle
     * @param {textarea} aInput text area current caret placed to
     * @param {boolean} aNoExSpace if true, do not add white space to the blank line
     */
    deleteRectangle: function (aInput, aNoExSpace) {
        this.processRectangle(aInput, "", false, aNoExSpace, false);
    },

    /**
     * Kill rectangle and set killed line to the kill-ring
     * @param {textarea} aInput text area current caret placed to
     * @param {boolean} aNoExSpace if true, do not add white space to the blank line
     * @returns {[string]} killed lines
     */
    killRectangle: function (aInput, aNoExSpace) {
        return this.processRectangle(aInput, "", false, aNoExSpace, true);
    },

    yankRectangle: function (aInput, aRectangle) {
        if (!aRectangle) {
            this.modules.display.echoStatusBar("Kill ring is empty", 3000);
            return;
        }

        var oldScrollTop = aInput.scrollTop;
        var oldScrollLeft = aInput.scrollLeft;

        var selStart = aInput.selectionStart;
        var selEnd = aInput.selectionEnd;

        var text = aInput.value;
        var lines = text.split('\n');

        [startLineNum, endLineNum, startHeadCount, endHeadCount]
            = this.getSelectionInfo(lines, selStart, selEnd);

        // ================ process {{ ================ //
        // now we process chars
        var output = "";
        for (i = 0; i < startLineNum; ++i) {
            output += lines[i] + "\n";
        }

        var padHead, padTail;
        for (var j = 0; j < aRectangle.length; ++j, ++i) {
            if (i < lines.length) {
                padHead = lines[i].slice(0, startHeadCount);  
                padTail = lines[i].slice(startHeadCount, lines[i].length);
            } else {
                padHead = padTail = "";
            }
            if (padHead.length < startHeadCount) {
                padHead += new Array(startHeadCount - padHead.length + 1).join(" ");
            }
            output += padHead + aRectangle[j] + padTail + "\n";
        }

        // copy rest line
        for (; i < lines.length; ++i) {
            output += lines[i] + "\n";
        }
        // ================ }} process ================ //

        // remove last "\n" and apply
        aInput.value = output.slice(0, output.length - 1);

        // set caret position
        var caretPos = selStart;

        aInput.setSelectionRange(caretPos, caretPos);
        aInput.scrollTop = oldScrollTop;
        aInput.scrollLeft = oldScrollLeft;

        // quick hack
        var ev = {};
        ev.originalTarget = aInput;
        this.resetMark(ev);
    },

    /**
     * Emacs-like open-rectangle command
     * @param {Textarea} aInput
     * @param {boolean} aNoExSpace if true, do not add white space to the blank line
     */
    openRectangle: function (aInput, aNoExSpace) {
        var selStart = aInput.selectionStart;
        var selEnd = aInput.selectionEnd;

        var text = aInput.value;
        var lines = text.split('\n');

        var startLineNum, endLineNum; // line number
        var startHeadCount, endHeadCount;

        [startLineNum, endLineNum, startHeadCount, endHeadCount]
            = this.getSelectionInfo(lines, selStart, selEnd);

        // get rectangle-width
        var width = (startHeadCount < endHeadCount) ?
            endHeadCount - startHeadCount : startHeadCount - endHeadCount;

        this.processRectangle(aInput, new Array(width + 1).join(" "), true, aNoExSpace, false);
    },

    /**
     * Do Emacs-like rectangle replacement or insersion
     * @param {textarea} aInput text area current caret placed to
     * @param {string} aReplacement alternative string
     */
    replaceRectangle: function (aInput, aReplacement) {
        this.processRectangle(aInput, aReplacement, false, false, false);
    },

    /**
     * Do Emacs-like rectangle manipulation
     * @param {textarea} aInput text area current caret placed to
     * @param {string} aReplacement alternative string
     * @param {boolean} aIsInsert whether do insersion or not (replacement)
     * @param {boolean} aNoExSpace if true, do not add white space to the blank line
     * @param {boolean} aIsKill if true, return killed lines
     * @returns {[string]} killed lines
     */
    processRectangle: function (aInput, aReplacement, aIsInsert, aNoExSpace, aIsKill) {
        if (aReplacement != "" && !aReplacement)
            return null;

        var oldScrollTop = aInput.scrollTop;
        var oldScrollLeft = aInput.scrollLeft;

        var selStart = aInput.selectionStart;
        var selEnd = aInput.selectionEnd;

        var text = aInput.value;
        var lines = text.split('\n');
        var killedLines = aIsKill ? [] : null;

        var startLineNum, endLineNum; // line number
        var startHeadCount, endHeadCount;

        [startLineNum, endLineNum, startHeadCount, endHeadCount]
            = this.getSelectionInfo(lines, selStart, selEnd);

        // intra-line
        // (from - to) becomes rectangle-width
        var from, to;
        [from, to] = (startHeadCount < endHeadCount) ?
            [startHeadCount, endHeadCount] : [endHeadCount, startHeadCount];

        if (aIsInsert) {
            to = from;
        }

        // ================ process {{ ================ //
        // now we process chars
        var output = "";
        for (i = 0; i < startLineNum; ++i) {
            output += lines[i] + "\n";
        }

        var padHead, padTail;
        // replace
        for (i = startLineNum; i <= endLineNum; ++i) {
            // kill
            if (aIsKill) {
                killedLines.push(lines[i].slice(from, to));                
            }
            // replace / delete
            padHead = lines[i].slice(0, from);
            if (padHead.length < from && !aNoExSpace) {
                padHead += new Array(from - padHead.length + 1).join(" ");
            }
            padTail = lines[i].slice(to, lines[i].length);
            output += padHead + aReplacement + padTail + "\n";
        }

        // var rectBeginPos = selStart;
        var rectEndPos = output.length - (padTail.length + 1);

        // copy rest line
        for (; i < lines.length; ++i) {
            output += lines[i] + "\n";
        }
        // ================ }} process ================ //

        // remove last "\n" and apply
        aInput.value = output.slice(0, output.length - 1);

        // set caret position
        var caretPos = 0;
        if (typeof(aInput.ksMarked) == "number") {
            var replaceeLen = to - from;
            var gap = aReplacement.length - replaceeLen;

            if (aIsInsert) {
                // just put caret to the original selection start (as in Emacs)
                caretPos = selStart;
            } else {
                // we need to put caret on [*] position
                if (aInput.ksMarked == selEnd) {
                    // [*] selStart <------------- mark (selEnd)
                    // this.modules.display.prettyPrint("[*] selStart <------------- mark (selEnd)");
                    if (startHeadCount < endHeadCount) {
                        caretPos = selStart;
                    } else {
                        caretPos = selStart + gap;
                    }
                } else {
                    // mark (selStart) -------------> selEnd [*]
                    // this.modules.display.prettyPrint("mark (selStart) -------------> selEnd [*]");
                    if (startHeadCount < endHeadCount) {
                        caretPos = rectEndPos;
                    } else {
                        caretPos = rectEndPos - aReplacement.length;
                    }
                }
            }
        }

        aInput.setSelectionRange(caretPos, caretPos);
        aInput.scrollTop = oldScrollTop;
        aInput.scrollLeft = oldScrollLeft;

        // quick hack
        var ev = {};
        ev.originalTarget = aInput;
        this.resetMark(ev);

        return killedLines;
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
        var oldScrollLeft = aInput.scrollLeft;

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
            aInput.scrollLeft = oldScrollLeft;
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

    // ==================== frame ==================== //

    // Very inspired from functions for keyconfig
    // http://www.pqrs.org/tekezo/firefox/extensions/functions_for_keyconfig/
    focusOtherFrame: function (aArg) {
        var focused = this.getFocusedWindow();
        var topFrameWindow = this.getTopFrameWindow();

        if (!focused) {
            focused = this.topFrameWindow();
        }

        // frame
        var currentframeindex = -1;
        var frameWindows = this.getListFrameWindow(topFrameWindow);
        for (var i = 0; i < frameWindows.length; ++i) {
            if (frameWindows[i] == focused) {
                currentframeindex = i;
                break;
            }
        }

        var focusTo = aArg ?
            currentframeindex - 1 : currentframeindex + 1;
        if (focusTo >= frameWindows.length) {
            focusTo = 0;
        } else if (focusTo < 0) {
            focusTo = frameWindows.length - 1;
        }

        // set focus
        var nextFrameWindow = frameWindows[focusTo];
        if (nextFrameWindow) {
            nextFrameWindow.focus();
        }
    },

    isFrameSetWindow: function (frameWindow) {
        if (!frameWindow) {
            return false;
        }

        var listElem = frameWindow.document.documentElement
            .getElementsByTagName('frameset');

        return (listElem && listElem.length > 0);
    },

    getListFrameWindow: function (baseWindow) {
        var listFrameWindow = [];

        if (this.isFrameSetWindow(baseWindow)) {
            var frameWindows = baseWindow.frames;

            for (var i = 0; i < frameWindows.length; ++i) {
                if (this.isFrameSetWindow(frameWindows[i])) {
                    var childWindows = this.getListFrameWindow(frameWindows[i]);
                    // 子フレームをくっつける
                    listFrameWindow = listFrameWindow.concat(childWindows);
                } else {
                    listFrameWindow.push(frameWindows[i]);
                }
            }
        }

        return listFrameWindow;
    },

    getTopFrameWindow: function () {
        return gBrowser.contentWindow;
    },

    getFocusedWindow: function () {
        var focused = document.commandDispatcher.focusedWindow;
        if (!focused) {
            focused = null;
        }

        return focused;
    },

    message: KeySnail.message
};