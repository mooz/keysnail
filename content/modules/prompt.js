/**
 * @fileOverview Provides prompt system which get inputs from user and process it
 * @name prompt.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Prompt = function () {
    /**
     * @private
     */

    const Cc = Components.classes;
    const Ci = Components.interfaces;

    var modules;

    // defalut key settings
    var actionKeys      = {};
    actionKeys.read     = {};
    actionKeys.selector = {};

    var readerKeymap;
    var selectorKeymap;
    var selectorTranslator;

    // ==================== Common objects between each context ==================== //

    // DOM Objects
    var promptbox;
    var container;
    var label;
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
        displayDelayTime    : 200,
        actionsListStyle    : ["text-decoration: underline;"]
    };

    // ==================== Current State ==================== //

    var type = TYPE_NONE;

    // -------------------- prompt.read specific -------------------- //

    var currentHead;
    var inNormalCompletion = false;

    // -------------------- prompt.selector specific -------------------- //

    var selectorStatus;
    var selectorFilter;
    var selectorContext;
    var promptEditMode;

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
    var flags;
    var listHeader;
    var listStyle;
    var listWidth;

    // ============================== completion type ============================== //

    // History
    var historyHolder;
    var history = {
        list  : null,
        index : 0,
        state : false,
        name  : "History"
    };

    // Completion
    var completion = {
        list  : null,
        index : 0,
        state : false,
        name  : "Completion"
    };

    // ============================== prompt common functions ============================== //

    function $(aId) {
        return document.getElementById(aId);
    }

    function combineObject(a, b) {
        var newObject = {};
        var key;

        for (let [key, value] in Iterator(a))
            newObject[key] = value;

        for (let [key, value] in Iterator(b))
        {
            newObject[key] = value;
        }

        return newObject;
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
        return (flags && (flags[i] & aFlag));
    }

    // ============================== common DOM manipulation ============================== //

    function setLabel(aItem, aLabel) {
        aItem.setAttribute("label", aLabel);
    }

    function setTooltip(aRow, aTooltip) {
        aRow.setAttribute("tooltiptext", aTooltip);
    }

    function setColumns(aColumn) {
        if (flags)
        {
            for each (var flag in flags)
            {
                if (flag & (modules.HIDDEN | modules.ICON))
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

    function getNextVisibleRowIndex(aCurrentIndex) {
        for (var i = aCurrentIndex + 1; i < flags.length; ++i)
        {
            if (!isFlagOn(i, modules.HIDDEN))
                break;
        }

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
        var row = document.createElement("listitem");

        if (aRowData.length > 1)
        {
            var cell;

            // i: actual column's index
            // j: visible column's index
            let i, j;
            for (i = 0, j = 0; i < aRowData.length; ++i)
            {
                if (isFlagOn(i, modules.HIDDEN))
                    continue;

                cell = document.createElement("listcell");

                if (isFlagOn(i, modules.ICON))
                {
                    cell.setAttribute("class", "listcell-iconic");
                    cell.setAttribute("image", getCellValue(aRowData, i));
                    i = getNextVisibleRowIndex(i);
                }

                var style = "";
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
        }
        else
        {
            setLabel(row, getCellValue(aRowData, 0));
        }

        return row;
    }

    function applyRow(aRow, aRowData) {
        if (aRowData.length > 1)
        {
            var cell = aRow.firstChild;

            // i: actual column's index
            // j: visible column's index
            let i, j;
            for (i = 0, j = 0; i < aRowData.length; ++i)
            {
                if (isFlagOn(i, modules.HIDDEN))
                    continue;

                if (isFlagOn(i, modules.ICON))
                {
                    cell.setAttribute("image", getCellValue(aRowData, i));
                    i = getNextVisibleRowIndex(i);
                }

                var style = "";
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

                // if (style) <= we have to clear the style
                cell.setAttribute("style", style);

                cell = cell.nextSibling;
                ++j;
            }
        }
        else
        {
            setLabel(cell, getCellValue(aRowData, 0));
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

        if (beforeSelection)
            beforeSelection({row: currentRow, i: currentIndex});

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

        if (afterSelection)
            afterSelection({row: currentRow, i: currentIndex});
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

        if (listbox.hasChildNodes())
        {
            // use listbox which has been already created
            var childs     = listbox.childNodes;
            var isMultiple = isMultipleList(aGeneralList);

            var i = aOffset, j = 0;

            // skip listcols, listhead, ...
            while (childs[j].nodeName !== "listitem")
                j++;

            for (; i < count; ++i, ++j)
            {
                if (j < childs.length)
                {
                    row = childs[j];

                    if (isMultiple)
                        applyRow(row, itemRetriever(i));
                    else
                        setLabel(row, itemRetriever(i));
                }
                else
                {
                    if (isMultiple)
                        row = createRow(itemRetriever(i));
                    else
                    {
                        row = document.createElement("listitem");
                        setLabel(row, itemRetriever(i));
                    }

                    listbox.appendChild(row);
                }
            }

            // remove stubs
            while (j < childs.length)
                listbox.removeChild(listbox.lastChild);
        }
        else
        {
            // set up the new listbox
            if (isMultipleList(aGeneralList))
            {
                // multiple
                setColumns(itemRetriever(0).length);

                for (var i = aOffset; i < count; ++i)
                {
                    row = createRow(itemRetriever(i));
                    listbox.appendChild(row);
                }
            }
            else
            {
                // normal
                setColumns(1);

                for (var i = aOffset; i < count; ++i)
                {
                    row = document.createElement("listitem");
                    setLabel(row, itemRetriever(i));
                    listbox.appendChild(row);
                }
            }
        }

        onFinish();
    }

    // ============================== prompt.selector main ============================== //

    var oldTextLength = 0;
    var delayedCommandTimeout;
    var currentRegexp;

    /**
     * Update the list when user input / delete the text
     * @param {KeyBoardEvent} aEvent event which called this handler
     */
    function handleKeyUpSelector(aEvent) {
        /**
         * Without this cause exception about selection
         */
        if (!currentCallback)
            return;

        if (textbox.value.length !== oldTextLength)
        {
            if (delayedCommandTimeout)
                clearTimeout(delayedCommandTimeout);

            // add delay
            delayedCommandTimeout = setTimeout(
                function () {
                    createCompletionList();
                    delayedCommandTimeout = null;
                },
                options.displayDelayTime);
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
        if (promptEditMode &&
            modules.key.isDisplayableKey(aEvent) &&
            !modules.key.isMetaKey(aEvent) &&
            !modules.key.isControlKey(aEvent))
        {
            return;
        }

        var key = modules.key.keyEventToString(aEvent);

        var stopEventPropagation = true;
        var keymap  = selectorKeymap;
        var command = keymap[key] || "";
        var flags;

        [command, flags] = command.split(",");
        if (!flags)
            flags = "";

        // convert local command name to prompt-nth-action-*
        if (command in selectorTranslator)
            command = selectorTranslator[command];

        // function uniq(array) {
        //     return array.reduce(
        //         function (accum, current) {
        //             if (accum.every(function (done) current !== done))
        //                 accum.push(current);
        //             return accum;
        //         }, []);
        // }

        function uniq(str) {
            var found = {};
            var uniqStr = "";

            for each (let c in str)
            {
                if (found[c])
                    continue;

                uniqStr += c;
                found[c] = true;
            }

            return uniqStr;
        }

        // if additional flags are found
        let (tmp = command.split(","))
        {
            command = tmp[0];
            flags  += tmp[1] || "";
        };

        var next = 0;

        var continuousMode = false;
        for (let [, flag] in Iterator(uniq(flags)))
        {
            switch (flag)
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
            var from, to;

            switch (selectorStatus)
            {
            case SELECTOR_STATE_CANDIDATES:
                from = SELECTOR_STATE_CANDIDATES;
                to   = SELECTOR_STATE_ACTION;
                break;
            case SELECTOR_STATE_ACTION:
                from = SELECTOR_STATE_ACTION;
                to   = SELECTOR_STATE_CANDIDATES;
                break;
            }

            selectorStatus = to;

            if (delayedCommandTimeout)
                clearTimeout(delayedCommandTimeout);

            // save current context
            saveSelectorContext(selectorContext[from]);
            // change current context
            restoreSelectorContext(selectorContext[to]);

            updateSelector(selectorContext[to]);
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
            selectNextCompletion(next, true);
        }

        if (stopEventPropagation)
        {
            aEvent.preventDefault();
            aEvent.stopPropagation();
        }
    }

    function handleMouseDownSelector(aEvent) {
        var before = listbox.selectedIndex;

        setTimeout(
            function () {
                modules.util.stopEventPropagation(aEvent);

                var after = listbox.selectedIndex;
                if ((after - before) != 0)
                    selectNextCompletion(after - before, true);

                textbox.focus();

                if (aEvent.button === 2)
                {
                    $("keysnail-prompt-menu").openPopupAtScreen(aEvent.screenX, aEvent.screenY, true);
                }
            }, 0);
    }

    function handleMouseScrollSelector(aEvent) {
        selectNextCompletion(aEvent.detail < 0 ? -1 : 1, true);
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
        aTo.flags            = flags;
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
        flags                  = aFrom.flags;
        listHeader             = aFrom.listHeader;
        listStyle              = aFrom.listStyle;
        listWidth              = aFrom.listWidth;
        oldTextLength          = textbox.value.length;
        currentRegexp          = aFrom.currentRegexp;
    }

    function updateSelector(aContext) {
        removeAllChilds(listbox);

        if (aContext.compIndexList === null)
        {
            // create list of whole completion
            setListBoxFromStringList(wholeList);
            setRows(wholeList.length);
        }
        else
        {
            setListBoxFromIndexList(wholeList, compIndexList);
            setRows(compIndexList.length);
        }

        if (listbox.hidden)
            listbox.hidden = false;

        selectorDisplayStatusbarLine(currentRegexp, 0, compIndexList ?
                                     compIndexList.length : wholeList.length);

        setListBoxSelection(compIndexList ? compIndex : wholeListIndex);
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
            modules.display.echoStatusBar("No match for [" + aQuery + "]");
        }
        else
        {
            modules.display.echoStatusBar(modules.util.format("Completion Regexp Match for [%s] (%s / %s)",
                                                              aQuery, (aIndex + 1), aTotalLength));
        }
    }

    function setSelectorContextMenu(aActions) {
        var context = selectorContext[SELECTOR_STATE_ACTION];

        var contextMenu = $("keysnail-prompt-menu");
        removeAllChilds(contextMenu);

        if (typeof aActions === "function")
            aActions = [[aActions, "Default callback"]];

        for (let [i, action] in Iterator(aActions))
        {
            var item = document.createElement("menuitem");
            item.setAttribute("label", action[1]);

            if (action[2] && (action[2].split(",")[1] || "").indexOf("c") !== -1)
                item.setAttribute("oncommand", "KeySnail.modules.prompt.doNthAction(" + i + ", true);");
            else
                item.setAttribute("oncommand", "KeySnail.modules.prompt.doNthAction(" + i + ");");

            contextMenu.appendChild(item);
        }
    }

    function setSelectorKeymapHelp(actions, localKeymap) {
        let listbox = $("keysnail-prompt-selector-help-list");

        let actionDescriptionMap = {};
        actions.forEach(function ([func, desc, act]) { if (act) actionDescriptionMap[act.split(",")[0]] = desc; });

        removeAllChilds(listbox);

        listbox.appendChild(
            modules.util.xmlToDom(<listcols>
                                  <listcol flex="1" width="10%" />
                                  <listcol flex="4" width="40%" />
                                  <listcol flex="5" width="50%" />
                                  </listcols>)
        );

        function stick(keymap) {
            for (let [k, a] in Iterator(keymap))
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
        for (let [i, action] in Iterator(aActions))
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
            modules.display.echoStatusBar("No " + completion.name + " found", 1000);
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
            modules.display.echoStatusBar("No " + completion.name + " found", 1000);
            wholeListIndex = -1;
            return;
        }

        var index;
        var start = textbox.selectionStart;

        if (start == 0)
        {
            // create list from entire completion
            compIndex = -1;
            compIndexList = null;
            setListBoxFromStringList(wholeList);
            setRows(wholeList.length);
            listbox.hidden = false;
            wholeListIndex = index = 0;
            currentRegexp = "";
        }
        else
        {
            var listLen = wholeList.length;
            var regexp  = textbox.value;

            var substrIndex;

            var keywords = regexp.split(" ");
            var useMigemoActual = (options.useMigemo &&
                                   window.xulMigemoCore &&
                                   keywords.every(function (aStr) aStr.length >= options.migemoMinWordLength));

            if (useMigemoActual)
                var migexp = window.xulMigemoCore.getRegExpFunctional(regexp, {}, {});

            var cellForSearch = flags ? [i for (i in flags) if ((flags[i] & modules.IGNORE) === 0)] : null;

            var matcher;
            if (isMultipleList(wholeList))
            {
                // multiple cols
                if (cellForSearch)
                {
                    // cells specified "IGNORE" by user will be ignored
                    matcher = (useMigemoActual) ?
                        function (i) cellForSearch.some(
                            function (j) getCellValue(wholeList[i], j).match(migexp, "i")
                        )
                        :
                        function (i) keywords.every(
                            function (keyword) cellForSearch.some(
                                function (j) getCellValue(wholeList[i], j).match(keyword, "i")
                            )
                        );
                }
                else
                {
                    // search whole cells
                    matcher = (useMigemoActual) ?
                        function (i) wholeList[i].some(
                            function (item) (typeof item === "function" ? item.call(null, wholeList[i]) : item)
                                .match(migexp, "i")
                        )
                    :
                    function (i) keywords.every(
                        function (keyword) wholeList[i].some(
                            function (item) (typeof item === "function" ? item.call(null, wholeList[i]) : item)
                                .match(keyword, "i")
                        )
                    );
                }
            }
            else
            {
                // single col
                matcher = (useMigemoActual) ?
                    function (i) wholeList[i].match(migexp, "i")
                    :
                    function (i) keywords.every(
                        function (keyword) wholeList[i].match(keyword, "i")
                    );
            }

            // generate new completion list
            compIndexList = [];
            compIndex = 0;

            for (let i = 0; i < listLen; ++i)
            {
                if (matcher(i))
                    compIndexList.push(i);
            }

            if (compIndexList.length === 0)
            {
                // no candidates found
                removeAllChilds(listbox);

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

    // ============================== prompt.read main ============================== //

    function resetState(aType) {
        aType.index = 0;
        aType.state = false;
    }

    function resetReadState() {
        currentHead        = null;
        inNormalCompletion = false;

        // reset completion list index
        compIndexList = null;
        compIndex = 0;

        resetState(completion);
        resetState(history);
    }

    var oldSelectionStart = 0;
    function handleKeyUpRead(aEvent) {
        // Some KeyPress event is grabbed by KeySnail and stopped.
        // So we need to listen the keyup event for resetting the misc values.

        if (textbox.value.indexOf(currentHead) ||
            (textbox.selectionStart !== oldSelectionStart && currentHead !== textbox.value))
        {
            resetReadState();
        }

        oldSelectionStart = textbox.selectionStart;

        if (typeof userOnChange === "function")
        {
            let (arg = {
                     key     : modules.key.keyEventToString(aEvent),
                     textbox : textbox,
                     event   : aEvent,
                     finish  : self.finish
                 }) userOnChange(arg);
        }
    }

    function handleKeyPressRead(aEvent) {
        var key = modules.key.keyEventToString(aEvent);

        var stopEventPropagation = true;
        var keymap = readerKeymap;

        // var currentText = textbox.value;
        // var args        = currentText.split(" ");
        // var currentArg  = args[args.length - 1];

        // modules.util.message(currentArg);

        switch (keymap[key])
        {
        case "prompt-cancel":
            self.finish(true);
            break;
        case "prompt-decide":
            self.finish();
            break;
        case "prompt-next-line":
            if (completion.state)
            {
                readerComplete(completion, 1, true, true, options.substrMatch, true);
                return;
            }

            if (history.state)
            {
                readerComplete(history, 1);
            }
            else
            {
                // begin trailing history
                readerComplete(history, 0);
                history.state = true;
            }
            // reset completion index
            resetState(completion);
            break;
        case "prompt-previous-line":
            if (completion.state)
            {
                readerComplete(completion, -1, true, true, options.substrMatch, true);
                return;
            }

            if (history.state)
            {
                readerComplete(history, -1);
            }
            else
            {
                readerComplete(history, 0);
                history.state = true;
            }

            // reset completion index
            resetState(completion);
            break;
        case "prompt-next-completion":
            if (completion.state)
            {
                readerComplete(completion, 1, true, true, options.substrMatch, true);
            }
            else
            {
                // begin
                readerComplete(completion, 0, true, true, options.substrMatch, true);
                completion.state = true;
            }
            // reset history index
            resetState(history);
            break;
        case "prompt-previous-completion":
            if (completion.state)
            {
                readerComplete(completion, -1, true, true, options.substrMatch, true);
            }
            else
            {
                // begin
                readerComplete(completion, 0, true, true, options.substrMatch, true);
                completion.state = true;
            }
            // reset history index
            resetState(history);
            break;
        default:
            stopEventPropagation = false;
            break;
        }

        if (stopEventPropagation)
        {
            aEvent.preventDefault();
            aEvent.stopPropagation();
        }
    }

    function handleMouseDownRead(aEvent) {
        var before = listbox.selectedIndex;

        setTimeout(
            function () {
                modules.util.stopEventPropagation(aEvent);
                var after = listbox.selectedIndex;

                if ((after - before) !== 0)
                {
                    var delta = (after - before);
                    if (completion.state)
                    {
                        readerComplete(completion, delta, true, true, options.substrMatch, true);
                        return;
                    }

                    if (history.state)
                        readerComplete(history, delta);
                    else
                    {
                        readerComplete(history, 0);
                        history.state = true;
                    }
                    // reset completion index
                    resetState(completion);
                }

                setTimeout(
                    function () {
                        textbox.focus();
                        textbox.selectionStart = textbox.value.length;
                    }, 0);
            }, 0);
    }

    /**
     *
     * @param {object} aType history, completion
     * @param {int} aDirection 0, -1, 1
     * @param {boolean} aExpand if this value is true, "head" expands greedly
     * @param {boolean} aRing whether connect completion list head and tail or not
     * @param {boolean} aSubstrMatch whether use substring match or not
     * @param {boolean} aNoSit whether move caret or not
     */
    function readerComplete(aType, aDirection, aExpand, aRing, aSubstrMatch, aNoSit) {
        if (!aType.list || !aType.list.length)
        {
            modules.display.echoStatusBar("No " + aType.name + " found", 1000);
            return;
        }

        var listBoxSelectionIndex;
        var index;
        // get cursor position
        var start = textbox.selectionStart;

        if (start === 0 || inNormalCompletion)
        {
            currentHead = "";
            // get {current / next / previous} index
            index = getNextIndex(aType.index, aDirection, 0, aType.list.length, aRing);

            if (!inNormalCompletion)
            {
                // at first time
                setListBoxFromStringList(aType.list);
                setRows(aType.list.length);
                listbox.hidden = false;
            }
            listBoxSelectionIndex = index;

            // normal completion (not the substring matching)
            inNormalCompletion = true;
        }
        else
        {
            inNormalCompletion = false;

            var listLen = aType.list.length;
            var substrIndex;

            if (currentHead !== null && compIndexList)
            {
                // use current completion list
                var nextCompIndex = getNextIndex(compIndex, aDirection, 0, compIndexList.length, aRing);

                index = compIndexList[nextCompIndex];
                compIndex = nextCompIndex;
                listBoxSelectionIndex = nextCompIndex;
            }
            else
            {
                // generate new completion list
                compIndexList = [];
                compIndex = 0;

                var header = textbox.value.slice(0, start);

                currentHead = header;

                // modules.display.prettyPrint(header);

                for (var i = 0; i < listLen; ++i)
                {
                    var foundIndex = getListText(aType.list, i).indexOf(header);
                    if (foundIndex === 0 || (aSubstrMatch && foundIndex !== -1))
                        compIndexList.push(i);
                }

                if (compIndexList.length === 0)
                {
                    compIndexList = null;
                    modules.display.echoStatusBar("No match for [" + currentHead + "]");
                    currentHead = null;

                    return;
                }

                index = compIndexList[0];

                if (aExpand)
                {
                    var newSubstrIndex = getCommonSubstrIndex(aType.list, compIndexList);
                    currentHead = getListText(aType.list, index).slice(0, newSubstrIndex);

                    oldSelectionStart = newSubstrIndex;
                }

                setListBoxFromIndexList(aType.list, compIndexList);
                listBoxSelectionIndex = 0;

                // show
                setRows(compIndexList.length);
                listbox.hidden = false;
            }
        }

        if (inNormalCompletion)
            modules.display.echoStatusBar(modules.util.format("%s (%s / %s)", aType.name, index + 1, aType.list.length));
        else
        {
            modules.display.echoStatusBar(modules.util.format("%s Match for [%s] (%s / %s)",
                                                              aType.name + (aSubstrMatch ? " Substring" : " Header"),
                                                              currentHead,
                                                              compIndex + 1,
                                                              compIndexList.length));
        }

        // set new text

        textbox.value = getListText(aType.list, index);
        aType.index = index;

        if (aNoSit)
        {
            if (inNormalCompletion)
            {
                textbox.selectionStart = textbox.selectionEnd = textbox.value.length;
                oldSelectionStart = textbox.value.length;
            }
            else
            {
                textbox.selectionStart = textbox.selectionEnd = currentHead.length;
            }
        }
        else
        {
            textbox.selectionStart = textbox.selectionEnd = start;
        }

        setListBoxSelection(listBoxSelectionIndex);
    }

    /**
     * when these strings are given,
     * command.hoge
     * command.huga
     * command.hoho
     * ________^___
     * this function returns index of the ^,
     * the end of common header string
     * @param {[string]} aStringList
     * @param {[integer]} aIndexList
     * @returns {integer} index of the common header substring
     */
    function getCommonSubstrIndex(aStringList, aIndexList) {
        var i = 1;

        while (true)
        {
            var header = getListText(aStringList, aIndexList[0]).slice(0, i);

            if (aIndexList.some(
                    function (strIndex) (getListText(aStringList, strIndex).slice(0, i) !== header)
                        || (i > getListText(aStringList, strIndex).length)
                )) break;

            i++;
        }

        return i - 1;
    }

    // ============================== finish ============================== //

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
                self.message("filename :: " + x.fileName + " :: msg :: " + x);
                return false;
            }

            // add history (prompt.read only)
            if ((type == TYPE_READ) && aCallbackArg[0] && aCallbackArg[0].length)
            {
                var text = aCallbackArg[0];

                if (options.ignoreDuplication)
                {
                    // remove all duplicated elements from list and add str to head
                    var li = history.list;
                    for (var i = 0; i < li.length; ++i)
                    {
                        if (text == li[i])
                            li.splice(i, 1);
                    }

                    li.unshift(text);
                }
                else
                {
                    history.list.unshift(text);
                }
            }
        }

        return true;
    }

    // ================ public ================ //

    var self = {
        init: function () {
            if (KeySnail.windowType != "navigator:browser")
                return;

            modules = this.modules;

            promptbox = $("keysnail-prompt");
            label     = $("keysnail-prompt-label");
            textbox   = $("keysnail-prompt-textbox");
            container = $("browser-bottombox");

            listbox   = $("keysnail-completion-list");

            // this holds all history and
            historyHolder            = {};
            historyHolder["default"] = [];

            // set up flags
            modules.__defineGetter__("HIDDEN", function () { return 1; });
            modules.__defineGetter__("IGNORE", function () { return 2; });
            modules.__defineGetter__("ICON"  , function () { return 4; });

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

            modules.hook.addToHook(
                'KeySnailInitialized',
                function () {
                    modules.hook.removeHook('KeySnailInitialized', arguments.callee);
                    let displayHelpKey = [];

                    for (let [k, act] in Iterator(actionKeys.selector))
                    {
                        if (act === "prompt-display-keymap-help")
                            displayHelpKey.push(k);
                    }

                    $("keysnail-prompt-selector-help-title")
                        .setAttribute("value", modules.util.getLocaleString("promptSelectorKeymapHelpTitle", [displayHelpKey.join(", ")]));
                });

            // }} ======================================================================= //
        },

        get editModeEnabled () {
            return promptEditMode;
        },

        set editModeEnabled (value) {
            promptEditMode = value;

            var button      = $("keysnail-prompt-toggle-edit-mode-button");
            var iconURL     = "chrome://keysnail/skin/icon/prompt-" + (value ? "edit" : "view") + "-mode.png";
            var tooltipText = modules.util.getLocaleString("promptEditMode" + (value ? "Enabled" : "Disabled"));
            button.setAttribute("image", iconURL);
            button.setAttribute("tooltiptext", tooltipText);
            modules.display.echoStatusBar(tooltipText, 2000);
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

        set ignoreDuplication(aBool) { options.ignoreDuplication = !!aBool; },
        get ignoreDuplication() { return options.ignoreDuplication; },

        set substrMatch(aBool) { options.substrMatch = !!aBool; },
        get substrMatch() { return options.substrMatch; },

        set rows(aNum) {
            if (typeof aNum === "number")
                options.listboxMaxRows = Math.round(aNum);
        },
        get rows() {
            return options.listboxMaxRows;
        },

        set useMigemo(aBool) {
            options.useMigemo = !!aBool;
        },

        set migemoMinWordLength(aNum) {
            if (typeof aNum === "number")
                options.migemoMinWordLength = Math.round(aNum);
        },

        set displayDelayTime(aMiliSec) {
            if (typeof aMiliSec === "number")
                options.displayDelayTime = aMiliSec;
        },

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
                let index;

                if (compIndexList === null)
                {
                    setListBoxFromStringList(wholeList);
                    setRows(wholeList.length);

                    index = Math.min(Math.max(0, wholeListIndex), wholeList.length - 1);
                    wholeListIndex = index;
                }
                else
                {
                    setListBoxFromIndexList(wholeList, compIndexList);
                    setRows(compIndexList.length);

                    index = Math.min(Math.max(0, compIndex), compIndexList.length - 1);
                    compIndex = index;
                }

                setListBoxSelection(typeof aSelectIndex === "number" ? aSelectIndex : index);

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
                var candidates = selectorContext[SELECTOR_STATE_CANDIDATES];
                callbackArg = [aCanceled ? -1 : candidates.wholeListIndex, candidates.wholeList];
                if (selectorFilter)
                    callbackArg = selectorFilter.apply(KeySnail, callbackArg);
                break;
            case TYPE_READ:
                callbackArg = [aCanceled ? null : textbox.value, savedUserArg];
                break;
            }

            // continuous
            if (aAgain)
            {
                if (savedFocusedElement)
                    savedFocusedElement.focus();
                executeCallback(savedCallback, callbackArg);
                textbox.focus();

                return;
            }

            // ==================== reset states ==================== //

            /**
             * We need to call focus() here
             * because the callback sometimes change the current selected tab
             * e.g. opening the URL in a new tab,
             * and the window.focus() does not work that time.
             */
            if (savedFocusedElement)
            {
                savedFocusedElement.focus();
                savedFocusedElement = null;
            }

            clearTimeout(delayedCommandTimeout);
            eventListenerRemover();

            // -------------------- common -------------------- //

            currentCallback    = null;
            currentUserArg     = null;

            userOnChange    = null;
            userOnFinish    = null;
            beforeSelection = null;
            afterSelection  = null;

            cellStylist = null;

            // -------------------- prompt.selector (and prompt.reader) -------------------- //

            delayedCommandTimeout = null;
            selectorFilter        = null;
            wholeListIndex        = -1;
            listHeader            = null;
            listStyle             = null;
            listWidth             = null;
            flags                 = null;
            currentList           = null;
            currentIndexList      = null;

            // -------------------- prompt.read -------------------- //

            currentHead        = null;
            inNormalCompletion = false;
            compIndex          = 0;
            compIndexList      = null;

            resetState(history);
            resetState(completion);

            // -------------------- DOM objects -------------------- //

            promptbox.hidden   = true;
            listbox.hidden     = true;

            removeAllChilds(listbox);

            textbox.value      = "";
            label.value        = "";

            $("keysnail-prompt-display-selector-help-button").setAttribute("hidden", true);

            // ==================== execute callback ==================== //

            if (!aCanceled)
                aCanceled = !executeCallback(savedCallback, callbackArg, aCanceled);

            // if canceled or error occurred in callback, reset statusbar
            if (aCanceled)
                modules.display.echoStatusBar("");

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
                modules.display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;

            type = TYPE_READ;

            // set up history
            history.index = 0;
            aGroup = aGroup || "default";
            if (aGroup && typeof historyHolder[aGroup] === "undefined")
                historyHolder[aGroup] = [];
            history.list = historyHolder[aGroup];

            // set up completion
            completion.list = aCollection;
            completion.index = aInitialCount || 0;

            // set up callbacks
            currentCallback = aCallback;
            currentUserArg = aUserArg;

            // display prompt box
            label.value = aMsg;
            textbox.value = aInitialInput || "";
            self.editModeEnabled = false;
            promptbox.hidden = false;
            // do not set selection value till textbox appear (cause crash)
            textbox.selectionStart = textbox.selectionEnd = 0;

            // now focus to the input area
            textbox.focus();

            readerKeymap = actionKeys["read"];

            // add event listener
            textbox.addEventListener('keypress', handleKeyPressRead, false);
            textbox.addEventListener('keyup', handleKeyUpRead, false);
            listbox.addEventListener('click', modules.util.stopEventPropagation, true);
            listbox.addEventListener('mousedown', handleMouseDownRead, true);
            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressRead, false);
                textbox.removeEventListener('keyup', handleKeyUpRead, false);
                listbox.removeEventListener('click', modules.util.stopEventPropagation, true);
                listbox.removeEventListener('mousedown', handleMouseDownRead, true);
            };

            modules.display.echoStatusBar(modules.util.getLocaleString("promptKeyDescription"));
        },

        /**
         * Extended version of the prompt.read()
         */
        reader: function (aContext) {
            if (!promptbox)
                return;

            if (currentCallback)
            {
                modules.display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;
            if (aContext.supressRecoverFocus)
                savedFocusedElement = null;

            type = TYPE_READ;

            // set up history
            history.index = 0;
            var group = aContext.group || "default";
            if (group && typeof historyHolder[group] === "undefined")
                historyHolder[group] = [];
            history.list = historyHolder[group];

            // set up completion
            completion.list  = aContext.collection;
            completion.index = aContext.initialcount || 0;

            // set up callbacks
            currentCallback = aContext.callback;
            currentUserArg  = aContext.userarg;

            // set up stylist
            cellStylist = aContext.stylist;

            userOnChange = aContext.onChange;
            userOnFinish = aContext.onFinish;

            flags      = aContext.flags;
            listHeader = aContext.header;
            listStyle  = aContext.style;
            listWidth  = aContext.width;

            // display prompt box
            label.value            = aContext.message;
            textbox.value          = aContext.initialinput || "";
            self.editModeEnabled = false;
            promptbox.hidden       = false;
            textbox.selectionStart = textbox.selectionEnd = aContext.cursorEnd ? textbox.value.length : 0;

            textbox.focus();

            readerKeymap = combineObject(actionKeys["read"], aContext.keymap || {});

            // add event listener
            textbox.addEventListener('keypress', handleKeyPressRead, false);
            textbox.addEventListener('keyup', handleKeyUpRead, false);
            listbox.addEventListener('click', modules.util.stopEventPropagation, true);
            listbox.addEventListener('mousedown', handleMouseDownRead, true);
            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressRead, false);
                textbox.removeEventListener('keyup', handleKeyUpRead, false);
                listbox.removeEventListener('click', modules.util.stopEventPropagation, true);
                listbox.removeEventListener('mousedown', handleMouseDownRead, true);
            };

            modules.display.echoStatusBar(aContext.description || modules.util.getLocaleString("promptKeyDescription"));
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
                modules.display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = document.commandDispatcher.focusedElement || content.window;
            if (aContext.supressRecoverFocus)
                savedFocusedElement = null;

            // tell current command is the selector
            type = TYPE_SELECTOR;

            // set up completion
            wholeList  = typeof aContext.collection === "function" ? aContext.collection.call() : aContext.collection;
            flags      = aContext.flags;
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

            // set up stylist
            cellStylist = aContext.stylist;

            // display prompt box
            label.value = aContext.message;
            self.editModeEnabled = false;
            promptbox.hidden = false;
            // do not set selection value till textbox appear (cause crash)
            textbox.selectionStart = textbox.selectionEnd = 0;

            // now focus to the input area
            textbox.focus();

            function singleClickHandler(aEvent) {
                modules.util.stopEventPropagation(aEvent);
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
            selectorContext[SELECTOR_STATE_ACTION].flags      = [modules.IGNORE | modules.HIDDEN, 0];

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

            createCompletionList();

            if (typeof aContext.initialIndex === 'number')
            {
                wholeListIndex = aContext.initialIndex;
                setListBoxSelection(wholeListIndex);
            }
        },

        message: KeySnail.message
    };

    return self;
}();

