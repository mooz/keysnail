/**
 * @fileOverview
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

    // key settings
    var actionKeys      = {};
    actionKeys.read     = {};
    actionKeys.selector = {};

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

    // event listener remover
    var eventListenerRemover;

    // Saved last user focsed element
    var savedFocusedElement;

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
        substrMatch: true,
        ignoreDuplication: true,
        useMigemo: false,
        migemoMinWordLength: 2,
        listboxMaxRows: 12,
        displayDelayTime: 300,
        actionsListStyle: ["text-decoration: underline;"]
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
        list: null,
        index: 0,
        state: false,
        name: "History"
    };

    // Completion
    var completion = {
        list: null,
        index: 0,
        state: false,
        name: "Completion"
    };

    // ============================== prompt common functions ============================== //

    function getNextIndex(aCurrent, aDirection, aMin, aMax, aRing) {
        var index = aCurrent + aDirection;
        if (index < aMin)
            index = aRing ? aMax - 1 : aMin;
        if (index >= aMax)
            index = aRing ? 0 : aMax - 1;

        return index;
    }

    function isMultipleList(aList) {
        return (typeof aList == 'object' && typeof(aList[0]) == 'object');
    }

    function getListText(aList, aIndex, aCellNum) {
        if (aCellNum == undefined)
            aCellNum = 0;

        return isMultipleList(aList) ?
            aList[aIndex][aCellNum] : aList[aIndex];
    }

    function isFlagOn(i, aFlag) {
        return (flags && (flags[i] & aFlag));
    }

    // ============================== common DOM manipulation ============================== //

    function setColumns(aColumn) {
        // var hasIcon = false;

        if (flags) {
            flags.forEach(
                function (flag) {
                    // hasIcon |= (flag & modules.ICON);
                    if (flag & (modules.HIDDEN | modules.ICON))
                        aColumn--;
                });
        }

        removeAllChilds(listbox);

        // if (aColumn > 1 || hasIcon) {
        var item;
        var head = document.createElement("listhead");
        var cols = document.createElement("listcols");

        for (var i = 0; i < aColumn; ++i) {
            if (listHeader) {
                item = document.createElement("listheader");
                item.flex = listWidth ? listWidth[i] : 1;
                item.setAttribute("label", listHeader[i]);
                head.appendChild(item);
            }

            item = document.createElement("listcol");
            item.flex = listWidth ? listWidth[i] : 1;

            if (listWidth) {
                item.setAttribute("width", listWidth[i].toString() + "%");
            } else {
                item.setAttribute("width", (100 / aColumn).toString() + "%");
            }

            cols.appendChild(item);
        }

        if (listHeader)
            listbox.appendChild(head);
        listbox.appendChild(cols);
        // }

        listboxColumns = aColumn;
    }

    function setRows(aRow) {
        listboxRows = (aRow < options.listboxMaxRows) ? aRow : options.listboxMaxRows;
        listbox.setAttribute("rows", listboxRows);
    }

    function removeAllChilds(aElement) {
        while (aElement.hasChildNodes()) {
            aElement.removeChild(aElement.firstChild);
        }
    }

    function getNextVisibleRowIndex(aCurrentIndex) {
        for (var i = aCurrentIndex + 1; i < flags.length; ++i) {
            if (!isFlagOn(i, modules.HIDDEN))
                break;
        }

        return i;
    }

    function getCellValue(aCells, i) {
        // this function *MUST* return string
        // null, undefined, integer and other object may cause exception

        if (typeof aCells[i] == "function") {
            return aCells[i].call(null, aCells) || "";
        } else {
            return aCells[i] || "";
        }
    }

    function createRow(aCells) {
        var row = document.createElement("listitem");

        if (aCells.length > 1) {
            var cell;

            for (var i = 0, j = 0; i < aCells.length; ++i) {
                if (isFlagOn(i, modules.HIDDEN))
                    continue;

                cell = document.createElement("listcell");

                if (isFlagOn(i, modules.ICON)) {
                    cell.setAttribute("class", "listcell-iconic");
                    cell.setAttribute("image", getCellValue(aCells, i));
                    i = getNextVisibleRowIndex(i);
                }

                var style = "";
                if (i < aCells.length) {
                    cell.setAttribute("label", getCellValue(aCells, i));
                    if (listStyle && j < listStyle.length && listStyle[j])
                        style += listStyle[j];
                }
                if (style)
                    cell.setAttribute("style", style);

                row.appendChild(cell);
                ++j;
            }
        } else {
            row.setAttribute("label", getCellValue(aCells, 0));
        }

        return row;
    }

    function applyRow(aRow, aCells) {
        if (aCells.length > 1) {
            var cell = aRow.firstChild;

            for (var i = 0; i < aCells.length; ++i) {
                if (isFlagOn(i, modules.HIDDEN))
                    continue;

                if (isFlagOn(i, modules.ICON)) {
                    cell.setAttribute("image", getCellValue(aCells, i));
                    i = getNextVisibleRowIndex(i);
                }

                if (i < aCells.length)
                    cell.setAttribute("label", getCellValue(aCells, i));

                cell = cell.nextSibling;
            }
        } else {
            row.setAttribute("label", getCellValue(aCells, 0));
        }
    }

    function setListBoxSelection(aIndex) {
        var center = Math.round(listboxRows / 2);
        var pos;
        var listLen = currentIndexList ? currentIndexList.length : currentList.length;

        if (listLen <= listboxRows) {
            // just change the selected index of the listbox
            listbox.currentIndex = listbox.selectedIndex = aIndex;
            return;
        }

        if (aIndex <= center)
        {
            setupList(0, aIndex);
        }
        else if (aIndex >= listLen - center)
        {
            setupList(listLen - listboxRows, listboxRows - (listLen - aIndex));
        } else
        {
            setupList(aIndex - center, center);
        }
    }

    function setupList(aOffset, aPos) {
        if (currentIndexList) {
            setListBoxFromIndexList(currentList, currentIndexList, aOffset);
        } else {
            setListBoxFromStringList(currentList, aOffset);
        }

        // set selection of the listbox
        listbox.currentIndex = listbox.selectedIndex = aPos;
    }

    function setListBoxFromStringList(aList, aOffset) {
        setListBoxGeneral(aList, aOffset, aList.length,
                          function (i) { return aList[i]; },
                          function () {
                              currentList      = aList;
                              currentIndexList = null;
                          });
    }

    function setListBoxFromIndexList(aList, aIndexList, aOffset) {
        setListBoxGeneral(aList, aOffset, aIndexList.length,
                          function (i) { return aList[aIndexList[i]]; },
                          function () {
                              currentList      = aList;
                              currentIndexList = aIndexList;
                          });
    }

    function setListBoxGeneral(aGeneralList, aOffset, aLength, itemRetriever, onFinish) {
        aOffset = aOffset || 0;
        var count = Math.min(options.listboxMaxRows, aLength) + aOffset;
        var row;

        if (listbox.hasChildNodes()) {
            // use listbox already created
            var childs = listbox.childNodes;
            var isMultiple = isMultipleList(aGeneralList);

            var i = aOffset, j = 0;

            // skip listcols, listhead, ...
            while (childs[j].nodeName != "listitem")
                j++;

            if (isMultiple) {
                // multiple
                for (; i < count; ++i, ++j) {
                    if (j < childs.length) {
                        row = childs[j];
                        applyRow(row, itemRetriever(i));
                    } else {
                        row = createRow(itemRetriever(i));
                        listbox.appendChild(row);
                    }
                }
            } else {
                // single normal
                for (; i < count; ++i, ++j) {
                    if (j < childs.length) {
                        row = childs[j];
                        row.setAttribute("label", itemRetriever(i));
                    } else {
                        row = document.createElement("listitem");
                        row.setAttribute("label", itemRetriever(i));
                        listbox.appendChild(row);
                    }
                }
            }

            while (j < childs.length) {
                listbox.removeChild(listbox.lastChild);
            }
        } else {
            // set up the new listbox
            if (isMultipleList(aGeneralList)) {
                // multiple
                setColumns(itemRetriever(0).length);
                for (var i = aOffset; i < count; ++i) {
                    row = createRow(itemRetriever(i));
                    listbox.appendChild(row);
                }
            } else {
                // normal
                setColumns(1);
                for (var i = aOffset; i < count; ++i) {
                    row = document.createElement("listitem");
                    row.setAttribute("label", itemRetriever(i));
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

        if (textbox.value.length != oldTextLength) {
            if (delayedCommandTimeout) {
                // self.message(delayedCommandTimeout + " :: clear");
                clearTimeout(delayedCommandTimeout);
            }

            // add delay
            delayedCommandTimeout = setTimeout(
                function () {
                    createCompletionList();
                    delayedCommandTimeout = null;
                },
                options.displayDelayTime);
        }

        oldTextLength = textbox.value.length;
    }

    /**
     * KeyPress Event handler for prompt.selector
     * @param {KeyBoardEvent} aEvent event which called this handler
     */
    function handleKeyPressSelector(aEvent) {
        var key = modules.key.keyEventToString(aEvent);
        var stopEventPropagation = true;
        var keymap = actionKeys["selector"];

        var match;
        if (keymap[key] && (match = keymap[key].match("^prompt-nth-action-(.*)"))) {
            var actions = selectorContext[SELECTOR_STATE_ACTION];
            var num = parseInt(match[1]) - 1;

            if (selectorStatus == SELECTOR_STATE_CANDIDATES) {
                actions.wholeListIndex = num;
            } else {
                // in action state
                wholeListIndex = num;
            }

            if (num < 0 || num >= actions.wholeList.length) {
                finish(true);
            } else {
                finish();
            }
        }

        switch (keymap[key]) {
        case "prompt-cancel":
            finish(true);
            break;
        case "prompt-decide":
            finish();
            break;
        case "prompt-continuous-decide":
            finish(false, true);
            break;
        case "prompt-continuous-decide-and-next":
            finish(false, true);
        case "prompt-next-line":
        case "prompt-next-completion":
            selectNextCompletion(1, true);
            break;
        case "prompt-continuous-decide-and-previous":
            finish(false, true);
        case "prompt-previous-line":
        case "prompt-previous-completion":
            selectNextCompletion(-1, true);
            break;
        case "prompt-next-page":
            selectNextCompletion(listboxRows, true);
            break;
        case "prompt-previous-page":
            selectNextCompletion(-listboxRows, true);
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

            switch (selectorStatus) {
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

            if (delayedCommandTimeout) {
                clearTimeout(delayedCommandTimeout);
            }

            // save current context
            saveSelectorContext(selectorContext[from]);
            // go to other status
            restoreSelectorContext(selectorContext[to]);

            updateSelector(selectorContext[to]);
            break;
        default:
            stopEventPropagation = false;
            break;
        }

        if (stopEventPropagation) {
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
            }, 0);
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
        // self.message(aContext.whole);

        removeAllChilds(listbox);

        if (aContext.compIndexList == null) {
            // create list of whole completion
            setListBoxFromStringList(wholeList);
            setRows(wholeList.length);
        } else {
            setListBoxFromIndexList(wholeList, compIndexList);
            setRows(compIndexList.length);
        }
        listbox.hidden = false;

        selectorDisplayStatusbarLine(currentRegexp, 0, compIndexList ?
                                     compIndexList.length : wholeList.length);

        setListBoxSelection(compIndexList ? compIndex : wholeListIndex);
    }

    function setListBoxIndex(aIndex) {
        if (compIndexList) {
            compIndex = aIndex;
            wholeListIndex = compIndexList[aIndex];
        } else {
            wholeListIndex = aIndex;
        }
    }

    function selectorDisplayStatusbarLine(aQuery, aIndex, aTotalLength) {
        if (aIndex < 0) {
            modules.display.echoStatusBar("No match for [" + aQuery + "]");
        } else {
            modules.display.echoStatusBar("Completion Regexp Match for [" + aQuery + "]" +
                                          " (" + (aIndex + 1) +  " / " + aTotalLength + ")");
        }
    }

    function setSelectorActions(aActions) {
        var context = selectorContext[SELECTOR_STATE_ACTION];

        if (typeof(aActions) === "function") {
            // set callback
            context.wholeList = [[aActions, "1. Default callback"]];
            context.wholeListIndex = 0;
            return;
        }

        var list = [];

        // create action list
        aActions.forEach(
            function (action, i) {
                list.push([action[0], (i + 1).toString() + ". " + action[1]]);
            });

        context.wholeList      = list;
        context.wholeListIndex = 0;
    }

    function selectNextCompletion(aDirection, aRing) {
        var nextIndex, currentIndex, totalLength;

        if (!currentList || !currentList.length) {
            modules.display.echoStatusBar("No " + completion.name + " found", 1000);
            wholeListIndex = -1;
            return;
        }

        if (!compIndexList && currentRegexp) {
            selectorDisplayStatusbarLine(currentRegexp, -1);
            // set index to pass
            wholeListIndex = -1;
            return;
        }

        if (compIndexList) {
            // with regexp
            nextIndex    = getNextIndex(compIndex, aDirection, 0, compIndexList.length, aRing);
            currentIndex = compIndex;
            totalLength  = compIndexList.length;
            // set global value
            compIndex    = nextIndex;
            wholeListIndex = compIndexList[nextIndex];
        } else {
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
        if (!wholeList || !wholeList.length) {
            modules.display.echoStatusBar("No " + completion.name + " found", 1000);
            wholeListIndex = -1;
            return;
        }

        var index;
        var start = textbox.selectionStart;

        if (start == 0) {
            // create list of whole completion
            compIndex = -1;
            compIndexList = null;
            setListBoxFromStringList(wholeList);
            setRows(wholeList.length);
            listbox.hidden = false;
            wholeListIndex = index = 0;
            currentRegexp = "";
        } else {
            var listLen = wholeList.length;
            var regexp = textbox.value;

            var substrIndex;

            // generate new completion list
            compIndexList = [];
            compIndex = 0;

            var keywords = regexp.split(" ");
            var useMigemoActual = (options.useMigemo &&
                                   window.xulMigemoCore &&
                                   keywords.every(function (aStr) aStr.length >= options.migemoMinWordLength));

            if (useMigemoActual)
                var migexp = window.xulMigemoCore.getRegExpFunctional(regexp, {}, {});

            var cellForSearch;
            if (flags) {
                cellForSearch = [];
                flags.forEach(
                    function (flag, i) {
                        if (!(flag & modules.IGNORE))
                            cellForSearch.push(i);
                    });
            }

            // modules.display.prettyPrint((cellForSearch || "nothing").toString());

            var matcher;
            if (isMultipleList(wholeList)) {
                // multiple cols
                if (cellForSearch) {
                    // user specified the cells to ignore
                    matcher = (useMigemoActual) ?
                        function () {
                            return cellForSearch.some(
                                function (j) {
                                    return getCellValue(wholeList[i], j).match(migexp, "i");
                                });
                        }
                    : function () {
                        return keywords.every(
                            function (keyword) {
                                return cellForSearch.some(
                                    function (j) {
                                        return getCellValue(wholeList[i], j).match(keyword, "i");
                                    }
                                );
                            }
                        );
                    };
                } else {
                    matcher = (useMigemoActual) ?
                        function () {
                            return wholeList[i].some(
                                function (item) {
                                    return (typeof(item) == "function" ? item.call(null, wholeList[i]) : item).match(migexp, "i");
                                }
                            );
                        }
                    : function () {
                        return keywords.every(
                            function (keyword) {
                                return wholeList[i].some(
                                    function (item) {
                                        return (typeof item == "function" ? item.call(null, wholeList[i]) : item).match(keyword, "i");
                                    }
                                );
                            }
                        );
                    };
                }
            } else {
                // single col
                matcher = (useMigemoActual) ?
                    function () { return wholeList[i].match(migexp, "i"); }
                : function () {
                    return keywords.every(
                        function (keyword) { return wholeList[i].match(keyword, "i"); }
                    );
                };
            }

            for (var i = 0; i < listLen; ++i) {
                if (matcher()) {
                    compIndexList.push(i);
                }
            }

            if (compIndexList.length == 0) {
                // no candidates found
                removeAllChilds(listbox);
                compIndexList = null;
                currentRegexp = regexp;
                selectorDisplayStatusbarLine(regexp, -1);
                wholeListIndex = -1;
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
        currentHead = null;
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

        // modules.display.prettyPrint(["old :: " + oldSelectionStart,
        //                              "cur :: " + textbox.selectionStart].join("\n"));

        // modules.display.prettyPrint([
        //                                 "aEvent.charCode :: " + aEvent.charCode,
        //                                 "current :: " + textbox.value,
        //                                 "sel :: " + textbox.selectionStart,
        //                                 "(textbox.selectionStart != oldSelectionStart) :: " + (textbox.selectionStart != oldSelectionStart),
        //                                 "(textbox.selectionStart != textbox.value.length) :: " + (textbox.selectionStart != textbox.value.length)
        //                             ].join("\n"));

        if (textbox.selectionStart != oldSelectionStart &&
            textbox.selectionStart != textbox.value.length) {
            resetReadState();
        }
        oldSelectionStart = textbox.selectionStart;
    }

    function handleKeyPressRead(aEvent) {
        var key = modules.key.keyEventToString(aEvent);
        var stopEventPropagation = true;
        var keymap = actionKeys["read"];

        switch (keymap[key]) {
        case "prompt-cancel":
            finish(true);
            break;
        case "prompt-decide":
            finish();
            break;
        case "prompt-next-line":
            if (completion.state) {
                fetchItem(completion, 1, true, true, options.substrMatch, true);
                return;
            }

            if (history.state) {
                fetchItem(history, 1);
            } else {
                fetchItem(history, 0);
                history.state = true;
            }
            // reset completion index
            resetState(completion);
            break;
        case "prompt-previous-line":
            if (completion.state) {
                fetchItem(completion, -1, true, true, options.substrMatch, true);
                return;
            }

            if (history.state) {
                fetchItem(history, -1);
            } else {
                fetchItem(history, 0);
                history.state = true;
            }

            // reset completion index
            resetState(completion);
            break;
        case "prompt-next-completion":
            if (completion.state) {
                fetchItem(completion, 1, true, true, options.substrMatch, true);
            } else {
                // begin
                fetchItem(completion, 0, true, true, options.substrMatch, true);
                completion.state = true;
            }
            // reset history index
            resetState(history);
            break;
        case "prompt-previous-completion":
            if (completion.state) {
                fetchItem(completion, -1, true, true, options.substrMatch, true);
            } else {
                // begin
                fetchItem(completion, 0, true, true, options.substrMatch, true);
                completion.state = true;
            }
            // reset history index
            resetState(history);
            break;
        default:
            stopEventPropagation = false;
            break;
        }

        if (stopEventPropagation) {
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

                if ((after - before) != 0) {
                    var delta = (after - before);
                    if (completion.state) {
                        fetchItem(completion, delta, true, true, options.substrMatch, true);
                        return;
                    }

                    if (history.state) {
                        fetchItem(history, delta);
                    } else {
                        fetchItem(history, 0);
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
    function fetchItem(aType, aDirection, aExpand, aRing, aSubstrMatch, aNoSit) {
        if (!aType.list || !aType.list.length) {
            modules.display.echoStatusBar("No " + aType.name + " found", 1000);
            return;
        }

        var listBoxSelectionIndex;
        var index;
        // get cursor position
        var start = textbox.selectionStart;

        if (start == 0 || inNormalCompletion) {
            // get {current / next / previous} index
            index = getNextIndex(aType.index, aDirection, 0, aType.list.length, aRing);

            if (!inNormalCompletion) {
                // at first time
                setListBoxFromStringList(aType.list);
                setRows(aType.list.length);
                listbox.hidden = false;
            }
            listBoxSelectionIndex = index;

            // normal completion (not the substring matching)
            inNormalCompletion = true;
        } else {
            inNormalCompletion = false;

            // header / substring match
            var header;

            var listLen = aType.list.length;
            var substrIndex;

            if (currentHead != null && compIndexList) {
                // use current completion list
                var nextCompIndex = getNextIndex(compIndex, aDirection,
                                                 0, compIndexList.length, aRing);

                index = compIndexList[nextCompIndex];
                compIndex = nextCompIndex;
                listBoxSelectionIndex = nextCompIndex;
            } else {
                // generate new completion list
                compIndexList = [];
                compIndex = 0;

                header = textbox.value.slice(0, start);

                currentHead = header;

                // modules.display.prettyPrint(header);

                for (var i = 0; i < listLen; ++i) {
                    var foundIndex = getListText(aType.list, i).indexOf(header);
                    if (foundIndex == 0 || (aSubstrMatch && foundIndex != -1)) {
                        compIndexList.push(i);
                    }
                }

                if (compIndexList.length == 0) {
                    compIndexList = null;
                    modules.display.echoStatusBar("No match for [" + currentHead + "]");
                    currentHead = null;
                    return;
                }

                index = compIndexList[0];

                if (aExpand) {
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

        if (inNormalCompletion) {
            modules.display.echoStatusBar(aType.name + " (" + (index + 1) +  " / " + aType.list.length + ")");
        } else {
            modules.display.echoStatusBar(aType.name + (aSubstrMatch ? " Substring" : " Header") +
                                          " Match for [" + currentHead + "]" +
                                          " (" + (compIndex + 1) +  " / " + compIndexList.length + ")");
        }

        // set new text

        textbox.value = getListText(aType.list, index);
        aType.index = index;

        if (aNoSit) {
            textbox.selectionStart = textbox.selectionEnd =
                (inNormalCompletion) ?
                textbox.value.length : currentHead.length;
        } else {
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
        while (true) {
            var header = getListText(aStringList, aIndexList[0]).slice(0, i);

            if (aIndexList.some(
                    function (strIndex) {
                        return (getListText(aStringList, strIndex).slice(0, i) != header)
                            || (i > getListText(aStringList, strIndex).length);
                    }
                )) break;

            i++;
        }

        // modules.display.prettyPrint(getListText(aStringList, aIndexList[0]).slice(0, i - 1));

        return i - 1;
    }

    // ============================== finish ============================== //

    function executeCallback(aCallback, aCallbackArg, aCanceled) {
        if (typeof(aCallback) === "function" && !aCanceled) {
            // try to execute
            try {
                aCallback.apply(modules, aCallbackArg);
            } catch (x) {
                self.message("filename :: " + x.fileName + " :: msg :: " + x);
                return false;
            }

            // add history (prompt.read only)
            if ((type == TYPE_READ) && aCallbackArg[0].length) {
                var text = aCallbackArg[0];

                if (options.ignoreDuplication) {
                    // remove all duplicated elements from list and add str to head
                    var li = history.list;
                    for (var i = 0; i < li.length; ++i) {
                        if (text == li[i]) {
                            li.splice(i, 1);
                        }
                    }
                    li.unshift(text);
                } else {
                    history.list.unshift(text);
                }
            }
        }

        return true;
    }

    /**
     * Finish inputting and current the prompt and If user can
     * @param {boolean} aCanceled true, if user canceled the prompt
     */
    function finish(aCanceled, aAgain) {
        // ==================== temporary preservation ==================== //

        var savedCallback;
        var savedUserArg  = currentUserArg;

        // apply current status to saved context
        if (type === TYPE_SELECTOR) {
            saveSelectorContext(selectorContext[selectorStatus]);
        }

        if (type == TYPE_SELECTOR && wholeListIndex >= 0) {
            var actions     = selectorContext[SELECTOR_STATE_ACTION];
            var actionIndex = actions.wholeListIndex;

            savedCallback = actions.wholeList[actionIndex][0];
        } else {
            savedCallback = currentCallback;
        }

        var callbackArg;

        switch (type) {
        case TYPE_SELECTOR:
            var candidates = selectorContext[SELECTOR_STATE_CANDIDATES];
            callbackArg = [aCanceled ? -1 : candidates.wholeListIndex, candidates.wholeList];
            if (selectorFilter) {
                callbackArg = selectorFilter.apply(KeySnail, callbackArg);
            }
            break;
        case TYPE_READ:
            callbackArg = [aCanceled ? null : textbox.value, savedUserArg];
            break;
        }

        // continuous
        if (aAgain) {
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
        if (savedFocusedElement) {
            savedFocusedElement.focus();
            savedFocusedElement = null;
        }

        clearTimeout(delayedCommandTimeout);
        eventListenerRemover();

        // -------------------- common -------------------- //

        currentCallback    = null;
        currentUserArg     = null;

        // -------------------- prompt.selector -------------------- //

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

        // ==================== execute callback ==================== //

        aCanceled = !executeCallback(savedCallback, callbackArg, aCanceled);

        // if canceled or error occurred in callback, reset statusbar
        if (aCanceled)
            modules.display.echoStatusBar("");
    }

    // ================ public ================ //

    var self = {
        init: function () {
            if (KeySnail.windowType != "navigator:browser")
                return;

            modules = this.modules;

            promptbox = document.getElementById("keysnail-prompt");
            label     = document.getElementById("keysnail-prompt-label");
            textbox   = document.getElementById("keysnail-prompt-textbox");
            container = document.getElementById("browser-bottombox");

            listbox   = document.getElementById("keysnail-completion-list");

            // this holds all history and
            historyHolder = new Object;
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
            self.setActionKey("selector", "<down>" , "prompt-next-line");
            self.setActionKey("selector", "<tab>"  , "prompt-next-line");
            self.setActionKey("selector", "<up>"   , "prompt-previous-line");
            self.setActionKey("selector", "S-<tab>", "prompt-previous-line");
            self.setActionKey("selector", "<next>" , "prompt-next-page");
            self.setActionKey("selector", "<prior>", "prompt-previous-page");
            self.setActionKey("selector", "<home>" , "prompt-beginning-of-candidates");
            self.setActionKey("selector", "<end>"  , "prompt-end-of-candidates");
            self.setActionKey("selector", "C-i"    , "prompt-select-action");
        },

        setActionKey: function(aType, aKey, aAction) {
            // self.message(aType + " :: " + aKey);
            // modules.util.listProperty(actionKeys);
            actionKeys[aType][aKey] = aAction;
        },

        set ignoreDuplication(aBool) { options.ignoreDuplication = !!aBool; },
        get ignoreDuplication() { return options.ignoreDuplication; },

        set substrMatch(aBool) { options.substrMatch = !!aBool; },
        get substrMatch() { return options.substrMatch; },

        set rows(aNum) {
            if (typeof(aNum) == "number")
                options.listboxMaxRows = Math.round(aNum);
        },
        get rows() {
            return options.listboxMaxRows;
        },

        set useMigemo(aBool) {
            options.useMigemo = !!aBool;
        },

        set migemoMinWordLength(aNum) {
            if (typeof(aNum) == "number")
                options.migemoMinWordLength = Math.round(aNum);
        },

        set displayDelayTime(aMiliSec) {
            if (typeof(aMiliSec) == "number")
                options.displayDelayTime = aMiliSec;
        },

        set actionListStyle(aStyle) {
            var style;
            switch (typeof(aStyle)) {
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

            if (currentCallback) {
                modules.display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;

            type = TYPE_READ;

            // set up history
            history.index = 0;
            aGroup = aGroup || "default";
            if (aGroup && typeof(historyHolder[aGroup]) == "undefined")
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
            promptbox.hidden = false;
            // do not set selection value till textbox appear (cause crash)
            textbox.selectionStart = textbox.selectionEnd = 0;

            // now focus to the input area
            textbox.focus();

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

            if (currentCallback) {
                modules.display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = document.commandDispatcher.focusedElement || content.window;

            // tell current command is the selector
            type = TYPE_SELECTOR;

            // set up completion
            wholeList  = typeof(aContext.collection) == "function" ? aContext.collection.call() : aContext.collection;
            flags      = aContext.flags;
            listHeader = aContext.header;
            listStyle  = aContext.style;
            listWidth  = aContext.width;

            selectorFilter = aContext.filter;

            // set up callbacks
            currentCallback = true;

            // display prompt box
            label.value = aContext.message;
            promptbox.hidden = false;
            // do not set selection value till textbox appear (cause crash)
            textbox.selectionStart = textbox.selectionEnd = 0;

            // now focus to the input area
            textbox.focus();

            // add event listener
            textbox.addEventListener('keypress', handleKeyPressSelector, false);
            textbox.addEventListener('keyup', handleKeyUpSelector, false);
            listbox.addEventListener('mousedown', handleMouseDownSelector, true);
            listbox.addEventListener('click', modules.util.stopEventPropagation, true);
            listbox.addEventListener('dblclick', finish, true);
            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressSelector, false);
                textbox.removeEventListener('keyup', handleKeyUpSelector, false);
                listbox.removeEventListener('mousedown', handleMouseDownSelector, true);
                listbox.removeEventListener('click', modules.util.stopEventPropagation, true);
                listbox.removeEventListener('dblclick', finish, true);
            };

            oldTextLength = 0;

            selectorStatus = SELECTOR_STATE_CANDIDATES;
            selectorContext = [];
            selectorContext[SELECTOR_STATE_CANDIDATES]        = createSelectorContext();
            selectorContext[SELECTOR_STATE_ACTION]            = createSelectorContext();
            selectorContext[SELECTOR_STATE_ACTION].listHeader = ["Actions"];
            selectorContext[SELECTOR_STATE_ACTION].listStyle  = options.actionsListStyle;
            selectorContext[SELECTOR_STATE_ACTION].flags      = [modules.IGNORE | modules.HIDDEN, 0];

            // modules.display.echoStatusBar(modules.util.getLocaleString("dynamicReadKeyDescription"));

            setSelectorActions(aContext.actions || aContext.callback);

            createCompletionList();
        },

        message: KeySnail.message
    };

    return self;
}();

