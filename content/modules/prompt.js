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

    function $E(aName, aAttributes) {
        let elem = document.createElement(aName);

        for (let [k, v] in Iterator(aAttributes))
            elem.setAttribute(k, v);

        return elem;
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
        try
        {
            aItem.setAttribute("label", aLabel);
        }
        catch (e)
        {
            self.message(e.stack.split(".js ").join(".js\n"));
        }
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
        let row = document.createElement("listitem");

        if (aRowData.length > 1)
        {
            let cell;

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
        }
        else                    // if (aRowData.length > 1)
        {
            setLabel(row, getCellValue(aRowData, 0));
        }

        return row;
    }

    function applyRow(aRow, aRowData) {
        let cell = aRow.firstChild;

        if (aRowData.length > 1)
        {
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
        else                    // if (aRowData.length > 1)
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

        if (typeof onFinish === "function")
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

        oldTextLength = textbox.selectionEnd;

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
                migexp = window.xulMigemoCore.getRegExpFunctional(regexp, {}, {});

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
                            function (item) (typeof item === "function" ? item.call(null, wholeList[i]) : item || "")
                                .match(migexp, "i")
                        )
                    :
                    function (i) keywords.every(
                        function (keyword) wholeList[i].some(
                            function (item) (typeof item === "function" ? item.call(null, wholeList[i]) : item || "")
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

            let start = Date.now();
            for (let i = 0; i < listLen; ++i)
            {
                if (matcher(i))
                    compIndexList.push(i);
            }
            let end = Date.now();

            self.message(end - start);

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

    // ================================================================================ //
    // prompt.read, prompt.completer
    // ================================================================================ //

    const ST_NEUTRAL = 0;
    const ST_QUOTE   = 1;
    const ST_WORD    = 2;

    function lex(str, delimiters, quotes)
    {
        if (!delimiters)
            delimiters = [' ', '\t'];

        if (!quotes)
            quotes = ['"', '\''];

        let tokens = [];
        let state  = ST_NEUTRAL;

        let buffer = [];
        let current;

        let quoteChar;

        for (let i = 0; i < str.length; ++i)
        {
            let current = str[i];

            switch (state)
            {
                // ================================================== //
                // Skip (Initial state)
                // ================================================== //
            case ST_NEUTRAL:

                if (buffer.length)
                {
                    tokens.push(buffer.join(""));
                    buffer = [];
                }

                switch (current)
                {
                case delimiters.some(function (d) d === current):
                    break;
                case quotes.some(function (q) q === current):
                    buffer.push(current);
                    state     = ST_QUOTE;
                    quoteChar = current; // ' or "
                    break;
                default:
                    buffer.push(current);
                    state = ST_WORD;
                    break;
                }
                break;
                // ================================================== //
                // In quote
                // ================================================== //
            case ST_QUOTE:
                if (current === quoteChar)
                    state = ST_NEUTRAL;
                buffer.push(current);
                break;
                // ================================================== //
                // Word
                // ================================================== //
            case ST_WORD:
                if (delimiters.some(function (d) d === current))
                    state = ST_NEUTRAL;
                else
                    buffer.push(current);
                break;
                // ================================================== //
            }
        }

        if (buffer.length)
            tokens.push(buffer.join(""));

        return [tokens, state];
    }

    function range(a, b) {
        for (let i = a; i < b; ++i)
            yield i;
    }

    function completerDisplayCompletions(completions) {

    }

    function completerSelectNthCompletion(n) {

    }

    function getCompletionList(args, query) {
        return [0,
                [[i, i + " desu"] for (i in range(0, 100))]];

        var options = {
            "-t" : "Title",
            "-n" : "Notation",
            "-c" : "Church"
        };

        if (!query)
        {
            // with option
            if (args.length && args[args.length - 1] && args[args.length - 1][0] === "-")
            {
                let option = args[args.length - 1];

                if (option in options)
                    return [options[option], "hoge!"];

                return ["Invalid", ""];
            }

            // all
            return [[k, v] for ([k, v] in Iterator(options))];
        }

        return [[k, v] for ([k, v] in Iterator(options)) if (k.indexOf(query) !== -1)];
    }

    let completerState = {
        index                   : -1,
        query                   : null,
        completions             : null,
        preferredCursorPosition : 0
    };

    function resetCompleterState() {
        completerState.index                   = -1;
        completerState.query                   = null;
        completerState.completions             = null;
        completerState.preferredCursorPosition = 0;
    }

    function handleKeyUpCompleter(aEvent) {
        if (textbox.selectionStart !== completerState.preferredCursorPosition)
            resetCompleterState();

        if (typeof userOnChange === "function")
        {
            let (arg = {
                     textbox : textbox,
                     event   : aEvent
                 }) userOnChange(arg);
        }
    }

    function handleKeyPressCompleter(aEvent) {
        var key = modules.key.keyEventToString(aEvent);

        var stopEventPropagation = true;
        var keymap               = readerKeymap;

        let completeDirection = 0;

        switch (keymap[key])
        {
        case "prompt-cancel":
            self.finish(true);
            break;
        case "prompt-decide":
            self.finish();
            break;
        case "prompt-next-completion":
            completeDirection = 1;
            break;
        case "prompt-previous-completion":
            completeDirection = -1;
            break;
        default:
            stopEventPropagation = false;
            break;
        }

        if (completionDirection)
        {
            if (completerState.index >= 0)
            {
                // 補完中
                let nextIndex = getNextIndex(completerState.index, completionDirection,
                                             0, completerState.completions.length, true);
                completerSelectNthCompletion(nextIndex);
            }
            else
            {
                // 補完開始
                let currentText   = (textbox.value || "").substring(0, textbox.selectionStart);
                let [args, state] = lex(currentText);
                let origin        = -1;

                // 補完候補を作成する
                switch (state)
                {
                case ST_QUOTE:
                    modules.display.echoStatusBar("Quotation is not closed", 1000);
                    break;
                case ST_WORD:
                    self.message("[%s", args[args.length - 1]);
                    // 最後の一つがクエリとなる (クエリを使って前方一致や Migemo 検索をし補完候補を生成)
                    [origin, completerState.completions] = getCompletionList(args, args[args.length - 1]);
                    break;
                case ST_NEUTRAL:
                    self.message("[%s]", args[args.length - 1]);
                    [origin, completerState.completions] = getCompletionList(args, null);
                    // 全ての補完候補を表示
                    break;
                }

                if (origin >= 0)
                {
                    completerDisplayCompletions(completerState.completions);
                    completerSelectNthCompletion(origin);
                }
                else
                {
                    // クリア
                    // completerClear();
                }
            }
        }

        if (stopEventPropagation)
        {
            aEvent.preventDefault();
            aEvent.stopPropagation();
        }
    }

    // ====================================================================== //
    // prompt.read, prompt.reader
    // ====================================================================== //

    const READER_ST_NEUT = 0;   // neutral
    const READER_ST_COMP = 1;   // completion
    const READER_ST_HIST = 2;   // history

    var readerCurrentCollection = null;
    var readerCurrentIndex      = null;

    var readerState       = READER_ST_NEUT;
    var readerArgs        = null;
    var readerQuery       = null;
    var readerLeftContext = null;

    function setReaderArgs(aArgs) {
        readerArgs  = aArgs;
        readerQuery = aArgs ? aArgs[aArgs.length - 1] : null;
    }

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

    function readerSetupList(aList, aIndex) {
        let pos;
        let center  = Math.round(listboxRows / 2);
        let listLen = aList.length;

        // if (listLen <= listboxRows && !cellStylist)
        // {
        //     // just change the selected index of the listbox
        //     listbox.currentIndex = listbox.selectedIndex = aIndex;
        //     return;
        // }

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

        self.message(selectionPos);

        listbox.currentIndex = listbox.selectedIndex = selectionPos;
    }

    let tags         = ("hBookmark" in window) ? hBookmark.model('Tag').findDistinctTags() : [];
    let filteredTags = [tag.name for each (tag in tags)];

    function completer(args, query) {
        if (query)
        {
            let migexp = window.xulMigemoCore.getRegExpFunctional(query, {}, {});
            self.message(migexp);
            return filteredTags.filter(function (s) !!s.match(migexp, "i"));
        }
        else
        {
            return filteredTags;
        }

        let options = {
            "-t": [
                [[i + ". time", "hehe"] for (i in range(0, 100))]
            ],
            "-n": [
                [[i + ". noun", "huhu"] for (i in range(0, 100))]
            ],
            "-p": [
                [[i + ". person", "hoho"] for (i in range(0, 100))]
            ]
        };

        let opt = args[args.length - 2];

        if (opt)
        {
            if (opt in options)
            {
                return options[opt];
                // return options[opt].filter(function ([str]) str.indexOf(query || ""));
            }
            else
            {
                return null;
            }
        }

        // if (query)
        // {
            return [[opt, "desc"] for (opt in options)];
        // }
        // else
        // {
        // }
    }

    var oldSelectionStart = 0;
    function handleKeyUpRead(aEvent) {
        if (textbox.selectionStart !== oldSelectionStart)
        {
            readerState = READER_ST_NEUT;
            // resetReadState();
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
        let stopEventPropagation = true;

        let key    = modules.key.keyEventToString(aEvent);
        let keymap = readerKeymap;

        let direction = 0;

        let oldState = readerState;

        switch (keymap[key])
        {
        case "prompt-cancel":
            self.finish(true);
            break;
        case "prompt-decide":
            self.finish();
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

        if (direction)
        {
            stopEventPropagation = true;

            if (oldState !== readerState)
            {
                // 候補の作成
                let currentText   = (textbox.value || "").substring(0, textbox.selectionStart);
                // self.message('txt "%s"', currentText);
                let [args, state] = lex(currentText, [" "], []);
                let query = (state === ST_NEUTRAL) ? null : args[args.length - 1];

                setReaderArgs(args);

                let completionList = completer(args, query);

                if (!completionList || !completionList.length)
                {
                    readerState = READER_ST_NEUT;
                    modules.display.echoStatusBar("No completions found", 1000);
                }
                else
                {
                    readerCurrentCollection = completionList;
                    readerCurrentIndex      = direction > 0 ? 0 : completionList.length - 1;
                    readerLeftContext       = query ? currentText.slice(0, currentText.lastIndexOf(query)) : currentText;

                    // self.message('que "%s"', query);
                    // self.message('con "%s"', readerLeftContext);

                    setRows(completionList.length);

                    listbox.hidden = false;

                    readerSetupList(completionList, readerCurrentIndex);
                }
            }
            else
            {
                readerCurrentIndex = getNextIndex(readerCurrentIndex, direction,
                                                  0, readerCurrentCollection.length, true);

                readerSetupList(readerCurrentCollection, readerCurrentIndex);

                // 次 / 前の候補へ
                switch (readerState)
                {
                case READER_ST_HIST:
                    break;
                case READER_ST_COMP:
                    break;
                }
            }

            if (readerState !== READER_ST_NEUT)
            {
                let text          = readerCurrentCollection[readerCurrentIndex];
                textbox.value     = readerLeftContext + text;
                oldSelectionStart = textbox.value.length;
            }
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

        let currentText   = (textbox.value || "").substring(0, textbox.selectionStart);
        let [args, state] = lex(currentText);

        var listBoxSelectionIndex;
        var index;

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
     *
     * @param {object} aType history, completion
     * @param {int} aDirection 0, -1, 1
     * @param {boolean} aExpand if this value is true, "head" expands greedly
     * @param {boolean} aRing whether connect completion list head and tail or not
     * @param {boolean} aSubstrMatch whether use substring match or not
     * @param {boolean} aNoSit whether move caret or not
     */
    function readerComplete2(aType, aDirection, aExpand, aRing, aSubstrMatch, aNoSit) {
        if (!aType.list || !aType.list.length)
        {
            modules.display.echoStatusBar("No " + aType.name + " found", 1000);
            return;
        }

        let currentText   = (textbox.value || "").substring(0, textbox.selectionStart);
        let [args, state] = lex(currentText);

        var listBoxSelectionIndex;
        var index;

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

