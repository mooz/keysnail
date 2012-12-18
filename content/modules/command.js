/**
 * @fileOverview Collection of editor commands
 * @name command.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const command = {
    modules: null,

    /**
     * will be assigned by the killring.js
     */
    kill: null,

    get gFindBar() {
        return typeof gFindBar === 'undefined' ?
            document.getElementById('FindToolbar') : gFindBar;
    },
    get autoCompleteController() {
        return Components.classes['@mozilla.org/autocomplete/controller;1']
            .getService(Components.interfaces.nsIAutoCompleteController);
    },

    init: function () {
        // load kill-ring
        try {
            Components.utils.import("resource://keysnail-share/killring.js", this);
        } catch (x) {
            util.message(x);
        }

        // for window which does not have goDoCommand()
        if (typeof goDoCommand === 'undefined')
        {
            document.defaultView.goDoCommand = function (aCommand) {
                try {
                    var controller =
                        top.document.commandDispatcher.getControllerForCommand(aCommand);
                    if (controller && controller.isCommandEnabled(aCommand))
                        controller.doCommand(aCommand);
                } catch (e) {
                    util.message("An error " + e + " occurred executing the " + aCommand + " command\n");
                }
            };
        }
    },

    // ==================== Command interpreter ====================

    /**
     * Evaluate strings in user context and display it's result like `eval-expression' in Emacs
     * If prefix argument `arg' is given ::
     *  - inspect result object with DOM Inspector (arg > 0)
     *  - refresh the cache of completion (arg < 0)
     * @param {} ev
     * @param {} arg
     * @returns {}
     */
    interpreter: function (ev, arg) {
        let inspect = ('inspectObject' in window) && (arg > 0);

        prompt.reader({
            message    : "Eval: ",
            completer  : completer.fetch.javascript(),
            group      : "eval-expression",
            callback   : function (code) {
                try
                {
                    let result = util.evalInContext(code);
                    if (typeof result !== 'undefined')
                    {
                        if (inspect)
                            window.inspectObject(result);
                        else
                        {
                            display.echoStatusBar(result);
                            util.message(result);
                        }
                    }
                }
                catch (x)
                {
                    display.echoStatusBar(x);
                    util.message(x);
                }
            }
        });
    },

    // ==================== Walk through elements  ====================

    /**
     * @param {} aDocument
     * @return
     */
    elementsRetrieverTextarea: function (aDocument) {
        let xPathExp = '\
            //input[(@type="text" or @type="password" or @type="search" or not(@type)) and not(@type="hidden")]\
          | //textarea\
          | //textbox';

        return util.getNodesFromXPath(xPathExp, aDocument);
    },

    elementsRetrieverButton: function (aDocument) {
        let xPathExp = '\
            //input[@type="submit" or @type="reset" or @type="button" or @type="image"]\
          | //button';

        return util.getNodesFromXPath(xPathExp, aDocument);
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
        let doc = document.commandDispatcher.focusedWindow.document
            || gBrowser.contentWindow.document;
        let xPathResults = aElementsRetriever(doc);

        if (xPathResults.snapshotLength == 0)
            return;

        if (aNum >= xPathResults.snapshotLength)
        {
            aNum = xPathResults.snapshotLength - 1;
        }

        var item = xPathResults.snapshotItem(aNum);
        while (this.isSkippable(item, doc) &&
               aNum < xPathResults.snapshotLength)
        {
            item = xPathResults.snapshotItem(++aNum);
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
        var focused = util.focusedElement;

        var elemCount = xPathResults.snapshotLength;

        if (!elemCount || !focused)
            return;

        for (var i = 0; i < elemCount; ++i)
        {
            if (focused == xPathResults.snapshotItem(i))
                break;
        }

        if (i == elemCount)
        {
            // no element focused
            return;
        }

        var next = this.getNextIndex(i, elemCount, aForward, aCycle);
        if (next < 0)
            return;

        while (this.isSkippable(xPathResults.snapshotItem(next), doc))
        {
            next = this.getNextIndex(next, elemCount, aForward, aCycle);
            if (next < 0)
                return;
        }

        var elem = xPathResults.snapshotItem(next);

        xPathResults.snapshotItem(next).focus();
    },

    getNextIndex: function (aCurrent, aMax, aForward, aCycle) {
        var next = aForward ? aCurrent + 1 : aCurrent - 1;

        if (next < 0 || next >= aMax)
        {
            if (!aCycle)
                return -1;

            if (next < 0)
                next = aMax - 1;
            else
                next = 0;
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

        while (enumerator.hasMoreElements())
        {
            var win = enumerator.getNext();
            var clear = win.document.getElementById("Console:clear");
            if (clear)
            {
                clear.doCommand();
                break;
            }
        }
    },

    // ==================== incremental search ==================== //

    closeFindBar: function () {
        if (this.gFindBar && !this.gFindBar.hidden)
            this.gFindBar.close();
    },

    iSearchForwardKs: function (aEvent) {
        if (this.gFindBar.hidden)
            this.gFindBar.open();
        else if (aEvent.target == this.gFindBar)
            this.gFindBar.onFindAgainCommand(false);

        this.gFindBar._findField.focus();
        goDoCommand("cmd_selectAll");
    },

    iSearchBackwardKs: function (aEvent) {
        if (this.gFindBar.hidden)
            this.gFindBar.open();
        else if (aEvent.target == this.gFindBar)
            this.gFindBar.onFindAgainCommand(true);

        this.gFindBar._findField.focus();
        goDoCommand("cmd_selectAll");
    },

    iSearchForward: function () {
        // this.findCommand(false);
        if (this.gFindBar.hidden)
        {
            this.gFindBar.onFindCommand();
        }
        else
        {
            this.gFindBar.onFindAgainCommand(false);
            this.gFindBar._findField.focus();
            // goDoCommand("cmd_selectAll");
        }
    },

    iSearchBackward: function () {
        // this.findCommand(true);
        if (this.gFindBar.hidden)
        {
            this.gFindBar.onFindCommand();
        }
        else
        {
            this.gFindBar.onFindAgainCommand(true);
            this.gFindBar._findField.focus();
            // goDoCommand("cmd_selectAll");
        }
    },

    findCommand: function (aDirection) {
        var isFocused = util.focusedElement == this.gFindBar._findField.inputField;

        if (this.gFindBar.hidden)
        {
            this.gFindBar.open();
        }
        else if (isFocused)
        {
            this.gFindBar.onFindAgainCommand(aDirection);
        }

        this.gFindBar._findField.inputField.focus();

        if (isFocused)
            goDoCommand("cmd_selectNone");
        else
            goDoCommand("cmd_selectAll");
    },

    focusToById: function (aId) {
        var elem = document.getElementById(aId);
        if (elem)
        {
            elem.select();
            elem.focus();
        }
    },

    webSearch: function () {

    },

    bookMarkToolBarJumpTo: function () {
        var toolbarBookMarks = document.getElementById('bookmarksBarContent') || document.getElementById('PlacesToolbarItems');
        var items            = toolbarBookMarks.getElementsByTagName('toolbarbutton');

        function getInfo(item) {
            let node = item.node || item._placesNode;
            return [util.getFaviconPath(node.uri), item.label, node.uri, node.itemId];
        }

        function isBookmarkItem(item) {
            let node = item.node || item._placesNode;
            return node && /^(https?|ftp):/.test(node.uri);
        }

        var urlList = [getInfo(item) for ([, item] in Iterator(items)) if (isBookmarkItem(item))];

        prompt.selector(
            {
                message    : "Pattern: ",
                collection : urlList,
                // [icon, title, url, id]
                flags      : [ICON | IGNORE, 0, 0, IGNORE | HIDDEN],
                header     : ["Title", "URL"],
                style      : [null, style.prompt.url],
                actions    : [
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(urlList[aIndex][2], "tab");
                        }
                    }, "Open Link in new tab (foreground)"],
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(urlList[aIndex][2], "tabshifted");
                        }
                    }, "Open Link in new tab (background)"],
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(urlList[aIndex][2], "window");
                        }
                    }, "Open Link in new window"],
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            openUILinkIn(urlList[aIndex][2], "current");
                        }
                    }, "Open Link in current tab"],
                    [function (aIndex) {
                        if (aIndex >= 0) {
                            PlacesUIUtils.showItemProperties(urlList[aIndex][3], "bookmark");
                        }
                    }, "Edit bookmark entry"]
                ]
            }
        );
    },

    autoCompleteHandleKey: function (aKeyEvent) {
        this.autoCompleteController.handleKeyNavigation(aKeyEvent);
    },

    inputHandleKey: function (aEvent, aCommand, aSelectedCommand, aDOMKey) {
        if (aEvent.originalTarget.localName.toUpperCase() == 'TEXTAREA')
        {
            if (this.marked(aEvent))
                goDoCommand(aSelectedCommand);
            else
                goDoCommand(aCommand);
        }
        // else if (util.isMenu())
        // {
        //     util.message("is Menu!");
        //     this.autoCompleteHandleKey(aDOMKey);
        // }
        else
        {
            key.generateKey(aEvent.originalTarget, aDOMKey, true, 'keydown');
            key.generateKey(aEvent.originalTarget, aDOMKey, true, 'keypress');
            key.generateKey(aEvent.originalTarget, aDOMKey, true, 'keyup');
        }
    },

    // ==================== Editor Commands  ====================

    recenter: function (aEvent) {
        var frame = document.commandDispatcher.focusedWindow
            || gBrowser.contentWindow;

        if (aEvent.originalTarget.localName.toUpperCase() == 'TEXTAREA')
        {
            var textarea = aEvent.originalTarget;
            var box = textarea.ownerDocument.getBoxObjectFor(textarea);
            var style = frame.document.defaultView.getComputedStyle(textarea, null);

            // get cursor line number in the textarea (zero origin)
            var lines = textarea.value.split('\n');
            var selStart = textarea.selectionStart;
            for (var i = 0, count = 0; i < lines.length; ++i)
            {
                count += (lines[i].length + 1);

                if (count > selStart)
                {
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
        }
        else
        {
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

    inputScrollSelectionIntoView: function (aInput, aVPercent, aHPercent) {
        let editor = aInput.editor || aInput
            .QueryInterface(Components.interfaces.nsIDOMNSEditableElement).editor;
        let selection = editor.selection;

        aVPercent = typeof aVPercent === "number" ? aVPercent : 50;
        aHPercent = typeof aHPercent === "number" ? aHPercent : 50;

        try {
            selection.QueryInterface(Components.interfaces.nsISelection2)
	        .scrollIntoView(editor.selectionController.SELECTION_ANCHOR_REGION, true, aVPercent, aHPercent);
        } catch ([]) {}
    },

    // ==================== Insertion ==================== //

    openLine: function (aEvent) {
        key.generateKey(aEvent.originalTarget,
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

        for (var i = 0; i < aLines.length; ++i)
        {
            prevCount = count;
            // includes last '\n' (+ 1)
            count += (aLines[i].length + 1);

            if (typeof(startLineNum) == 'undefined' &&
                count > aSelStart)
            {
                startLineNum = i;
                startHeadCount = aSelStart - prevCount;
            }
            if (count > aSelEnd)
            {
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
        if (!aRectangle)
        {
            display.echoStatusBar("Kill ring is empty", 3000);
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
        for (i = 0; i < startLineNum; ++i)
        {
            output += lines[i] + "\n";
        }

        var padHead, padTail;
        for (var j = 0; j < aRectangle.length; ++j, ++i)
        {
            if (i < lines.length)
            {
                padHead = lines[i].slice(0, startHeadCount);
                padTail = lines[i].slice(startHeadCount, lines[i].length);
            }
            else
            {
                padHead = padTail = "";
            }

            if (padHead.length < startHeadCount)
                padHead += new Array(startHeadCount - padHead.length + 1).join(" ");

            output += padHead + aRectangle[j] + padTail + "\n";
        }

        // copy rest line
        for (; i < lines.length; ++i)
        {
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

        if (aIsInsert)
            to = from;

        // ================ process {{ ================ //
        // now we process chars
        var output = "";
        for (i = 0; i < startLineNum; ++i)
        {
            output += lines[i] + "\n";
        }

        var padHead, padTail;
        // replace
        for (i = startLineNum; i <= endLineNum; ++i)
        {
            // kill
            if (aIsKill)
                killedLines.push(lines[i].slice(from, to));

            // replace / delete
            padHead = lines[i].slice(0, from);
            if (padHead.length < from && !aNoExSpace)
                padHead += new Array(from - padHead.length + 1).join(" ");

            padTail = lines[i].slice(to, lines[i].length);
            output += padHead + aReplacement + padTail + "\n";
        }

        // var rectBeginPos = selStart;
        var rectEndPos = output.length - (padTail.length + 1);

        // copy rest line
        for (; i < lines.length; ++i)
        {
            output += lines[i] + "\n";
        }
        // ================ }} process ================ //

        // remove last "\n" and apply
        aInput.value = output.slice(0, output.length - 1);

        // set caret position
        var caretPos = 0;
        if (typeof(aInput.ksMarked) == "number")
        {
            var replaceeLen = to - from;
            var gap = aReplacement.length - replaceeLen;

            if (aIsInsert)
            {
                // just put caret to the original selection start (as in Emacs)
                caretPos = selStart;
            }
            else
            {
                // we need to put caret on [*] position
                if (aInput.ksMarked == selEnd)
                {
                    // [*] selStart <------------- mark (selEnd)
                    // display.prettyPrint("[*] selStart <------------- mark (selEnd)");
                    if (startHeadCount < endHeadCount)
                        caretPos = selStart;
                    else
                        caretPos = selStart + gap;
                }
                else
                {
                    // mark (selStart) -------------> selEnd [*]
                    // display.prettyPrint("mark (selStart) -------------> selEnd [*]");
                    if (startHeadCount < endHeadCount)
                        caretPos = rectEndPos;
                    else
                        caretPos = rectEndPos - aReplacement.length;
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

    /**
     * store <aText> to the system clipboard
     * if selection is true, also store it into the selection
     clipboard (available on most unix system)
     * @param {} aText
     * @param {} selection
     */
    setClipboardText: function (aText, selection) {
        var ss = Components.classes['@mozilla.org/supports-string;1']
            .createInstance(Components.interfaces.nsISupportsString);
        if (!ss)
            return;

        var trans = Components.classes['@mozilla.org/widget/transferable;1']
            .createInstance(Components.interfaces.nsITransferable);
        if (!trans)
            return;

        var clipid = Components.interfaces.nsIClipboard;
        var clip   = Components.classes['@mozilla.org/widget/clipboard;1'].getService(clipid);
        if (!clip)
            return;

        ss.data = aText;
        trans.addDataFlavor('text/unicode');
        trans.setTransferData('text/unicode', ss, aText.length * 2);
        if (selection === true)
            clip.setData(trans, null, clipid.kSelectionClipboard);
        clip.setData(trans, null, clipid.kGlobalClipboard);
    },

    /**
     * Returns the text from the content of the system clipboard
     * or, if selection is true, returns the content of the
     * selection clipboard.
     * @param {} selection
     * @throws Exception
     * @returns {}
     */
    getClipboardText: function (selection) {
        var clip = Components.classes["@mozilla.org/widget/clipboard;1"]
            .getService(Components.interfaces.nsIClipboard);
        if (!clip)
            return null;

        var trans = Components.classes["@mozilla.org/widget/transferable;1"]
            .createInstance(Components.interfaces.nsITransferable);
        if (!trans)
            return null;
        trans.addDataFlavor("text/unicode");

	if (selection == true)
            clip.getData(trans, clip.kSelectionClipboard);
	else
	    clip.getData(trans, clip.kGlobalClipboard);

        var str       = {};
        var strLength = {};

        trans.getTransferData("text/unicode", str, strLength);
        if (str)
            str = str.value.QueryInterface(Components.interfaces.nsISupportsString);

        return str ? str.data.substring(0, strLength.value / 2) : null;
    },

    pushKillRing: function (aText) {
        var textLen = aText.length;

        if (textLen && (this.kill.textLengthMax < 0 || textLen <= this.kill.textLengthMax))
        {
            if (this.kill.ring.length >= this.kill.killRingMax)
            {
                this.kill.ring.pop();
            }
            this.kill.ring.unshift(aText);
        }
    },

    /**
     * Notified when the clipboard content changed
     */
    clipboardChanged: function () {
        try {
            var text = this.getClipboardText();
        } catch (x) {
            util.message("Exception throwed :: " + x);
            return;
        }

        /**
         * User can prevent killring pushing from hook
         * by throwing exception
         */
        try {
            hook.callHook("ClipboardChanged", text);
        } catch (x) {
            return;
        }

        if (!this.kill.ring.length || this.kill.ring.length && text != this.kill.ring[0])
            this.pushKillRing(text);
    },

    copySelectedText: function (aInput) {
        goDoCommand('cmd_copy');
    },

    /**
     * original code from Firemacs
     * http://www.mew.org/~kazu/proj/firemacs/
     * @param {String} text
     * @returns
     */
    insertText: function (text) {
        var command = 'cmd_insertText';
        var controller = document.commandDispatcher.getControllerForCommand(command);

        if (controller && controller.isCommandEnabled(command))
        {
            controller = controller.QueryInterface(Components.interfaces.nsICommandController);
            var params = Components.classes['@mozilla.org/embedcomp/command-params;1'];
            params = params.createInstance(Components.interfaces.nsICommandParams);
            params.setStringValue('state_data', text);
            controller.doCommandWithParams(command, params);
        }
    },

    insertKillRingText: function (aInput, aIndex, aSelect) {
        let { scrollLeft, scrollTop } = aInput;

        if (aIndex < 0)
        {
            // reset to the original text
            aInput.value = this.kill.originalText;
            aInput.selectionStart = aInput.selectionEnd = this.kill.originalSelStart;
        }
        else
        {
            // normal insersion
            aInput.value = this.kill.originalText.slice(0, this.kill.originalSelStart)
                + this.kill.ring[aIndex]
                + this.kill.originalText.slice(this.kill.originalSelEnd, this.kill.originalText.length);
            if (aSelect)
            {
                aInput.selectionStart = this.kill.originalSelStart;
                aInput.selectionEnd = aInput.selectionStart + this.kill.ring[aIndex].length;
            }
            else
            {
                aInput.selectionStart = this.kill.originalSelStart + this.kill.ring[aIndex].length;
                aInput.selectionEnd = aInput.selectionStart;
            }
        }

        if (aInput.nodeName === "html:input" && !scrollLeft && !scrollTop)
            this.inputScrollSelectionIntoView(aInput);
        else
        {
            aInput.scrollLeft = scrollLeft;
            aInput.scrollTop  = scrollTop;
        }
    },

    /**
     *
     * @param {KeyBoardEvent} aEvent
     */
    yank: function (aEvent, aArg) {
        var i     = aArg || 0;
        var input = aEvent.originalTarget;

        var clipboardText = command.getClipboardText();

        if (clipboardText === null || input.localName === "html")
        {
            goDoCommand('cmd_paste');
            return;
        }

        if (!clipboardText && !command.kill.ring.length)
        {
            display.echoStatusBar("Kill ring empty", 2000);
            return;
        }

        // copied outside the Firefox
        if (command.kill.ring.length === 0 || clipboardText !== command.kill.ring[0])
        {
            if (command.kill.textLengthMax >= 0 && clipboardText.length > command.kill.textLengthMax)
            {
                command.insertText(clipboardText);
                return;
            }

            command.pushKillRing(clipboardText);
        }

        command.kill.originalText     = input.value;
        command.kill.originalSelStart = input.selectionStart;
        command.kill.originalSelEnd   = input.selectionEnd;
        i = Math.min(i, command.kill.ring.length - 1);
        command.kill.index = i;

        command.insertKillRingText(input, i);
    },

    /**
     *
     * @param {KeyBoardEvent} aEvent
     */
    yankPop: function (aEvent) {
        var input = aEvent.originalTarget;
        var lastFunc = key.lastFunc;

        if ((lastFunc !== command.yank && lastFunc !== command.yankPop)
            || (lastFunc === command.yankPop && command.kill.popFailed))
        {
            display.echoStatusBar("Previous command was not a yank", 2000);
            command.kill.popFailed = true;
            return;
        }
        command.kill.popFailed = false;

        if (!command.kill.ring.length)
        {
            display.echoStatusBar("Kill ring is empty", 2000);
            command.kill.originalText = null;
            return;
        }

        command.kill.index++;
        if (command.kill.index >= command.kill.ring.length)
        {
            command.kill.index = 0;
        }

        command.insertKillRingText(input, command.kill.index, true);

        display.echoStatusBar(util.format("Yank pop (%s / %s)",
                                          command.kill.index + 1, command.kill.ring.length));
    },

    killLine: function (aEvent) {
        if (this.marked(aEvent))
            this.resetMark(aEvent);

        goDoCommand('cmd_selectEndLine');
        this.copySelectedText(aEvent.originalTarget);
        goDoCommand('cmd_deleteToEndOfLine');
    },

    copyRegion: function (aEvent) {
        this.copySelectedText(aEvent.originalTarget);
        this.resetMark(aEvent);
    },

    cutRegion: function (aEvent) {
        goDoCommand('cmd_copy');
        goDoCommand("cmd_delete");
        command.resetMark(aEvent);
    },

    // ==================== Select ==================== //

    selectAll: function (ev) {
        let orig = ev.originalTarget || ev.target;
        goDoCommand('cmd_moveBottom');
        goDoCommand('cmd_selectTop');
        if (orig)
            orig.ksMarked = orig.selectionEnd;
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
        if (this.marked(aEvent))
            goDoCommand('cmd_selectCharPrevious');
        else
            goDoCommand('cmd_charPrevious');
    },

    nextChar: function (aEvent) {
        if (this.marked(aEvent))
            goDoCommand('cmd_selectCharNext');
        else
            goDoCommand('cmd_charNext');
    },

    beginLine: function (aEvent) {
        if (this.marked(aEvent))
            goDoCommand('cmd_selectBeginLine');
        else
            goDoCommand('cmd_beginLine');
    },

    endLine: function (aEvent) {
        if (this.marked(aEvent))
            goDoCommand('cmd_selectEndLine');
        else
            goDoCommand('cmd_endLine');
    },

    // aliases
    nextWord: function (aEvent) {
        this.forwardWord(aEvent);
    },

    previousWord: function (aEvent) {
        this.backwardWord(aEvent);
    },

    // Word manipulation {{ ===================================================== //

    wordChars: "a-zA-Z",

    getForwardWord: function (aString, aCurrentPos) {
        let matched = aString.slice(aCurrentPos).match(
            util.format("[^%s]*[%s]+|[^%s]+",
                        this.wordChars, this.wordChars, this.wordChars)
        );

        return (matched || {0: null})[0];
    },

    getBackwardWord: function (aString, aCurrentPos) {
        let matched = aString.slice(0, aCurrentPos).match(
            util.format("[%s]+[^%s]*$|[^%s]+$",
                        this.wordChars, this.wordChars, this.wordChars)
        );

        return (matched || {0: null})[0];
    },

    processWord: function (aInput, aSubWordGetter, aProcess) {
        var input    = aInput;
        var selected = this.marked({originalTarget : aInput});

        var oldScrollTop  = input.scrollTop;
        var oldScrollLeft = input.scrollLeft;

        var current = input.selectionEnd;
        var text    = input.value;
        var subword = aSubWordGetter.call(this, text, current);

        if (subword)
        {
            aProcess.call(this, input, subword, selected, current);
            // recover scroll position
            if (aInput.nodeName === "html:input" && !oldScrollLeft && !oldScrollTop)
                this.inputScrollSelectionIntoView(input);
            else
            {
                input.scrollLeft = oldScrollLeft;
                input.scrollTop  = oldScrollTop;
            }
        }
    },

    processForwardWord: function (aInput, aFilter) {
        command.processWord(aInput, command.getForwardWord,
                            function (input, subword, selected, current) {
                                var wordEnd = current + subword.length;
                                var text    = input.value;
                                subword = aFilter(subword);

                                input.value = text.slice(0, current) + subword + text.slice(wordEnd);
                                input.setSelectionRange(wordEnd, wordEnd);
                            });
    },

    processBackwardWord: function (aInput, aFilter) {
        command.processWord(aInput, command.getBackwardWord,
                            function (input, subword, selected, current) {
                                var wordBegin = current - subword.length;
                                var text    = input.value;
                                subword = aFilter(subword);

                                input.value = text.slice(0, wordBegin) + subword + text.slice(current);
                                input.setSelectionRange(wordBegin, wordBegin);
                            });
    },

    capitalizeWord: function (aString) {
        var spaces = aString.match(util.format("^[^%s]*", command.wordChars));
        var wordBegin = !!spaces ? spaces[0].length : 0;
        return aString.slice(0, wordBegin)
            + aString.charAt(wordBegin).toUpperCase()
            + aString.slice(wordBegin + 1).toLowerCase();
    },

    // ========================================================================== //

    // Behavior of these methods are different from Emacs
    // But multibyte language handlings are pretty good.

    backwardWord: function (aEvent) {
        if (this.marked(aEvent))
            goDoCommand('cmd_selectWordPrevious');
        else
            goDoCommand('cmd_wordPrevious');
    },

    forwardWord: function (aEvent) {
        if (this.marked(aEvent))
            goDoCommand('cmd_selectWordNext');
        else
            goDoCommand('cmd_wordNext');
    },

    deleteBackwardWord: function (aEvent) {
        goDoCommand("cmd_deleteWordBackward");
    },

    deleteForwardWord: function (aEvent) {
        goDoCommand("cmd_deleteWordForward");
    },

    // Behavior of these methods it's name end with *Ks is
    // similar to Emacs. But the multibyte charactors will not be
    // processed properly.

    forwardWordKs: function (aEvent) {
        this.processWord(aEvent.originalTarget, this.getForwardWord,
                         function (input, subword, selected, current) {
                             var wordEnd = current + subword.length;

                             if (!selected)
                                 input.selectionStart = wordEnd;
                             input.selectionEnd = wordEnd;
                         });
    },

    backwardWordKs: function (aEvent) {
        this.processWord(aEvent.originalTarget, this.getBackwardWord,
                         function (input, subword, selected, current) {
                             var wordEnd = current - subword.length;

                             if (!selected)
                                 input.selectionEnd = wordEnd;
                             input.selectionStart = wordEnd;
                         });
    },

    deleteForwardWordKs: function (aEvent) {
        this.processWord(aEvent.originalTarget, this.getForwardWord,
                         function (input, subword, selected, current) {
                             var wordEnd = current + subword.length;
                             var text    = input.value;

                             input.value = text.slice(0, current) + text.slice(wordEnd);
                             input.setSelectionRange(current, current);

                             this.resetMark(aEvent);
                         });
    },

    deleteBackwardWordKs: function (aEvent) {
        this.processWord(aEvent.originalTarget, this.getBackwardWord,
                         function (input, subword, selected, current) {
                             var wordEnd = current - subword.length;
                             var text    = input.value;

                             input.value = text.slice(0, wordEnd) + text.slice(current);
                             input.setSelectionRange(wordEnd, wordEnd);

                             this.resetMark(aEvent);
                         });
    },

    // Transformation {{ ======================================================== //

    upcaseForwardWord: function (aEvent) {
        command.processForwardWord(aEvent.originalTarget, function (str) str.toUpperCase());
    },

    upcaseBackwardWord: function (aEvent) {
        command.processBackwardWord(aEvent.originalTarget, function (str) str.toUpperCase());
    },

    downcaseForwardWord: function (aEvent) {
        command.processForwardWord(aEvent.originalTarget, function (str) str.toLowerCase());
    },

    downcaseBackwardWord: function (aEvent) {
        command.processBackwardWord(aEvent.originalTarget, function (str) str.toLowerCase());
    },

    capitalizeForwardWord: function (aEvent) {
        command.processForwardWord(aEvent.originalTarget, this.capitalizeWord);
    },

    capitalizeBackwardWord: function (aEvent) {
        command.processBackwardWord(aEvent.originalTarget, this.capitalizeWord);
    },

    wordCommand: function (aEvent, aArg, aForward, aBackward)  {
        if (!aArg)
        {
            aForward.call(command, aEvent);
        }
        else if (aArg < 0)
        {
            aBackward.call(command, aEvent);
        }
        else
        {
            for (let i = 0; i < aArg; ++i)
            {
                aForward.call(command, aEvent);
            }
        }
    },

    // }} ======================================================================= //

    // }} ======================================================================= //

    // ==================== Complete move ==================== //

    moveTop: function (aEvent) {
        this.inputHandleKey(aEvent,
                            'cmd_moveTop',
                            'cmd_selectTop',
                            KeyEvent.DOM_VK_HOME);
    },

    moveBottom: function (aEvent) {
        this.inputHandleKey(aEvent,
                            'cmd_moveBottom',
                            'cmd_selectBottom',
                            KeyEvent.DOM_VK_END);
    },

    // ==================== Mark ====================
    // original code from Firemacs
    // http://www.mew.org/~kazu/proj/firemacs/

    // predicative
    marked: function (ev) {
        let orig = ev.originalTarget || ev.target;

        return (orig && (typeof orig.ksMarked === 'number' ||
                         typeof orig.ksMarked === 'boolean'));
    },

    setMark: function (ev) {
        let orig = ev.originalTarget || ev.target;

        if (orig) {
            if (typeof orig.selectionStart === 'number')
                orig.ksMarked = orig.selectionStart;
            else
                orig.ksMarked = true;
        }

        display.echoStatusBar('Mark set', 2000);
    },

    resetMark: function (ev) {
        let orig = ev.originalTarget || ev.target;

        if (!orig)
            return;

        let mark = orig.ksMarked;

        if (mark === void 0) {
            try {
                goDoCommand('cmd_selectNone');
            } catch (x) {}

            return;
        }

        orig.ksMarked = null;

        try {
            if (typeof orig.selectionStart === 'number' && orig.selectionStart >= 0) {
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
        } catch (e) {}
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

    restartApp:
    function restartApp() {
        const nsIAppStartup = Ci.nsIAppStartup;

        let os         = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
        let cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);

        os.notifyObservers(cancelQuit, "quit-application-requested", null);
        if (cancelQuit.data)
            return;

        os.notifyObservers(null, "quit-application-granted", null);
        let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        let windows = wm.getEnumerator(null);

        while (windows.hasMoreElements())
        {
            let win = windows.getNext();
            if (("tryToClose" in win) && !win.tryToClose())
                return;
        }

        Cc["@mozilla.org/toolkit/app-startup;1"].getService(nsIAppStartup)
            .quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);
    },

    message: KeySnail.message
};
