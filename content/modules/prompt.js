/**
 * @fileOverview Provides prompt system which get inputs from user and process it
 * @name prompt.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

// flags
var HIDDEN = 1;
var IGNORE = 2;
var ICON   = 4;

var prompt = function () {
    /**
     * @private
     */

    const Cc = Components.classes;
    const Ci = Components.interfaces;

    // defalut key settings
    var actionKeys      = {};
    actionKeys.read     = {};
    actionKeys.selector = {};

    var currentPromptContext;

    var readerKeymap;
    var selectorKeymap;
    var selectorTranslator;

    // ==================== Common objects between each context ==================== //

    var sessionSuspended = false;

    // DOM Objects
    var promptbox;
    var container;
    var leftLabel;
    var rightLabel;
    var textbox;
    var listbox;

    // Callbacks
    var currentCallback;
    var currentUserArg;

    // function which is called in the beginning of the handleKeyPres*()
    var userOnChange;
    var userOnFinish;
    var beforeSelection;
    var afterSelection;

    // event listener remover
    var eventListenerRemover;

    // Saved last user focsed element
    var savedFocusedElement;
    function savedFocusedElementLives() {
        try {
            var tryToAccessProperty = savedFocusedElement.focus;
            return true;
        } catch (x) {
            savedFocusedElement = null;
        }
        return false;
    }

    var cellStylist;

    // ==================== Constants ==================== //

    // -------------------- Type -------------------- //

    const TYPE_NONE     = -1;
    const TYPE_READ     = 0;
    const TYPE_SELECTOR = 1;

    // -------------------- State -------------------- //

    const SELECTOR_STATE_CANDIDATES = 0;
    const SELECTOR_STATE_ACTION     = 1;

    // ==================== Options ==================== //

    var options = {
        substrMatch         : true,
        ignoreDuplication   : true,
        useMigemo           : false,
        migemoMinWordLength : 2,
        listboxMaxRows      : 15,
        historyMax          : 15,
        displayDelayTime    : 200,
        actionsListStyle    : ["text-decoration: underline;"]
    };

    // ==================== Current State ==================== //

    var type = TYPE_NONE;

    var historyHolder;

    // -------------------- prompt.selector specific -------------------- //

    var selectorStatus;
    var selectorFilter;
    var selectorContext;
    var promptEditMode;

    // In action view, we do not want stylist to work.
    var selectorStylist;

    var cyclicMode = false;

    function createSelectorContext() {
        return {
            compIndex        : null,
            compIndexList    : null,

            wholeList        : null,
            wholeListIndex   : null,

            currentList      : null,
            currentIndexList : null,

            listHeader       : null,
            listStyle        : null,
            listWidth        : null,
            flags            : null,
            currentRegexp    : "",
            textboxValue     : "",
            selectionStart   : 0
        };
    }

    // -------------------- common -------------------- //

    var selectedItemIndex;      // selected index of the

    // matched list
    var compIndex;
    var compIndexList;
    // whole list (all candidates)
    var wholeList;
    var wholeListIndex;

    var listboxRows;            // actual listbox row count
    var listboxColumns;         // actual listbox column count

    // ListBox settings
    var currentList;
    var currentIndexList;
    var gFlags;
    var listHeader;
    var listStyle;
    var listWidth;

    // ============================== prompt common functions ============================== //

    function $(aId) {
        return document.getElementById(aId);
    }

    function $E(aName, aAttributes) {
        let elem = document.createElement(aName);

      for (let [k, v] of util.keyValues(aAttributes))
            elem.setAttribute(k, v);

        return elem;
    }

    function implant(a, b) {
        for (let [k, v] of util.keyValues(b))
            a[k] = v;
    }

    function implantAll(a, b) {
        for (let k of util.getAllPropertyNames(b)) {
            try {
                a[k] = b[k];
            } catch (_) {}
        }
    }

    /**
     * Combine two object. Implant b to a.
     * @param {} a
     * @param {} b
     * @returns {}
     */
    function combineObject(a, b) {
        var newObject = {};
        var key;

        for (let [key, value] of util.keyValues(a))
            newObject[key] = value;

        for (let [key, value] of util.keyValues(b))
            newObject[key] = value;

        return newObject;
    }

    function setCursorPos(n) {
        try {
            textbox.selectionStart = textbox.selectionEnd = n;
        } catch (x) { Components.utils.reportError(x); };
    }

    function getActualCols(aCols) {
        if (gFlags)
            for (let flag of gFlags)
                if (flag & (HIDDEN | ICON)) aCols--;
        return aCols;
    }

    function getNextIndex(aCurrent, aDirection, aMin, aMax, aRing) {
        var index = aCurrent + aDirection;
        if (index < aMin)
            index = aRing ? aMax - 1 : aMin;
        if (index >= aMax)
            index = aRing ? 0 : aMax - 1;

        return index;
    }

    function isMultipleList(aList) {
        return (typeof aList === 'object' && typeof aList[0] === 'object');
    }

    function getListText(aList, aIndex, aCellNum) {
        if (aCellNum === undefined)
            aCellNum = 0;

        return isMultipleList(aList) ? aList[aIndex][aCellNum] : aList[aIndex];
    }

    function isFlagOn(i, aFlag) {
        return (gFlags && (gFlags[i] & aFlag));
    }

    // ============================== common DOM manipulation ============================== //

    function setLabel(aItem, aLabel) {
        try {
            aItem.setAttribute("label", aLabel);
        } catch (_) {
            try {
                aItem.setAttribute("label", Object.prototype.toString.call(aLabel));
            } catch (_) {}
        }
    }

    function setTooltip(aRow, aTooltip) {
        aRow.setAttribute("tooltiptext", aTooltip);
    }

    function setColumns(aColumn) {
        if (gFlags)
        {
            for (let flag of gFlags)
            {
                if (flag & (HIDDEN | ICON))
                    aColumn--;
            }
        }

        removeAllChilds(listbox);

        var item;
        var head = document.createElement("listhead");
        var cols = document.createElement("listcols");

        for (var i = 0; i < aColumn; ++i)
        {
            if (listHeader)
            {
                item = document.createElement("listheader");
                item.flex = listWidth ? listWidth[i] : 1;
                item.setAttribute("label", listHeader[i]);
                head.appendChild(item);
            }

            item = document.createElement("listcol");
            item.flex = listWidth ? listWidth[i] : 1;

            if (listWidth)
                item.setAttribute("width", listWidth[i].toString() + "%");
            else
                item.setAttribute("width", (100 / aColumn).toString() + "%");

            cols.appendChild(item);
        }

        if (listHeader)
            listbox.appendChild(head);

        listbox.appendChild(cols);

        listboxColumns = aColumn;
    }

    function setRows(aRow) {
        listboxRows = (aRow < options.listboxMaxRows) ? aRow : options.listboxMaxRows;
        listbox.setAttribute("rows", listboxRows);
    }

    function removeAllChilds(aElement) {
        while (aElement.hasChildNodes())
            aElement.removeChild(aElement.firstChild);
    }

    function getNextVisibleColIndex(aCurrentIndex) {
        if (!gFlags)
            return aCurrentIndex;

        for (var i = aCurrentIndex + 1; i < gFlags.length; ++i)
            if (!(gFlags[i] & HIDDEN))
                break;
        return i;
    }

    function getFirstTextColIndex(aFlags) {
        if (!aFlags)
            return 0;

        for (var i = 0; i < aFlags.length; ++i)
            if (!(aFlags[i] & (HIDDEN | ICON)))
                break;
        return i;
    }

    function getCellValue(aRowData, i) {
        // this function *MUST* return string
        // null, undefined, integer and other object may cause exception

        if (typeof aRowData[i] === "function")
            return aRowData[i].call(null, aRowData) || "";
        else
            return aRowData[i] || "";
    }

    function createRow(aRowData) {
        let row = document.createElement("listitem");

        let cell;

        // i: actual column's index
        // j: visible column's index
        let i, j;
        for (i = 0, j = 0; i < aRowData.length; ++i)
        {
            if (isFlagOn(i, HIDDEN))
                continue;

            cell = document.createElement("listcell");

            if (isFlagOn(i, ICON))
            {
                cell.setAttribute("class", "listcell-iconic");
                cell.setAttribute("image", getCellValue(aRowData, i));
                i = getNextVisibleColIndex(i);
            }

            let style = "";
            if (i < aRowData.length)
            {
                setLabel(cell, getCellValue(aRowData, i));

                // column specific style
                if (listStyle && j < listStyle.length && listStyle[j])
                    style += listStyle[j];

                if (cellStylist)
                {
                    // cell specific style
                    let cellStyle = cellStylist(aRowData, i, wholeList);
                    if (cellStyle)
                        style += cellStyle;
                }
            }

            if (style)
                cell.setAttribute("style", style);

            row.appendChild(cell);
            ++j;
        }

        return row;
    }

    function applyRow(aRow, aRowData) {
        let cell = aRow.firstChild;

        // i: actual column's index
        // j: visible column's index
        let i, j;
        for (i = 0, j = 0; i < aRowData.length; ++i)
        {
            if (isFlagOn(i, HIDDEN))
                continue;

            if (isFlagOn(i, ICON))
            {
                cell.setAttribute("class", "listcell-iconic");
                cell.setAttribute("image", getCellValue(aRowData, i));
                i = getNextVisibleColIndex(i);
            }
            else
                cell.removeAttribute("class");

            let style = "";
            if (i < aRowData.length)
            {
                setLabel(cell, getCellValue(aRowData, i));

                // column specific style
                if (listStyle && j < listStyle.length && listStyle[j])
                    style += listStyle[j];

                if (cellStylist)
                {
                    // cell specific style
                    let cellStyle = cellStylist(aRowData, i, wholeList);
                    if (cellStyle)
                        style += cellStyle;
                }
            }

            // if (style) <- We have to clear the style. So this if statement is not needed.
            cell.setAttribute("style", style);

            cell = cell.nextSibling;
            ++j;
        }
    }

    function setListBoxSelection(aIndex) {
        let currentIndex;
        let currentRow;

        if (beforeSelection || afterSelection)
        {
            if (selectorStatus === SELECTOR_STATE_CANDIDATES)
            {
                currentIndex = wholeListIndex;
                currentRow   = wholeList[currentIndex];
            }
            else
            {
                currentIndex = selectorContext[SELECTOR_STATE_CANDIDATES].wholeListIndex;
                currentRow   = selectorContext[SELECTOR_STATE_CANDIDATES].wholeList[currentIndex];
            }
        }

        if (beforeSelection) {
            let args = {
                row : currentRow,
                i   : currentIndex
            };

            try {
                beforeSelection(args);
            } catch (_) {}

            // user can override the value of `i'
            if (typeof args.nextIndex === "number")
                aIndex = args.nextIndex;
        }

        var center = Math.round(listboxRows / 2);
        var pos;
        var listLen = currentIndexList ? currentIndexList.length : currentList.length;

        if (listLen <= listboxRows)
        {
            // just change the selected index of the listbox
            listbox.currentIndex = listbox.selectedIndex = aIndex;

            if (cellStylist)
            {
                // we have to refresh the styles
                setupList(0, aIndex);
            }

            return;
        }

        if (aIndex <= center)
            setupList(0, aIndex);
        else if (aIndex >= listLen - center)
            setupList(listLen - listboxRows, listboxRows - (listLen - aIndex));
        else
            setupList(aIndex - center, center);

        if (afterSelection) {
            try {
            afterSelection({row: currentRow, i: currentIndex});
            } catch (_) {}
        }
    }

    function setupList(aOffset, aPos) {
        if (currentIndexList)
            setListBoxFromIndexList(currentList, currentIndexList, aOffset);
        else
            setListBoxFromStringList(currentList, aOffset);

        // set selection of the listbox
        listbox.currentIndex = listbox.selectedIndex = aPos;
    }

    function setListBoxFromStringList(aList, aOffset) {
        setListBoxGeneral(aList, aOffset, aList.length,
                          function (i) aList[i],
                          function () {
                              currentList      = aList;
                              currentIndexList = null;
                          });
    }

    function setListBoxFromIndexList(aList, aIndexList, aOffset) {
        setListBoxGeneral(aList, aOffset, aIndexList.length,
                          function (i) aList[aIndexList[i]],
                          function () {
                              currentList      = aList;
                              currentIndexList = aIndexList;
                          });
    }

    function setListBoxGeneral(aGeneralList, aOffset, aLength, itemRetriever, onFinish) {
        aOffset = aOffset || 0;
        var count = Math.min(options.listboxMaxRows, aLength) + aOffset;
        var row;

        let hasChildNodes = listbox.hasChildNodes();
        let multiple      = isMultipleList(aGeneralList);
        let needsRefresh  = !hasChildNodes;

        if (type === TYPE_READ)
        {
            // prompt.selector does not have to care of the columns count changes.
            // so this part is prompt.read, prompt.reader only.

            let newCols  = multiple ? getActualCols(aGeneralList[0].length) : 1;
            let oldCols  = 1;

            let firstChild = listbox.childNodes[0];

            if (hasChildNodes && firstChild.localName === "listcols")
                oldCols = firstChild.childNodes.length;

            if (!needsRefresh)
            {
                needsRefresh = (newCols !== oldCols);
            }
        }

        if (needsRefresh)
        {
            // set up the new listbox
            setColumns(multiple ? itemRetriever(0).length : 1);

            for (var i = aOffset; i < count; ++i)
            {
                row = createRow(multiple ? itemRetriever(i) : [itemRetriever(i)]);
                listbox.appendChild(row);
            }
        }
        else
        {
            // use listbox which has been already created
            let childs = listbox.childNodes;

            let i = aOffset, j = 0;

            // skip listcols, listhead, ...
            while (childs[j].nodeName !== "listitem")
                j++;

            for (; i < count; ++i, ++j)
            {
                if (j < childs.length)
                {
                    // use already created one
                    row = childs[j];
                    applyRow(row, multiple ? itemRetriever(i) : [itemRetriever(i)]);
                }
                else
                {
                    // ok, we should create a new one
                    row = createRow(multiple ? itemRetriever(i) : [itemRetriever(i)]);

                    listbox.appendChild(row);
                }
            }

            // remove stubs
            while (j < childs.length)
                listbox.removeChild(listbox.lastChild);
        }

        if (typeof onFinish === "function")
            onFinish();
    }

    // ============================== prompt.selector main ============================== //

    var oldTextLength = 0;
    var delayedCommandTimeout;
    var createCompletionListPending;
    var createCompletionListQueued;
    var currentRegexp;

    /**
     * Update the list when user input / delete the text
     * @param {KeyBoardEvent} aEvent event which called this handler
     */
    function handleKeyUpSelector(aEvent) {
        if (sessionSuspended)
            return;

        /**
         * Without this cause exception about selection
         */
        if (!currentCallback)
            return;

        if (textbox.value.length !== oldTextLength)
        {
            if (delayedCommandTimeout) {
                clearTimeout(delayedCommandTimeout);
                delayedCommandTimeout = null;
            }

            // add delay
            delayedCommandTimeout = setTimeout(
                function callback() {
                    delayedCommandTimeout = null;

                    if (createCompletionListPending)
                    {
                        createCompletionListQueued = true;
                        return;
                    }

                    createCompletionListPending = true;
                    createCompletionList();
                    createCompletionListPending = false;

                    // jobs added while processing createCompletionList
                    if (createCompletionListQueued)
                    {
                        createCompletionListQueued = false;
                        delayedCommandTimeout = setTimeout(() => callback(), options.displayDelayTime);
                    }
                }, options.displayDelayTime);
        }

        oldTextLength = textbox.value.length;

        if (typeof userOnChange === "function")
        {
            let currentIndex;
            let currentRow;

            if (selectorStatus === SELECTOR_STATE_CANDIDATES)
            {
                currentIndex = wholeListIndex;
                currentRow   = wholeList[currentIndex];
            }
            else
            {
                currentIndex = selectorContext[SELECTOR_STATE_CANDIDATES].wholeListIndex;
                currentRow   = selectorContext[SELECTOR_STATE_CANDIDATES].wholeList[currentIndex];
            }

            let arg = {
                textbox : textbox,
                event   : aEvent,
                finish  : self.finish,
                index   : currentIndex,
                row     : currentRow
            };

            userOnChange(arg);
        }
    }

    /**
     * KeyPress Event handler for prompt.selector
     * @param {KeyBoardEvent} aEvent event which called this handler
     */
    function handleKeyPressSelector(aEvent) {
        if (sessionSuspended)
            return;

        if (promptEditMode &&
            key.isDisplayableKey(aEvent) &&
            !key.isMetaKey(aEvent) &&
            !key.isControlKey(aEvent))
        {
            return;
        }

        var keyStr = key.keyEventToString(aEvent);

        var stopEventPropagation = true;
        var keymap  = selectorKeymap;
        var command = keymap[keyStr] || "";

        // gFlags is the global value
        var opts;

        [command, opts] = command.split(",");
        if (!opts)
            opts = "";

        // convert local command name to prompt-nth-action-*
        if (command in selectorTranslator)
            command = selectorTranslator[command];

        function uniq(str) {
            var found   = {};
            var uniqStr = "";

            for (let c of str)
            {
                if (found[c])
                    continue;

                uniqStr += c;
                found[c] = true;
            }

            return uniqStr;
        }

        // if additional opts are found
        {
            let tmp = command.split(",");
            command = tmp[0];
            opts  += tmp[1] || "";
        }

        var next = 0;

        var continuousMode = false;

        for (let opt of uniq(opts))
        {
            switch (opt)
            {
            case "c":
                continuousMode = true;
                break;
            case "n":
                next = 1;
                break;
            case "p":
                next = -1;
                break;
            }
        }

        var match;
        if (command && (match = command.match("^prompt-nth-action-(.*)")))
        {
            aEvent.preventDefault();
            aEvent.stopPropagation();

            var actions = selectorContext[SELECTOR_STATE_ACTION];
            var num = parseInt(match[1]) - 1;

            if (selectorStatus == SELECTOR_STATE_CANDIDATES)
                actions.wholeListIndex = num;
            else
                wholeListIndex = num; // in action state

            if (num < 0 || num >= actions.wholeList.length)
                self.finish(true);
            else
                self.finish(false, continuousMode);

            stopEventPropagation = false;
        }

        switch (command)
        {
        case "prompt-toggle-edit-mode":
            self.toggleEditMode();
            break;
        case "prompt-cancel":
            self.finish(true);
            break;
        case "prompt-decide":
            self.finish(false, continuousMode);
            break;
        case "prompt-continuous-decide":
            self.finish(false, true);
            break;
        case "prompt-continuous-decide-and-next":
            self.finish(false, true);
        case "prompt-next-line":
        case "prompt-next-completion":
            next = 1;
            break;
        case "prompt-continuous-decide-and-previous":
            self.finish(false, true);
        case "prompt-previous-line":
        case "prompt-previous-completion":
            next = -1;
            break;
        case "prompt-next-page":
            next = listboxRows;
            break;
        case "prompt-previous-page":
            next = -listboxRows;
            break;
        case "prompt-beginning-of-candidates":
            setListBoxIndex(0);
            setListBoxSelection(0);
            break;
        case "prompt-end-of-candidates":
            var lastIndex = (currentIndexList ? currentIndexList.length : currentList.length) - 1;
            setListBoxIndex(lastIndex);
            setListBoxSelection(lastIndex);
            break;
        case "prompt-select-action":
            switchSelectorContext();
            break;
        case "prompt-display-keymap-help":
            self.toggleSelectorHelpDisplay();
            break;
        default:
            stopEventPropagation = false;
            break;
        }

        if (next !== 0)
        {
            selectNextCompletion(next, cyclicMode);
        }

        if (stopEventPropagation)
        {
            aEvent.preventDefault();
            aEvent.stopPropagation();
        }
    }

    function handleMouseDownSelector(aEvent) {
        if (sessionSuspended)
            return;

        var before = listbox.selectedIndex;

        setTimeout(
            function () {
                util.stopEventPropagation(aEvent);

                var after = listbox.selectedIndex;
                if ((after - before) != 0)
                    selectNextCompletion(after - before, cyclicMode);

                textbox.focus();

                if (aEvent.button === 2)
                {
                    $("keysnail-prompt-menu").openPopupAtScreen(aEvent.screenX, aEvent.screenY, true);
                }
            }, 0);
    }

    function handleMouseScrollSelector(aEvent) {
        if (sessionSuspended)
            return;

        selectNextCompletion(aEvent.detail < 0 ? -1 : 1, cyclicMode);
    }

    function switchSelectorContext(opts) {
        let from, to;

        switch (selectorStatus)
        {
        case SELECTOR_STATE_CANDIDATES:
            from = SELECTOR_STATE_CANDIDATES;
            to   = SELECTOR_STATE_ACTION;
            cellStylist = null;
            break;
        case SELECTOR_STATE_ACTION:
            from = SELECTOR_STATE_ACTION;
            to   = SELECTOR_STATE_CANDIDATES;
            cellStylist = selectorStylist;
            break;
        }

        selectorStatus = to;

        if (delayedCommandTimeout) {
            clearTimeout(delayedCommandTimeout);
            delayedCommandTimeout = null;
        }

        // save current context
        saveSelectorContext(selectorContext[from]);
        // change current context
        restoreSelectorContext(selectorContext[to]);

        updateSelector(selectorContext[to], opts);
    }

    function saveSelectorContext(aTo) {
        aTo.textboxValue     = textbox.value;
        aTo.selectionStart   = textbox.selectionStart;

        aTo.compIndex        = compIndex;
        aTo.compIndexList    = compIndexList;
        aTo.currentList      = currentList;
        aTo.currentIndexList = currentIndexList;
        aTo.wholeList        = wholeList;
        aTo.wholeListIndex   = wholeListIndex;
        aTo.flags            = gFlags;
        aTo.listHeader       = listHeader;
        aTo.listStyle        = listStyle;
        aTo.listWidth        = listWidth;
        aTo.currentRegexp    = currentRegexp;
    }

    function restoreSelectorContext(aFrom) {
        textbox.value          = aFrom.textboxValue;
        textbox.selectionStart = aFrom.selectionStart;

        compIndex              = aFrom.compIndex;
        compIndexList          = aFrom.compIndexList;
        currentList            = aFrom.currentList;
        currentIndexList       = aFrom.currentIndexList;
        wholeList              = aFrom.wholeList;
        wholeListIndex         = aFrom.wholeListIndex;
        gFlags                 = aFrom.flags;
        listHeader             = aFrom.listHeader;
        listStyle              = aFrom.listStyle;
        listWidth              = aFrom.listWidth;
        oldTextLength          = textbox.value.length;
        currentRegexp          = aFrom.currentRegexp;
    }

    function updateSelector(ctx, opts) {
        opts = opts || {};

        removeAllChilds(listbox);

        let index;
        let rows;

        if (ctx.compIndexList === null)
        {
            // create list of whole completion
            setListBoxFromStringList(ctx.wholeList);
            rows = ctx.wholeList.length;
            setRows(rows);
            if (typeof opts.index === "number")
                ctx.wholeListIndex = opts.index;
            index = wholeListIndex = ctx.wholeListIndex = Math.min(Math.max(0, ctx.wholeListIndex), rows - 1);
        }
        else
        {
            setListBoxFromIndexList(ctx.wholeList, ctx.compIndexList);
            rows = ctx.compIndexList.length;
            setRows(rows);
            if (typeof opts.index === "number")
                ctx.compIndex = opts.index;
            index = compIndex = ctx.compIndex = Math.min(Math.max(0, ctx.compIndex), rows - 1);
        }

        if (listbox.hidden)
            listbox.hidden = false;

        selectorDisplayStatusbarLine(currentRegexp, index, rows);
        setListBoxSelection(index);
    }

    function setListBoxIndex(aIndex) {
        if (compIndexList)
        {
            compIndex = aIndex;
            wholeListIndex = compIndexList[aIndex];
        }
        else
        {
            wholeListIndex = aIndex;
        }
    }

    function selectorDisplayStatusbarLine(aQuery, aIndex, aTotalLength) {
        if (aIndex < 0)
        {
            display.echoStatusBar("No match for [" + aQuery + "]");
        }
        else
        {
            display.echoStatusBar(util.format("Completion Regexp Match for [%s] (%s / %s)",
                                              aQuery, (aIndex + 1), aTotalLength));
        }
    }

    function setSelectorContextMenu(aActions) {
        var context = selectorContext[SELECTOR_STATE_ACTION];

        var contextMenu = $("keysnail-prompt-menu");
        removeAllChilds(contextMenu);

        if (typeof aActions === "function")
            aActions = [[aActions, "Default callback"]];

        for (let [i, action] of util.keyValues(aActions))
        {
            var item = document.createElement("menuitem");
            item.setAttribute("label", action[1]);

            if (action[2] && (action[2].split(",")[1] || "").indexOf("c") !== -1)
                item.addEventListener("command", (ev) => prompt.doNthAction(i, true), false);
            else
                item.addEventListener("command", (ev) => prompt.doNthAction(i), false);

            contextMenu.appendChild(item);
        }
    }

    function setSelectorKeymapHelp(actions, localKeymap) {
        let listbox = $("keysnail-prompt-selector-help-list");

        let actionDescriptionMap = {};
        actions.forEach(function ([func, desc, act]) { if (act) actionDescriptionMap[act.split(",")[0]] = desc; });

        removeAllChilds(listbox);

        listbox.appendChild(
            util.xmlToDom('<listcols>\
                          <listcol flex="1" width="10%" />\
                          <listcol flex="4" width="40%" />\
                          <listcol flex="5" width="50%" />\
                          </listcols>')
        );

        function stick(keymap) {
            for (let [k, a] of util.keyValues(keymap))
            {
                let act  = a.split(",")[0];
                let desc = actionDescriptionMap[act] || "";
                let item = document.createElement("listitem");

                [k, act, desc].forEach(
                    function (label) {
                        let cell = document.createElement("listcell");
                        cell.setAttribute("label", label);
                        item.appendChild(cell);
                    });

                listbox.appendChild(item);
            }
        }

        if (localKeymap)
            stick(localKeymap);

        stick(actionKeys.selector);

        if (localKeymap)
        {
            $("keysnail-prompt-display-selector-help-button").setAttribute("hidden", false);
        }
    }

    function setSelectorActions(aActions) {
        var context = selectorContext[SELECTOR_STATE_ACTION];

        selectorTranslator = {};

        if (typeof aActions === "function")
        {
            // set callback
            context.wholeList = [[aActions, "1. Default callback"]];
            context.wholeListIndex = 0;
            return;
        }

        var list = [];

        // create action list and local command
        for (let [i, action] of util.keyValues(aActions))
        {
            let index = i + 1;
            list.push([action[0], index.toString() + ". " + action[1]]);

            if (action[2])
            {
                let [command, flag] = action[2].split(",");
                selectorTranslator[command] = "prompt-nth-action-" + index + (flag ? ("," + flag) : "");
            }
        }

        context.wholeList      = list;
        context.wholeListIndex = 0;
    }

    function selectNextCompletion(aDirection, aRing) {
        var nextIndex, currentIndex, totalLength;

        if (!currentList || !currentList.length)
        {
            display.echoStatusBar("No completion found", 1000);
            wholeListIndex = -1;
            return;
        }

        if (!compIndexList && currentRegexp)
        {
            selectorDisplayStatusbarLine(currentRegexp, -1);
            // set index to pass
            wholeListIndex = -1;
            return;
        }

        if (compIndexList)
        {
            // with regexp
            nextIndex    = getNextIndex(compIndex, aDirection, 0, compIndexList.length, aRing);
            currentIndex = compIndex;
            totalLength  = compIndexList.length;
            // set global value
            compIndex    = nextIndex;
            wholeListIndex = compIndexList[nextIndex];
        }
        else
        {
            // whole list
            nextIndex        = getNextIndex(wholeListIndex, aDirection, 0, wholeList.length, aRing);
            currentIndex     = wholeListIndex;
            totalLength      = wholeList.length;
            // set global value
            wholeListIndex = nextIndex;
        }

        selectorDisplayStatusbarLine(currentRegexp, nextIndex, totalLength);
        setListBoxSelection(nextIndex, currentIndex);
    }

    function createCompletionList() {
        if (!wholeList || !wholeList.length)
        {
            display.echoStatusBar("No completion found", 1000);
            setRows(0);
            listbox.hidden = true;
            wholeListIndex = -1;
            return;
        }

        var index;
        var start = textbox.selectionStart;

        if (start == 0)
        {
            // create list from entire completion
            compIndex      = -1;
            compIndexList  = null;
            setListBoxFromStringList(wholeList);
            setRows(wholeList.length);
            listbox.hidden = false;
            wholeListIndex = index = 0;
            currentRegexp  = "";
        }
        else
        {
            // create list which maches the current input
            var listLen = wholeList.length;
            var regexp  = textbox.value;

            var substrIndex;

            var keywords = regexp.split(" ");
            var useMigemoActual = (options.useMigemo && window.xulMigemoCore &&
                                   keywords.every(function (aStr) aStr.length >= options.migemoMinWordLength));

            var migexp;
            if (useMigemoActual)
                migexp = new RegExp(window.xulMigemoCore.getRegExpFunctional(regexp, {}, {}), "i");
            else
                keywords = keywords.map(function (s) {
                    try {
                        return (new RegExp(s, "i"));
                    } catch (_) {
                        try {
                            return (new RegExp(util.toUnicodeExpression(s), "i"));
                        } catch (_) {
                            return null;
                        }
                    }
                }).filter(function (r) r);

            var cellForSearch = gFlags ? [for (i of Object.keys(gFlags)) if ((gFlags[i] & IGNORE) === 0) i] : null;

            // reduce prototype chaine
            let list  = wholeList;
            let cellv = getCellValue;

            var matcher;
            if (isMultipleList(list))
            {
                // multiple cols
                if (cellForSearch)
                {
                    // cells specified "IGNORE" by user will be ignored
                    matcher = (useMigemoActual) ?
                        function (i) cellForSearch.some(
                            function (j) migexp.test(cellv(list[i], j))
                        )
                        :
                        function (i) keywords.every(
                            function (keyword) cellForSearch.some(
                                function (j) keyword.test(cellv(list[i], j))
                            )
                        );
                }
                else
                {
                    // search whole cells
                    matcher = (useMigemoActual) ?
                        function (i) list[i].some(
                            function (item) migexp.test(typeof item === "function" ? item.call(null, list[i]) : item || "")
                        )
                    :
                    function (i) keywords.every(
                        function (keyword) list[i].some(
                            function (item) keyword.test(typeof item === "function" ? item.call(null, list[i]) : item || "")
                        )
                    );
                }
            }
            else
            {
                // single col
                matcher = (useMigemoActual) ?
                    function (i) migexp.test(list[i])
                    :
                    function (i) keywords.every(
                        function (keyword) keyword.test(list[i])
                    );
            }

            // generate new completion list
            compIndexList = [];
            compIndex = 0;

            let start = Date.now();
            for (let i = 0; i < listLen; ++i)
            {
                if (matcher(i))
                    compIndexList.push(i);
            }
            let end = Date.now();

            // self.message("Total : %s msec", end - start);

            if (compIndexList.length === 0)
            {
                // no candidates found
                removeAllChilds(listbox);
                setRows(0);
                listbox.hidden = true;
                compIndexList  = null;
                currentRegexp  = regexp;
                wholeListIndex = -1;

                selectorDisplayStatusbarLine(regexp, -1);

                return;
            }

            index = compIndexList[0];
            currentRegexp = regexp;

            setListBoxFromIndexList(wholeList, compIndexList);

            // show
            setRows(compIndexList.length);
            listbox.hidden = false;
        }

        wholeListIndex = index;

        selectorDisplayStatusbarLine(currentRegexp, 0,
                                     compIndexList ? compIndexList.length : wholeList.length);
        setListBoxSelection(0);
    }

    // ====================================================================== //
    // prompt.read, prompt.reader
    // ====================================================================== //

    const READER_ST_NEUT = 0;   // neutral
    const READER_ST_COMP = 1;   // completion
    const READER_ST_HIST = 2;   // history
    const READER_ST_KEEP = 3;   // use chache

    var readerCurrentCollection = null;
    var readerCurrentIndex      = null;
    var readerCurrentCompleter  = null;

    var readerState                  = READER_ST_NEUT;
    var readerLeftContext            = null;
    var readerRightContext           = null;
    var readerOriginalText           = null;
    var readerOriginalSelectionStart = null;
    var readerCC                     = null;
    var readerEscapeChars            = undefined;

    var readerHistory;

    var readerPostProcess = null;

    function resetPostProcess() {
        readerPostProcess = null;
    }

    function readerResetState() {
        readerState                  = READER_ST_NEUT;
        readerLeftContext            = null;
        readerRightContext           = null;
        readerOriginalText           = null;
        readerOriginalSelectionStart = null;
        readerCC                     = null;
    }

    // In history mode, we do not want stylist to work.
    var readerStylist;
    var readerFlags;

    function readerSetupHistory(aGroup) {
        aGroup = aGroup || "default";

        if (aGroup && typeof historyHolder[aGroup] === "undefined")
            historyHolder[aGroup] = [];

        readerHistory = historyHolder[aGroup];
    }

    function readerSetupList(aList, aIndex) {
        let pos;
        let center  = Math.round(listboxRows / 2);
        let listLen = aList.length;

        let selectionPos;

        if (aIndex <= center)
        {
            setListBoxFromStringList(aList, 0);
            selectionPos = aIndex;
        }
        else if (aIndex >= listLen - center)
        {
            setListBoxFromStringList(aList, listLen - listboxRows);
            selectionPos = listboxRows - (listLen - aIndex);
        }
        else
        {
            setListBoxFromStringList(aList, aIndex - center);
            selectionPos = center;
        }

        listbox.currentIndex = listbox.selectedIndex = selectionPos;
    }

    function createTextGetter(aStringList, aFlags, aMultiple) {
        return isMultipleList(aStringList) ?
            aMultiple ? function (r) r.reduce(
                function (a, s, i) aFlags[i] & (HIDDEN | ICON) ? a : a + " " + s
                , "")
        : function (r) r[getFirstTextColIndex(aFlags)]
        : function (r) r;
    }

    // Completer {{ ============================================================= //

    let completer = {
        states: {
            get NEUTRAL () { return 0; },
            get QUOTE   () { return 1; },
            get WORD    () { return 2; },
            get ESCAPE  () { return 3; }
        },

        utils: {
            getQuery: function getQuery(currentText, delimiters, quotes) {
                let [args, state] = completer.utils.lex(currentText, {
                                                            delimiters : delimiters,
                                                            quotes     : quotes,
                                                            raw        : false
                                                        });

                let query  = (state === completer.states.NEUTRAL) ? "" : args[args.length - 1];
                let origin = query ? currentText.lastIndexOf(query) : currentText.length;

                return [query, origin];
            },

            escapeRegExp: function escapeRegExp(str) {
                let specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g");
                return str.replace(specials, "\\$&");
            },

            /**
             * when these strings are given,
             * command.hoge
             * command.huga
             * command.hoho
             * ________^___
             * this function returns index of the ^,
             * the end of common header string
             * @param {[string]} aStringList
             * @returns {integer} index of the common header substring
             */
            getCommonSubStringIndex: function getCommonSubStringIndex(aStringList) {
                let i = 1;

                let getText = createTextGetter(aStringList);

                while (true)
                {
                    let header = getText(aStringList[0]).slice(0, i);

                    if (aStringList.some(
                            function (row) {
                                let str = getText(row);
                                return (str.slice(0, i) !== header) || (i > str.length);
                            }))
                        break;

                    i++;
                }

                return i - 1;
            },

            escape: function escape(str, escapeChars) {
                escapeChars = escapeChars || " ";
                return str.replace(new RegExp("[" + escapeChars + "]", "g"), "\\$&");
            },

            unescape: function unescape(str) {
                let escapeChar = "\\";

                let buffer   = [];
                let escapeIt = false;

                for (let c of str)
                {
                    if (!escapeIt && c === escapeChar)
                        escapeIt = true;
                    else
                        escapeIt = false, buffer.push(c);
                }

                return buffer.join("");
            },

            unquote: function unquote(str, quotes) {
                quotes = quotes || ['"', '\''];

                let unquoted;
                quotes.some(function (s) (str[0] === s && str[str.length - 1] === s) ?
                            unquoted = str.slice(1, str.length - 1) : false);

                return unquoted || str;
            },

            state2str: function state2str(state) {
                let str;
                switch (state)
                {
                case completer.states.NEUTRAL:
                    str = "NEUTRAL";
                    break;
                case completer.states.WORD:
                    str = "WORD";
                    break;
                case completer.states.QUOTE:
                    str = "QUOTE";
                    break;
                case completer.states.ESCAPE:
                    str = "ESCAPE";
                    break;
                }
                return str;
            },

            lex: function lex(str, options) {
                options = options || {};

                let delimiters = options.delimiters || [' ', '\t', '\n'];
                let quotes     = options.quotes     || ['"', '\''];
                let escapes    = options.escapes    || ["\\"];

                let tokens    = [];
                let state     = completer.states.NEUTRAL;
                let prevState = state;

                let buffer = [];
                let current;

                let quoteChar;

                function flush() {
                    if (buffer.length)
                    {
                        tokens.push(buffer.join(""));
                        buffer.length = 0;
                    }
                }

                for (let i = 0; i < str.length; ++i)
                {
                    let current = str[i];

                    switch (state)
                    {
                        // ================================================== //
                        // Skip (Initial state)
                        // ================================================== //
                    case completer.states.NEUTRAL:
                    case completer.states.WORD:
                        if (delimiters.some(function (d) d === current))
                        {
                            // delimiters: ignore
                            state = completer.states.NEUTRAL;
                            flush();
                        }
                        else if (quotes.some(function (q) q === current))
                        {
                            // quotes: go to quote mode
                            state     = completer.states.QUOTE;
                            quoteChar = current;
                            if (options.raw)
                                buffer.push(current);
                        }
                        else if (escapes.some(function (q) q === current))
                        {
                            // escapes: escape next char
                            state = completer.states.ESCAPE;
                            if (options.raw)
                                buffer.push(current);
                        }
                        else
                        {
                            // otherwise: word
                            state = completer.states.WORD;
                            buffer.push(current);
                        }
                        break;
                        // ================================================== //
                        // In quote
                        // ================================================== //
                    case completer.states.QUOTE:
                        if (current === quoteChar)
                            state = completer.states.WORD;
                        if (!(current === quoteChar && !options.raw))
                            buffer.push(current);
                        break;
                        // ================================================== //
                        // Escape
                        // ================================================== //
                    case completer.states.ESCAPE:
                        buffer.push(current);
                        state = completer.states.WORD;
                        break;
                        // ================================================== //
                    }
                }

                if (buffer.length)
                {
                    tokens.push(buffer.join(""));
                }

                return [tokens, state];
            },

            normalizePath: function (aPath, aDelimiter) {
                let delimiter = aDelimiter || userscript.directoryDelimiter;

                let isWindows = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS === "WINNT";

                if (isWindows)
                    aPath = aPath.replace(/\//g, delimiter || "\\");

                if (aPath.indexOf("~" + delimiter) === 0)
                {
                    aPath = userscript.prefDirectory + aPath.slice(1);
                }

                if ((isWindows && !aPath.match(/^[a-zA-Z]:\\/)) ||
                    (!isWindows && (aPath[0] !== delimiter)))
                {
                    aPath = share.pwd + delimiter + aPath;
                }

                return aPath;
            },

            // let stripped = text.replace(/^[ ]+/, "").replace(/[]+$/, "");
            directoryDelimiter: '/',

            parseDirectoryQuery: function parseDirectoryQuery(text) {
                let [home, delimiter] = userscript.getPrefDirectory();

                if (!share.pwd)
                    share.pwd = home;

                let pwd = share.pwd;

                let originalText = text;

                text = text || (pwd + delimiter);
                text = completer.utils.normalizePath(text, delimiter);

                let directories = text.split(delimiter);

                let query  = directories.pop();
                let origin = query === "" ? originalText.length : originalText.lastIndexOf(query);

                let path;

                if (directories.length === 1 && directories[0] === "") // strings like "/" or "/hoge"
                    path = delimiter;
                else
                    path = directories.join(delimiter);

                let result = {
                    files     : [],
                    query     : query,
                    origin    : origin,
                    delimiter : delimiter
                };

                let dir;
                try
                {
                    dir = util.openFile(path);
                }
                catch (e)
                {
                    result.errorMsg = e.message;
                    return result;
                }

                if (!dir.exists() || !dir.isDirectory())
                {
                    if (!dir.exists())
                        result.errorMsg = util.format("%s not exists", dir.path);
                    else
                        result.errorMsg = util.format("%s is not a directory", dir.path);

                    return result;
                }

                let files;
                try
                {
                    files = util.readDirectory(dir, true);
                }
                catch (x)
                {
                    result.errorMsg = x.message;
                }

                result.files = files || [];

                return result;
            },

            /**
             * @param {} context
             * @returns {}
             */
            completeFiles: function completeFiles(context) {
                let result     = completer.utils.parseDirectoryQuery(context.text);
                let delimiter  = result.delimiter;
                let query      = result.query;
                let collection = result.files.map(function (f) f.isDirectory() ? f.leafName + delimiter : f.leafName);

                if (context.mask)
                {
                    let mask = context.mask;
                    collection = collection.filter(function (s) (s[s.length - 1] === delimiter || s.match(mask)));
                }

                if (context.hideDotFiles)
                {
                    collection = collection.filter(function (s) (s[0] !== "."));
                }

                if (query === "")
                    result.collection = collection;
                else
                {
                    if (context.filter)
                    {
                        result.collection = context.filter(collection, query);
                    }
                    else
                    {
                        let matched = [];
                        collection = collection.filter(function (s) (!s.indexOf(query)) ? (matched.push(s), false) : true);
                        collection = collection.filter(function (s) (!s.toLowerCase().indexOf(query.toLowerCase())) ?
                                                       (matched.push(s), false) : true);
                        result.collection = matched;
                    }
                }

                return result;
            }
        },

        variety: function (completers) {
            return function (currentText, text) {
                let collections = [];

                let cc = {
                    origin     : 0,
                    query      : null,
                    collection : null
                };

                for (let cmpltr of completers)
                {
                    let tmpCc      = cmpltr(currentText, text) || {collection : null};
                    let collection = tmpCc.collection;

                    if (collection)
                    {
                        cc.origin = tmpCc.origin;
                        cc.query  = tmpCc.query;
                        collections.push(collection);
                    }
                }

                let max = -1;

                for (let c of collections)
                {
                    let first = c[0];

                    if (typeof first === "string")
                        if (max < 1) max = 1;
                    else if (typeof first[0] === "string" && first[0].length > max)
                        max = first[0].length;
                }

                if (max < 0)
                    return null;

                if (max === 1)
                {
                    // all collections are consist of string
                    collections = collections.reduce(function (a, c) a.concat(c), []);
                }
                else
                {
                    collections = collections.reduce(
                        function (a, c) {
                            let normalized = c;

                            if (normalized[0].length < max)
                            {
                                let lacks   = max - normalized[0].length;
                                let cushion = Array.apply(null, Array(lacks)).map(function () "");
                                normalized  = normalized.map(function (r) r.concat(cushion));
                            }

                            return a.concat(normalized);
                        }, []);
                }

                cc.collection = collections;

                return cc;
            };
        },

        fetch: {
            tabs: function (context) {
                return function (left, whole) {
                    context      = context || {};
                    context.text = left;

                    let tabs       = getBrowser().mTabContainer.childNodes;
                    let collection = [for (tab of Array.slice(tabs))
                                      [tab.image, tab.label, tab.linkedBrowser.contentDocument.URL]];

                    let cc    = completer.matcher.migemo(collection, {multiple:true})(left, whole);
                    cc.flags  = [ICON | IGNORE, 0, 0];
                    cc.header = ["Title", "URL"];

                    return cc;
                };
            },

            google: function (left, whole) {
                let suggestions = util.suggest.google(left || "");

                return { collection : suggestions, origin : whole.indexOf(left) };
            },

            suggest: function (aEngines, aWithDescription) {
                let engines = aEngines ? util.suggest.filterEngines(aEngines) : [];

                return function (currentText, text) {
                    let [query, origin] = completer.utils.getQuery(currentText, [" "]);

                    let cc = {
                        origin : origin,
                        query  : query
                    };

                    if (query)
                    {
                        let collection = engines.reduce(
                            function (accum, engine) {
                                let suggestions = util.suggest.getSuggestions(engine, query);
                                let description = engine.description;

                                return accum.concat(aWithDescription ?
                                                    suggestions.map(function (s) [s, description]) :
                                                    suggestions);
                            }, []);

                        cc.collection = collection;
                    }

                    return cc;
                };
            },

            directory: function (context) {
                return function (currentText, text) {
                    context      = context || {};
                    context.text = currentText;

                    let result = completer.utils.completeFiles(context);

                    let collection = result.collection;
                    let query      = result.query;
                    let origin     = result.origin;
                    let delimiter  = result.delimiter;

                    if (collection)
                    {
                        collection = collection.map(function (f) {
                                                        let icon;

                                                        if (f[f.length - 1] === delimiter)
                                                        {
                                                            f    = f.slice(0, f.length - 1);
                                                            icon = "chrome://keysnail/skin/icon/folder.png";
                                                        }
                                                        else
                                                        {
                                                            let matched = f.match("[.]([^.]+)$");
                                                            let ext;

                                                            if (matched && matched[1]) ext = matched[1];

                                                            icon = "moz-icon://." + (ext || "") + "?size=16";
                                                        }

                                                        return [icon, f];
                                                    });
                    }

                    result.collection  = collection;
                    result.flags       = [ICON | IGNORE, 0];

                    return result;
                };
            },

            javascript: function (context) {
                return function (currentText, text) {
                    context = context || {};

                    let right = text.slice(currentText.length);

                    let [query, origin] = completer.utils.getQuery(
                        currentText, [" ", "\t", "\n", "(", "{", ",", ";"], [], []
                    );

                    // if you want to begin with specific object,
                    // try something like completer.fetch.javascript({root: window});
                    let root = context.root;

                    let global = window; // (function () this)();

                    if (!root) {
                        if ("getOwnPropertyNames" in Object) {
                            root = {
                                __proto__ : util.userContext,
                                // browser
                                window    : window,
                                content   : content,
                                document  : document,
                                // ECMA262 + alpha
                                Array              : Array,
                                Boolean            : Boolean,
                                Date               : Date,
                                Error              : Error,
                                EvalError          : EvalError,
                                Function           : Function,
                                JSON               : JSON,
                                Math               : Math,
                                Number             : Number,
                                Object             : Object,
                                RangeError         : RangeError,
                                ReferenceError     : ReferenceError,
                                RegExp             : RegExp,
                                String             : String,
                                SyntaxError        : SyntaxError,
                                TypeError          : TypeError,
                                URIError           : URIError,
                                decodeURI          : decodeURI,
                                decodeURIComponent : decodeURIComponent,
                                encodeURI          : encodeURI,
                                encodeURIComponent : encodeURIComponent,
                                Infinity           : Infinity,
                                NaN                : NaN,
                                eval               : eval,
                                escape             : escape,
                                unescape           : unescape,
                                isFinite           : isFinite,
                                isNaN              : isNaN,
                                parseFloat         : parseFloat,
                                parseInt           : parseInt
                            };
                        } else {
                            root = {
                                __proto__ : util.userContext,
                                window    : window,
                                content   : content,
                                document  : document
                            };

                            let objectPrototype = {
                                "__defineGetter__"     : undefined,
                                "__defineSetter__"     : undefined,
                                "__lookupGetter__"     : undefined,
                                "__lookupSetter__"     : undefined,
                                "__noSuchMethod__"     : undefined,
                                "hasOwnProperty"       : undefined,
                                "isPrototypeOf"        : undefined,
                                "propertyIsEnumerable" : undefined,
                                "unwatch"              : undefined,
                                "watch"                : undefined
                            };

                            for (let k of Object.keys(objectPrototype))
                                objectPrototype[k] = Object[k];

                            let functionPrototype = {__proto__ : objectPrototype};

                            for (let  k of ["apply", "call", "toSource", "toString", "valueOf"])
                                functionPrototype[k] = Function[k];

                            let globalObjects = {
                                Array          : ["concat", "join", "pop", "push", "reverse", "shift", "slice", "sort",
                                                  "splice", "toSource", "toString", "unshift", "every", "filter", "forEach",
                                                  "indexOf", "lastIndexOf", "map", "some"],
                                Boolean        : [],
                                Date           : ["now", "parse", "UTC"],
                                Error          : [],
                                EvalError      : [],
                                Math           : ["E", "LN2", "LN10", "LOG2E", "LOG10E", "PI", "SQRT1_2", "SQRT2",
                                                  "abs", "acos", "asin", "atan", "atan2", "ceil", "cos", "exp", "floor",
                                                  "log", "max", "min", "pow", "random", "round", "sin", "sqrt", "tan"],
                                Number         : ["MAX_VALUE", "MIN_VALUE", "NaN", "NEGATIVE_INFINITY", "POSITIVE_INFINITY",
                                                  "toExponential", "toFixed", "toLocaleString", "toPrecision", "toSource", "toString", "valueOf"],
                                RangeError     : [],
                                ReferenceError : [],
                                RegExp         : [],
                                String         : [],
                                SyntaxError    : [],
                                TypeError      : [],
                                URIError       : []
                            };

                            for (let [objName, keys] of util.keyValues(globalObjects))
                            {
                                globalObjects[objName] = {};

                                for (k of keys)
                                {
                                    globalObjects[objName][k] = global[objName][k];
                                }

                                globalObjects[objName]["__proto__"] = functionPrototype;
                            }

                            globalObjects.Function = functionPrototype;
                            globalObjects.Object   = objectPrototype;

                            implant(root, globalObjects);
                        }
                    }

                    const IDENTIFIER_PATTERN = /^[a-zA-Z$_]+[0-9a-zA-Z$_]*$/;

                    const ST_NEUTRAL  = 0;
                    const ST_IN_QUOTE = 1;
                    const ST_IN_BRACE = 2;
                    const ST_IN_PAREN = 3;
                    const ST_ESCAPE   = 4;

                    function splitter(str) {
                        let tokens = [];

                        let buffer = [];
                        let current;

                        let stack = [];
                        let state = ST_NEUTRAL;

                        let quoteChar = null;

                        function flushBuffer() {
                            if (buffer.length)
                                tokens.push(buffer.join(""));
                            buffer = [];
                        }

                        for (let i = 0; i < str.length; ++i)
                        {
                            let current  = str[i];
                            let oldState = state;

                            switch (state)
                            {
                                // ================================================== //
                            case ST_NEUTRAL:
                                switch (current)
                                {
                                case '"':
                                case '\'':
                                    state     = ST_IN_QUOTE;
                                    quoteChar = current;
                                    break;
                                case '[':
                                    state = ST_IN_BRACE;
                                    // fall through
                                case '(':
                                    state = ST_IN_PAREN;
                                    // fall through
                                case '.':
                                    flushBuffer();
                                    break;
                                default:
                                    buffer.push(current);
                                    break;
                                }
                                break;
                                // ================================================== //
                            case ST_IN_QUOTE:
                                switch (current)
                                {
                                case quoteChar:
                                    state = stack.pop();
                                    flushBuffer();
                                    continue;
                                    break;
                                case '\\':
                                    state = ST_ESCAPE;
                                    break;
                                default:
                                    buffer.push(current);
                                    break;
                                }
                                break;
                                // ================================================== //
                            case ST_IN_BRACE:
                            case ST_IN_PAREN:
                                switch (current)
                                {
                                case '"':
                                case '\'':
                                    state     = ST_IN_QUOTE;
                                    quoteChar = current;
                                    break;
                                case ']':
                                case ')':
                                    state = ST_NEUTRAL;
                                    flushBuffer();
                                    break;
                                default:
                                    buffer.push(current);
                                    break;
                                }
                                break;
                                // ================================================== //
                            case ST_ESCAPE:
                                state = stack.pop();
                                buffer.push(current);
                                continue;
                                break;
                            }

                            if (oldState !== state)
                                stack.push(oldState);
                        }

                        flushBuffer();

                        return [tokens, state];
                    }

                    function propFilter(str) {
                        if (IDENTIFIER_PATTERN.test(str))
                            return str;
                        else
                            return "['" + str.replace(/'/g, "'") + "']"; // '
                    }

                    function getArgList (aFunc) {
                        try {
                            return aFunc.toString().split('\n')[0].match(/\(.*\)/);
                        } catch (x) {
                            return "";
                        }
                    }

                    function getRow(obj, k, prefix) {
                        let value = getV(obj, k);
                        let type  = typeof value;

                        let filtered = propFilter(k);
                        let keyStr = (prefix ? prefix + (filtered[0] !== "[" ? "." : "") : "") + filtered;
                        let valueStr;

                        switch (type)
                        {
                        case "function":
                            valueStr = "function " + getArgList(value);
                            break;
                        case "string":
                            valueStr = '"' + value + '"';
                            break;
                        case "undefined":
                            valueStr = "undefined";
                        default:
                            if (value === null)
                            {
                                valueStr = "null";
                                type     = "null";
                            }
                            else if (value === undefined)
                            {
                                valueStr = "undefined";
                                type     = "undefined";
                            }
                            else
                            {
                                // pessimistic ...
                                try {
                                    valueStr = value.toString();
                                } catch (x) {
                                    valueStr = value;
                                }
                            }
                        }

                        return [keyStr, valueStr, type];
                    }

                    function getV(obj, k) {
                        try {
                            return obj[k];
                        } catch (x) {
                            return null;
                        }
                    }

                    function cmp([a], [b]) {
                        if (a < b)
                            return -1;
                        else if (a > b)
                            return 1;
                        else
                            return 0;
                    }

                    let cc = {
                        origin  : origin,
                        query   : query,
                        flags   : [0, 0, IGNORE | HIDDEN],
                        style   : ["", "font-weight:bold;"],
                        stylist : function (row, n) {
                            if (n !== 1)
                                return null;

                            return style.js[row[2]] || style.prompt.default;
                        },
                        rightText : right
                    };

                    if (!query)
                    {
                        cc.collection =
                            [for (k of util.getAllPropertyNames(root)) getRow(root, k)].sort(cmp);
                        return cc;
                    }
                    else
                    {
                        let [props, state] = splitter(query);

                        let obj = root;
                        let all = query[query.length - 1] === ".";

                        let _key, prefix;

                        switch (state)
                        {
                        case ST_IN_QUOTE:
                        case ST_ESCAPE:
                            cc.errorMsg = "Unterminated string";
                            return cc;
                            break;
                        case ST_IN_BRACE:
                            all = true;
                            break;
                        }

                        if (!all) _key = props.pop();

                        prefix = props.reduce(function (a, c) {
                                                  c = propFilter(c);
                                                  if (a === "" || c[0] === '[')
                                                      return a + c;
                                                  return a + "." + c;
                                              }, "");

                        for (let i = 0; i < props.length; ++i)
                        {
                            obj = obj[props[i]];

                            if (!obj)
                            {
                                cc.errorMsg = "Object does not have the property \"" + props[i] + "\"";
                                return cc;
                            }
                        }

                        if (obj)
                        {
                            if (all)
                            {
                                cc.collection = [for (k of util.getAllPropertyNames(obj)) getRow(obj, k, prefix)].sort(cmp);
                            }
                            else
                            {
                                let keys    = [for (k of util.getAllPropertyNames(obj)) (k || "")];
                                let matched = [];

                                // head
                                keys = keys.filter(function (k) {
                                                       if (k.indexOf(_key) === 0) { matched.push(k); return false; }
                                                       return true;
                                                   });

                                // ignore case
                                keys = keys.filter(function (k) {
                                                       if (k.toLowerCase().indexOf(_key.toLowerCase()) === 0) { matched.push(k); return false; }
                                                       return true;
                                                   });

                                // substring
                                keys = keys.filter(function (k) {
                                                       if (k.toLowerCase().indexOf(_key.toLowerCase()) !== -1) { matched.push(k); return false; }
                                                       return true;
                                                   });

                                cc.collection = [for (k of matched) getRow(obj, k, prefix)];
                            }
                        }

                        return cc;
                    }
                };
            }
        },

        matcher: {
            migemo: function (collection, options) {
                options = options || {};

                if ("xulMigemoCore" in window)
                {
                    return function (currentText, text) {
                        text = text || currentText;

                        let [query, origin] = completer.utils.getQuery(currentText, [" "]);

                        let cc = {
                            origin : origin,
                            query  : query
                        };

                        let getText = createTextGetter(collection, options.flags, options.multiple);

                        if (query)
                        {
                            let matched = [];
                            let remains = collection;

                            // head
                            remains = remains.filter(function (c) {
                                                               let text = getText(c);
                                                               if (text.indexOf(query) === 0) { matched.push(c); return false; }
                                                               return true;
                                                           });

                            (query => {
                                // ignore case
                                remains = remains.filter(function (c) {
                                                             let text = getText(c).toLowerCase();
                                                             if (text.indexOf(query) === 0) { matched.push(c); return false; }
                                                             return true;
                                                         });

                                // substring
                                remains = remains.filter(function (c) {
                                                             let text = getText(c).toLowerCase();
                                                             if (text.indexOf(query) !== -1) { matched.push(c); return false; }
                                                             return true;
                                                         });
                            })(query.toLowerCase());

                            // mige!
                            let migexp  = new RegExp(window.xulMigemoCore.getRegExp(query), "i");
                            cc.collection = matched.concat(remains.filter(function (s) { return migexp.test(getText(s)); }));
                        }
                        else
                            cc.collection = collection;

                        return combineObject(cc, options || {});
                    };
                }
                else
                {
                    return completer.matcher.substring(collection, options);
                }
            },

            header: function (collection, options, specific) {
                if (!collection) collection = [];
                if (!options)    options    = {};
                if (!specific)   specific   = {};

                return function (currentText, text) {
                    text = text || currentText;

                    let query, origin;

                    let getText = createTextGetter(collection, options.flags, options.multiple);

                    if (specific.wholeHeaderAsQuery)
                    {
                        query  = currentText;
                        origin = currentText.length;
                    }
                    else
                    {
                        [query, origin] = completer.utils.getQuery(currentText, [" "]);
                    }

                    let cc = {
                        origin : origin,
                        query  : query
                    };

                    if (query)
                    {
                        let remains = collection;
                        let matched = [];

                        // head
                        remains = remains.filter(function (c) {
                                                     let text = getText(c);
                                                     if (text.indexOf(query) === 0) { matched.push(c); return false; }
                                                     return true;
                                                 });

                        // ignore case
                        (query => {
                            remains = remains.filter(function (c) {
                                                         let text = getText(c).toLowerCase();
                                                         if (text.indexOf(query) === 0) { matched.push(c); return false; }
                                                         return true;
                                                     });
                        })(query.toLowerCase());

                        cc.collection = matched;
                    }
                    else
                    {
                        cc.collection = collection;
                    }

                    if (specific.stopCaret)
                    {
                        cc.cursorEnd = currentText.length;
                        cc.cleartext = true;
                    }

                    if (cc.collection.length && specific.commonHeader)
                        cc.cursorEnd = origin + completer.utils.getCommonSubStringIndex(cc.collection);

                    return combineObject(cc, options || {});
                };
            },

            substring: function (collection, options) {
                if (!collection) collection = [];
                if (!options)    options    = {};

                return function (currentText, text) {
                    text = text || currentText;

                    let query, origin;

                    let getText = createTextGetter(collection, options.flags, options.multiple);

                    [query, origin] = completer.utils.getQuery(currentText, [" "]);

                    let cc = {
                        origin : origin,
                        query  : query
                    };

                    if (query)
                    {
                        let remains = collection;
                        let matched = [];

                        // head
                        remains = remains.filter(function (c) {
                                                     let text = getText(c);
                                                     if (text.indexOf(query) === 0) { matched.push(c); return false; }
                                                     return true;
                                                 });

                        (query => {
                            // ignore case
                            remains = remains.filter(function (c) {
                                                         let text = getText(c).toLowerCase();
                                                         if (text.indexOf(query) === 0) { matched.push(c); return false; }
                                                         return true;
                                                     });

                            // substring
                            remains = remains.filter(function (c) {
                                                         let text = getText(c).toLowerCase();
                                                         if (text.indexOf(query) !== -1) { matched.push(c); return false; }
                                                         return true;
                                                     });
                        })(query.toLowerCase());

                        cc.collection = matched;
                    }
                    else
                    {
                        cc.collection = collection;
                    }

                    return combineObject(cc, options || {});
                };
            }
        }
    };

    // }} ======================================================================= //

    var oldSelectionStart = 0;
    function handleKeyUpRead(aEvent) {
        if (textbox.selectionStart !== oldSelectionStart)
            readerState = READER_ST_NEUT;

        oldSelectionStart = textbox.selectionStart;

        if (typeof userOnChange === "function")
        {
            let arg = {
                key     : key.keyEventToString(aEvent),
                textbox : textbox,
                event   : aEvent,
                finish  : self.finish
            };
            userOnChange(arg);
        }
    }

    function handleKeyPressRead(aEvent) {
        let stopEventPropagation = true;

        let keyStr = key.keyEventToString(aEvent);
        let keymap = readerKeymap;

        let direction = 0;

        let oldState = readerState;

        switch (keymap[keyStr])
        {
        case "prompt-cancel":
            self.finish(true);
            util.stopEventPropagation(aEvent);
            return;
            break;
        case "prompt-decide":
            self.finish();
            util.stopEventPropagation(aEvent);
            return;
            break;
        case "prompt-next-line":
            readerState = READER_ST_HIST;
            direction   = 1;
            break;
        case "prompt-previous-line":
            readerState = READER_ST_HIST;
            direction   = -1;
            break;
        case "prompt-next-completion":
            readerState = READER_ST_COMP;
            direction   = 1;
            break;
        case "prompt-previous-completion":
            readerState = READER_ST_COMP;
            direction   = -1;
            break;
        default:
            readerState = READER_ST_NEUT;
            stopEventPropagation = false;
            break;
        }

        switch (readerState)
        {
            case READER_ST_NEUT:
            case READER_ST_HIST:
            cellStylist = null;
            gFlags      = null;
            break;
            case READER_ST_COMP:
            case READER_ST_KEEP:
            cellStylist = readerStylist;
            gFlags      = readerFlags;
            break;
        }

        if (direction)
        {
            stopEventPropagation = true;

            if (oldState !== READER_ST_KEEP && oldState !== readerState)
            {
                // ================================================== //
                // Create
                // ================================================== //

                readerOriginalText           = textbox.value;
                readerOriginalSelectionStart = textbox.selectionStart;

                let currentText = (textbox.value || "").substring(0, textbox.selectionStart);
                let cc;

                let noCompletionMsg;

                switch (readerState)
                {
                case READER_ST_COMP:
                    cc = readerCC = readerCurrentCompleter(currentText, textbox.value);

                    if (cc)
                        noCompletionMsg = cc.errorMsg || util.format("No completion found for [%s]", cc.query);
                    break;
                case READER_ST_HIST:
                    cc = readerCC = completer.matcher.header(readerHistory, {}, {
                                                               wholeHeaderAsQuery : true,
                                                               stopCaret          : true
                                                           })(currentText, textbox.value) || {};

                    noCompletionMsg = util.format("No history found for [%s]", currentText);
                    break;
                }

                if (!cc || !cc.collection || !cc.collection.length)
                {
                    // No completion found
                    readerResetState();
                    readerState = READER_ST_NEUT;
                    display.echoStatusBar(noCompletionMsg, 3000);
                }
                else
                {
                    // overwrite prompt settings {{ ============================================= //

                    // for history mode, there is no need of overwriting
                    if (readerState === READER_ST_COMP)
                    {
                        gFlags      = readerFlags   = cc.flags;
                        cellStylist = readerStylist = cc.stylist;

                        readerEscapeChars = cc.escapeChars || currentPromptContext.escapeChars || "";

                        listStyle  = cc.style;
                        listWidth  = cc.width;
                        listHeader = cc.header;

                        leftLabel.value  = cc.message || currentPromptContext.message || "";
                        rightLabel.value = cc.rmessage || currentPromptContext.rmessage || "";
                    }

                    if (cc.replaceText)
                        textbox.value = cc.replaceText;

                    if (typeof cc.cursorEnd === "number")
                        textbox.selectionStart = textbox.selectionEnd = cc.cursorEnd;

                    // }} ======================================================================= //

                    // Select first / last completion
                    readerCurrentCollection = cc.collection;
                    readerCurrentIndex      = direction > 0 ? 0 : readerCurrentCollection.length - 1;
                    readerLeftContext       = currentText.slice(0, cc.origin);
                    readerRightContext      = cc.rightText || "";

                    setRows(readerCurrentCollection.length);

                    listbox.hidden = false;

                    readerSetupList(readerCurrentCollection, readerCurrentIndex);
                }
            }
            else
            {
                // ================================================== //
                // Select
                // ================================================== //

                let next;

                if (oldState === READER_ST_KEEP)
                    next = direction > 0 ? 0 : readerCurrentCollection.length - 1;
                else
                    next = readerCurrentIndex + direction;

                if (next < 0 || next >= readerCurrentCollection.length)
                {
                    // on the edge of ring list

                    // readerSetupList(readerCurrentCollection, next < 0 ? readerCurrentCollection.length - 1 : 0);

                    listbox.selectedIndex  = -1;
                    textbox.value          = readerOriginalText;
                    textbox.selectionStart = textbox.selectionEnd = readerOriginalSelectionStart;

                    readerState = READER_ST_KEEP;
                }
                else
                {
                    readerCurrentIndex = next;
                    readerSetupList(readerCurrentCollection, next);
                }
            }

            if (readerState !== READER_ST_NEUT && readerState !== READER_ST_KEEP)
            {
                let text = isMultipleList(readerCurrentCollection) ?
                    readerCurrentCollection[readerCurrentIndex][getFirstTextColIndex(gFlags)] :
                    readerCurrentCollection[readerCurrentIndex];

                if (readerEscapeChars && readerState !== READER_ST_HIST)
                    text = completer.utils.escape(text, readerEscapeChars);

                textbox.value = readerCC.cleartext ? text : readerLeftContext + text + readerRightContext;

                // set cursor position
                oldSelectionStart = textbox.selectionStart = textbox.selectionEnd =
                    (typeof readerCC.cursorEnd === "number") ? readerCC.cursorEnd : (readerLeftContext + text).length;

                display.echoStatusBar(util.format("match (%s / %s)",
                                                  readerCurrentIndex + 1,
                                                  readerCurrentCollection.length));
            }
        }

        if (stopEventPropagation)
        {
            aEvent.preventDefault();
            aEvent.stopPropagation();
        }
    }

    // function handleMouseDownRead(aEvent) {
    //     var before = listbox.selectedIndex;

    //     setTimeout(
    //         function () {
    //             util.stopEventPropagation(aEvent);
    //             var after = listbox.selectedIndex;

    //             if ((after - before) !== 0)
    //             {
    //                 var delta = (after - before);

    //                 switch (readerState)
    //                 {
    //                     case READER_ST_HIST:
    //                     break;
    //                 }
    //             }

    //             setTimeout(
    //                 function () {
    //                     textbox.focus();
    //                     textbox.selectionStart;
    //                 }, 0);
    //         }, 0);
    // }

    // ============================== finish ============================== //

    function addToHistory(arg) {
        if (arg && arg.length)
        {
            if (options.ignoreDuplication)
            {
                // remove all duplicated elements from list and add str to head
                var li = readerHistory;
                for (var i = 0; i < li.length; ++i)
                    if (arg === li[i])
                        li.splice(i, 1);
                li.push(arg);
            }
            else
            {
                readerHistory.push(arg);
            }

            if (readerHistory.length > options.historyMax)
                readerHistory.shift();
        }
    }

    function executeCallback(aCallback, aCallbackArg, aCanceled) {
        if (typeof aCallback === "function")
        {
            // try to execute
            try
            {
                aCallback.apply(modules, aCallbackArg);
            }
            catch (x)
            {
                self.message("keysnail.prompt: In " + x.fileName + " (line: " + x.lineNumber + "), " + x);
                return false;
            }
        }

        return true;
    }

    // Public {{ ================================================================ //

    var self = {
        init: function () {
            if (!KeySnail.isMainWindow)
                return;

            promptbox  = $("keysnail-prompt");
            leftLabel  = $("keysnail-prompt-left-label");
            rightLabel = $("keysnail-prompt-right-label");
            textbox    = $("keysnail-prompt-textbox");
            container  = $("browser-bottombox");

            listbox   = $("keysnail-completion-list");

            // this holds all history and
            historyHolder = persist.promptHistory;
            if (!("default" in historyHolder))
                historyHolder["default"] = [];

            self.setActionKey("read", "ESC"    , "prompt-cancel");
            self.setActionKey("read", "RET"    , "prompt-decide");
            self.setActionKey("read", "<down>" , "prompt-next-line");
            self.setActionKey("read", "<up>"   , "prompt-previous-line");
            self.setActionKey("read", "<tab>"  , "prompt-next-completion");
            self.setActionKey("read", "S-<tab>", "prompt-previous-completion");

            self.setActionKey("selector", "ESC"    , "prompt-cancel");
            self.setActionKey("selector", "RET"    , "prompt-decide");
            self.setActionKey("selector", "C-RET"  , "prompt-continuous-decide");
            self.setActionKey("selector", "M-RET"  , "prompt-continuous-decide-and-next");
            self.setActionKey("selector", "<down>" , "prompt-next-line");
            self.setActionKey("selector", "<tab>"  , "prompt-next-line");
            self.setActionKey("selector", "<up>"   , "prompt-previous-line");
            self.setActionKey("selector", "S-<tab>", "prompt-previous-line");
            self.setActionKey("selector", "<next>" , "prompt-next-page");
            self.setActionKey("selector", "<prior>", "prompt-previous-page");
            self.setActionKey("selector", "<home>" , "prompt-beginning-of-candidates");
            self.setActionKey("selector", "<end>"  , "prompt-end-of-candidates");
            self.setActionKey("selector", "C-i"    , "prompt-select-action");
            self.setActionKey("selector", "C-?"    , "prompt-display-keymap-help");

            hook.addToHook(
                'KeySnailInitialized',
                function onInitialized() {
                    hook.removeHook('KeySnailInitialized', onInitialized);
                    let displayHelpKey = [];

                    for (let [k, act] of util.keyValues(actionKeys.selector))
                    {
                        if (act === "prompt-display-keymap-help")
                            displayHelpKey.push(k);
                    }

                    $("keysnail-prompt-selector-help-title")
                        .setAttribute("value", util.getLocaleString("promptSelectorKeymapHelpTitle", [displayHelpKey.join(", ")]));
                });

            modules.completer = completer;

            // }} ======================================================================= //
        },

        get editModeEnabled() {
            return promptEditMode;
        },

        set editModeEnabled (value) {
            promptEditMode = value;

            var button      = $("keysnail-prompt-toggle-edit-mode-button");
            var iconURL     = "chrome://keysnail/skin/icon/prompt-" + (value ? "edit" : "view") + "-mode.png";
            var tooltipText = util.getLocaleString("promptEditMode" + (value ? "Enabled" : "Disabled"));
            button.setAttribute("image", iconURL);
            button.setAttribute("tooltiptext", tooltipText);
            display.echoStatusBar(tooltipText, 2000);
        },

        toggleSelectorHelpDisplay: function () {
            let panel = $("keysnail-prompt-selector-help-popup");

            if (panel.state === "open")
            {
                panel.hidePopup();
            }
            else if (!$("keysnail-prompt-display-selector-help-button").hidden)
            {
                let box   = panel.firstChild;

                let width  = box.width  || 700;
                let height = box.height || 500;

                let x = screen.availLeft + (screen.availWidth - width) / 2;
                let y = screen.availTop + (screen.availHeight - height) / 2;

                panel.openPopupAtScreen(x, y, false);
            }
        },

        toggleEditMode: function () {
            self.editModeEnabled = !self.editModeEnabled;
        },

        setActionKey: function(aType, aKey, aAction) {
            actionKeys[aType][aKey] = aAction;
        },

        set ignoreDuplication(aBool) options.ignoreDuplication = !!aBool,
        get ignoreDuplication() options.ignoreDuplication,

        set substrMatch(aBool) options.substrMatch = !!aBool,
        get substrMatch() options.substrMatch,

        set rows(aNum) { if (typeof aNum === "number") options.listboxMaxRows = Math.round(aNum); },
        get rows() options.listboxMaxRows,

        set multiLine(bool) textbox.setAttribute("multiline", bool ? "true" : "false"),
        get multiLine() ({"true" : true}[textbox.getAttribute("multiline")] || false),

        set useMigemo(aBool) options.useMigemo = !!aBool,

        set migemoMinWordLength(aNum) { if (typeof aNum === "number") options.migemoMinWordLength = Math.round(aNum); },

        set displayDelayTime(aMiliSec) { if (typeof aMiliSec === "number") options.displayDelayTime = aMiliSec; },

        set actionListStyle(aStyle) {
            var style;

            switch (typeof aStyle)
            {
            case "object":
                if (typeof(aStyle[0]) == "string")
                    style = [aStyle[0]];
                break;
            case "string":
                style = [aStyle];
            }

            if (style)
                options.actionsListStyle = style;
        },

        get suspended() sessionSuspended,
        set suspended(v) sessionSuspended = v,

        doNthAction: function (aNumber, aContinuous) {
            var action = selectorContext[SELECTOR_STATE_ACTION];
            action.wholeListIndex = aNumber;
            self.finish(false, aContinuous);
        },

        refresh: function (aSelectIndex) {
            removeAllChilds(listbox);

            switch (type)
            {
            case TYPE_READ:
                break;
            case TYPE_SELECTOR:
                if (selectorStatus !== SELECTOR_STATE_CANDIDATES)
                {
                    restoreSelectorContext(selectorContext[SELECTOR_STATE_CANDIDATES]);
                    selectorStatus = SELECTOR_STATE_CANDIDATES;
                }

                updateSelector(selectorContext[SELECTOR_STATE_CANDIDATES], {
                    index : aSelectIndex
                });

                break;
            }
        },

        /**
         * Finish inputting and current the prompt and If user can
         * @param {boolean} aCanceled true, if user canceled the prompt
         * @param {boolean} aAgain when this value is true, prompt will not be closed
         * and user can select other action
         */
        finish: function (aCanceled, aAgain) {
            // ==================== temporary preservation ==================== //

            let textboxValue = textbox.value;

            var savedCallback;
            var savedUserArg  = currentUserArg;
            var savedOnFinish = userOnFinish;

            // apply current status to saved context
            if (type === TYPE_SELECTOR)
                saveSelectorContext(selectorContext[selectorStatus]);

            if (type == TYPE_SELECTOR && wholeListIndex >= 0)
            {
                var actions     = selectorContext[SELECTOR_STATE_ACTION];
                var actionIndex = actions.wholeListIndex;

                savedCallback = actions.wholeList[actionIndex][0];
            }
            else
            {
                savedCallback = currentCallback;
            }

            var callbackArg;

            switch (type)
            {
            case TYPE_SELECTOR:
                let candidates = selectorContext[SELECTOR_STATE_CANDIDATES];
                callbackArg = [aCanceled ? -1 : candidates.wholeListIndex, candidates.wholeList];
                if (selectorFilter)
                    callbackArg = selectorFilter.apply(KeySnail, callbackArg);
                break;
            case TYPE_READ:
                let arg;
                if (aCanceled)
                    arg = null;
                else
                {
                    arg = textbox.value;
                    if (typeof readerPostProcess === "function")
                        arg = readerPostProcess(arg);
                }
                callbackArg = [arg, savedUserArg];
                break;
            }

            // continuous
            if (aAgain)
            {
                if (savedFocusedElementLives())
                    savedFocusedElement.focus();
                executeCallback(savedCallback, callbackArg);
                textbox.focus();

                return;
            }

            // ==================== reset states ==================== //

            sessionSuspended = false;

            /**
             * We need to call focus() here
             * because the callback sometimes change the current selected tab
             * e.g. opening the URL in a new tab,
             * and the window.focus() does not work that time.
             */
            if (savedFocusedElementLives())
            {
                savedFocusedElement.focus();
                savedFocusedElement = null;
            }

            if (delayedCommandTimeout) {
                clearTimeout(delayedCommandTimeout);
                delayedCommandTimeout = null;
            }
            if (typeof eventListenerRemover === "function")
                eventListenerRemover();

            // -------------------- common -------------------- //

            currentCallback    = null;
            currentUserArg     = null;

            userOnChange    = null;
            userOnFinish    = null;
            beforeSelection = null;
            afterSelection  = null;

            cellStylist = null;

            cyclicMode = false;

            gFlags = null;

            // -------------------- prompt.selector (and prompt.reader) -------------------- //

            delayedCommandTimeout = null;
            selectorFilter        = null;
            wholeListIndex        = -1;
            listHeader            = null;
            listStyle             = null;
            listWidth             = null;
            currentList           = null;
            currentIndexList      = null;

            // -------------------- prompt.read, prompt.reader ----------------------------- //

            readerResetState();
            readerStylist     = null;
            readerFlags       = null;

            resetPostProcess();

            // -------------------- DOM objects -------------------- //

            promptbox.hidden   = true;
            listbox.hidden     = true;

            removeAllChilds(listbox);

            textbox.value    = "";
            leftLabel.value  = "";
            rightLabel.value = "";

            $("keysnail-prompt-display-selector-help-button").setAttribute("hidden", true);

            // ==================== execute callback ==================== //

            if (!aCanceled)
            {
                aCanceled = !executeCallback(savedCallback, callbackArg, aCanceled);

                if (!aCanceled && (type === TYPE_READ))
                {
                    addToHistory(textboxValue);
                }
            }

            // if canceled or error occurred in callback, reset statusbar
            if (aCanceled)
                display.echoStatusBar("");

            if (typeof savedOnFinish === 'function')
                savedOnFinish();
        },

        /**
         * Read string from prompt and execute <aCallback>
         * @param {string} aMsg message to be displayed
         * @param {function} aCallback function to execute after read
         * @param {object} aUserArg any object which will be passed to the <aCallback>
         * <aCallback> must take two arguments like below.
         * function callback(aReadStr, aUserArg);
         * The first aReadStr becomes the string read from prompt
         * The second arguments becomes the <aUserArg>
         * @param {[string]} aCollection string list used to completion
         * @param {string} aInitialInput initial input of the prompt
         * @param {string} aInitialCount initial completion's index
         * @param {string} aGroup name of the history group
         */

        read: function (aMsg, aCallback, aUserArg, aCollection, aInitialInput, aInitialCount, aGroup) {
            if (!promptbox)
                return;

            if (currentCallback)
            {
                display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;

            type = TYPE_READ;

            // set up history
            readerSetupHistory(aGroup);

            // set up completion
            readerState = READER_ST_NEUT;
            readerCurrentCompleter = completer.matcher.header(aCollection);

            // set up callbacks
            currentCallback = aCallback;
            currentUserArg  = aUserArg;

            resetPostProcess();

            // display prompt box
            leftLabel.value = aMsg || "";
            textbox.value   = aInitialInput || "";

            self.editModeEnabled = false;
            promptbox.hidden     = false;

            // do not set selection value till textbox appear (cause crash)
            setCursorPos(0);

            // now focus to the input area
            textbox.focus();

            readerKeymap = actionKeys["read"];

            // add event listener
            textbox.addEventListener('keypress', handleKeyPressRead, false);
            textbox.addEventListener('keyup', handleKeyUpRead, false);
            listbox.addEventListener('click', util.stopEventPropagation, true);
            // listbox.addEventListener('mousedown', handleMouseDownRead, true);
            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressRead, false);
                textbox.removeEventListener('keyup', handleKeyUpRead, false);
                listbox.removeEventListener('click', util.stopEventPropagation, true);
                // listbox.removeEventListener('mousedown', handleMouseDownRead, true);
            };

            display.echoStatusBar(util.getLocaleString("promptKeyDescription"));
            display.echo.close();

            currentPromptContext = {};
        },

        /**
         * Extended version of the prompt.read()
         */
        reader: function (aContext) {
            if (!promptbox)
                return;

            if (currentCallback)
            {
                display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;
            if (aContext.supressRecoverFocus)
                savedFocusedElement = null;

            type = TYPE_READ;

            // set up history
            readerSetupHistory(aContext.group);

            // set up completion
            readerState = READER_ST_NEUT;

            readerCurrentCompleter = aContext.completer ||
                completer.matcher.header(
                    aContext.collection,
                    {
                        header  : aContext.header,
                        style   : aContext.style,
                        width   : aContext.width,
                        flags   : aContext.flags,
                        stylist : aContext.stylist
                    }
                );

            // set up callbacks
            currentCallback = aContext.callback;
            currentUserArg  = aContext.userarg;

            resetPostProcess();
            readerPostProcess = aContext.postProcess;

            // set up stylist
            readerStylist = aContext.stylist;
            // set up flags
            readerFlags = aContext.flags;
            gFlags      = null;

            readerEscapeChars = aContext.escapeChars;

            userOnChange = aContext.onChange;
            userOnFinish = aContext.onFinish;

            listHeader = aContext.header;
            listStyle  = aContext.style;
            listWidth  = aContext.width;

            // display prompt box
            leftLabel.value        = aContext.message || "";
            rightLabel.value       = aContext.rmessage || "";
            textbox.value          = aContext.initialInput || aContext.initialinput || "";
            self.editModeEnabled   = false;
            promptbox.hidden       = false;

            setCursorPos(aContext.cursorEnd ? textbox.value.length : 0);

            textbox.focus();

            readerKeymap = combineObject(actionKeys["read"], aContext.keymap || {});

            // add event listener
            textbox.addEventListener('keypress', handleKeyPressRead, false);
            textbox.addEventListener('keyup', handleKeyUpRead, false);
            listbox.addEventListener('click', util.stopEventPropagation, true);
            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressRead, false);
                textbox.removeEventListener('keyup', handleKeyUpRead, false);
                listbox.removeEventListener('click', util.stopEventPropagation, true);
            };

            display.echoStatusBar(aContext.description || util.getLocaleString("promptKeyDescription"));
            display.echo.close();

            currentPromptContext = aContext;
        },

        /**
         * Read string from prompt and execute <aCallback>
         * @param {string} aMsg message to be displayed
         * @param {function} aCallback function to execute after selection
         * @param {[string]} aCollection string list used to completion
         * @param {[integer]} aItemIndexToUse index of the item in <aCollection>,
         * which will be passed to the callback
         */
        selector: function (aContext) {
            if (!promptbox)
                return;

            if (currentCallback)
            {
                display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = document.commandDispatcher.focusedElement || content.window;
            if (aContext.supressRecoverFocus)
                savedFocusedElement = null;

            // tell current command is the selector
            type = TYPE_SELECTOR;

            // set up completion
            wholeList  = typeof aContext.collection === "function" ? aContext.collection.call() : aContext.collection;
            gFlags     = aContext.flags;
            listHeader = aContext.header;
            listStyle  = aContext.style;
            listWidth  = aContext.width;

            selectorFilter = aContext.filter;

            // set up callbacks
            currentCallback = true;

            userOnChange    = aContext.onChange;
            userOnFinish    = aContext.onFinish;
            beforeSelection = aContext.beforeSelection;
            afterSelection  = aContext.afterSelection;

            cyclicMode = !aContext.acyclic;

            // set up stylist
            selectorStylist = aContext.stylist;
            cellStylist     = selectorStylist;

            // display prompt box
            leftLabel.value      = aContext.message || "";
            rightLabel.value     = aContext.rmessage || "";
            self.editModeEnabled = false;
            promptbox.hidden     = false;
            // do not set selection value till textbox appear (cause crash)
            setCursorPos(0);

            // now focus to the input area
            textbox.focus();

            function singleClickHandler(aEvent) {
                util.stopEventPropagation(aEvent);
            }

            function dblClickHandler() {
                self.finish();
            }

            // add event listener
            textbox.addEventListener('keypress', handleKeyPressSelector, false);
            textbox.addEventListener('keyup', handleKeyUpSelector, false);

            listbox.addEventListener('mousedown', handleMouseDownSelector, true);
            listbox.addEventListener('click', singleClickHandler, true);
            listbox.addEventListener('dblclick', dblClickHandler, true);
            listbox.addEventListener('DOMMouseScroll', handleMouseScrollSelector, true);

            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressSelector, false);
                textbox.removeEventListener('keyup', handleKeyUpSelector, false);

                listbox.removeEventListener('mousedown', handleMouseDownSelector, true);
                listbox.removeEventListener('click', singleClickHandler, true);
                listbox.removeEventListener('dblclick', dblClickHandler, true);
                listbox.removeEventListener('DOMMouseScroll', handleMouseScrollSelector, true);
            };

            oldTextLength = 0;

            selectorStatus = SELECTOR_STATE_CANDIDATES;
            selectorContext = [];
            selectorContext[SELECTOR_STATE_CANDIDATES]        = createSelectorContext();
            selectorContext[SELECTOR_STATE_ACTION]            = createSelectorContext();
            selectorContext[SELECTOR_STATE_ACTION].listHeader = ["Actions"];
            selectorContext[SELECTOR_STATE_ACTION].listStyle  = options.actionsListStyle;
            selectorContext[SELECTOR_STATE_ACTION].flags      = [IGNORE | HIDDEN, 0];

            selectorKeymap = combineObject(actionKeys["selector"], aContext.keymap || {});

            if (aContext.actions)
            {
                try {
                    setSelectorKeymapHelp(aContext.actions, aContext.keymap);
                } catch (x) {
                    self.message("prompt.js setSelectorKeymapHelp : " + x);
                }
            }

            setSelectorActions(aContext.actions || aContext.callback);
            setSelectorContextMenu(aContext.actions || aContext.callback);

            selectorContext[SELECTOR_STATE_ACTION].wholeListIndex = aContext.initialAction || 0;

            if (typeof aContext.initialInput === 'string')
                textbox.value = aContext.initialInput;

            setCursorPos((typeof aContext.cursorEnd === 'number') ? aContext.cursorEnd : textbox.value.length);

            createCompletionList();

            if (typeof aContext.initialIndex === 'number')
            {
                wholeListIndex = aContext.initialIndex;
                setListBoxSelection(wholeListIndex);
            }

            display.echo.close();

            currentPromptContext = aContext;
        },

        message: KeySnail.message
    };

    // }} ======================================================================= //

    return self;
}();

