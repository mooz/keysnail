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

    // event listener remover
    var eventListenerRemover;

    // DOM Objects
    var promptbox;
    var container;
    var label;
    var textbox;
    var listbox;

    // Callbacks
    var currentCallback;
    var currentUserArg;

    // Saved last user focsed element
    var savedFocusedElement;

    // ==================== Options ==================== //

    var isSelector = false;
    var substrMatch = true;
    var ignoreDuplication = true;

    // Migemo
    var useMigemo = false;
    var migemoMinWordLength = 2;

    var listboxMaxRows = 12;    // max row count of the list

    // ==================== Current State ==================== //

    // -------------------- prompt.read specific -------------------- //

    var currentHead;
    var currentSubstr;
    var inNormalCompletion = false;

    // -------------------- common -------------------- //

    var compIndex;
    var compIndexList;

    var listboxRows;            // actual listbox row count
    var listboxColumns;         // actual listbox column count

    // ListBox settings
    var currentList;
    var currentIndexList;
    var flags;
    var listHeader;

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

    function resetState(aType) {
        aType.index = 0;
        aType.state = false;
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
        return (typeof(aList) == 'object' && typeof(aList[0]) == 'object');
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
        var hasIcon = false;

        if (flags) {
            flags.forEach(
                function (flag) {
                    hasIcon |= (flag & modules.ICON);
                    if (flag & (modules.HIDDEN | modules.ICON))
                        aColumn--;
                });
        }

        removeAllChilds(listbox);

        if (aColumn > 1 || hasIcon) {
            var item;
            var head = document.createElement("listhead");
            var cols = document.createElement("listcols");

            for (var i = 0; i < aColumn; ++i) {
                if (listHeader) {
                    item = document.createElement("listheader");
                    item.flex = 1;
                    item.setAttribute("label", listHeader[i]);
                    head.appendChild(item);
                }

                item = document.createElement("listcol");
                item.flex = 1;
                item.setAttribute("width", (100 / aColumn).toString() + "%");
                cols.appendChild(item);
            }

            if (listHeader)
                listbox.appendChild(head);
            listbox.appendChild(cols);
        }

        listboxColumns = aColumn;
    }

    function setRows(aRow) {
        listboxRows = (aRow < listboxMaxRows) ? aRow : listboxMaxRows; 
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

            for (var i = 0; i < aCells.length; ++i) {
                if (isFlagOn(i, modules.HIDDEN))
                    continue;

                cell = document.createElement("listcell");

                if (isFlagOn(i, modules.ICON)) {
                    cell.setAttribute("class", "listcell-iconic");
                    cell.setAttribute("image", getCellValue(aCells, i));
                    i = getNextVisibleRowIndex(i);
                }

                if (i < aCells.length) {
                    cell.setAttribute("label", getCellValue(aCells, i)); 
                    if (isFlagOn(i, modules.RIGHT))
                        cell.setAttribute("style", "text-align:right");
                }

                row.appendChild(cell);
            }
        } else {
            row.setAttribute("label", getCellValue(aCells, 0));
            if (isFlagOn(0, modules.RIGHT))
                row.setAttribute("style", "text-align:right");
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
        var count = Math.min(listboxMaxRows, aLength) + aOffset;
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
    var displayDelayTime = 300;
    var delayedCommandTimeout;

    var currentRegexp;
    var selectorIndexToPass;

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
                displayDelayTime);
        }

        oldTextLength = textbox.value.length;
    }

    /**
     * KeyPress Event handler for prompt.selector
     * @param {KeyBoardEvent} aEvent event which called this handler
     */
    function handleKeyPressSelector(aEvent) {
        switch (aEvent.keyCode) {
        case KeyEvent.DOM_VK_ESCAPE:
            // cancel
            finish(true);
            break;
        case KeyEvent.DOM_VK_RETURN:
        case KeyEvent.DOM_VK_ENTER:
            finish();
            break;
        case KeyEvent.DOM_VK_UP:
            selectNextCompletion(-1, true);
            break;
        case KeyEvent.DOM_VK_DOWN:
            selectNextCompletion(1, true);
            break;
        case KeyEvent.DOM_VK_PAGE_DOWN:
            selectNextCompletion(listboxRows, true);
            break;
        case KeyEvent.DOM_VK_PAGE_UP:
            selectNextCompletion(-listboxRows, true);
            break;
        case KeyEvent.DOM_VK_HOME:
            setListBoxSelection(0);
            setListBoxIndex(0);
            break;
        case KeyEvent.DOM_VK_END:
            var lastIndex = (currentIndexList ? currentIndexList.length : currentList.length) - 1;
            setListBoxIndex(lastIndex);
            setListBoxSelection(lastIndex);
            break;
        case KeyEvent.DOM_VK_TAB:
            modules.util.stopEventPropagation(aEvent);
            selectNextCompletion(aEvent.shiftKey ? -1 : 1, true);
            break;
        default:
            break;
        }
    }

    function setListBoxIndex(aIndex) {
        if (compIndexList) {
            compIndex = aIndex;
            selectorIndexToPass = compIndexList[aIndex];
        } else {
            completion.index = aIndex;
            selectorIndexToPass = aIndex;
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

    function selectNextCompletion(aDirection, aRing) {
        var nextIndex, currentIndex, totalLength;

        if (!compIndexList && currentRegexp) {
            selectorDisplayStatusbarLine(currentRegexp, -1);
            // set index to pass
            selectorIndexToPass = -1;
            return;
        }

        if (compIndexList) {
            // with regexp
            nextIndex    = getNextIndex(compIndex, aDirection, 0, compIndexList.length, aRing);
            currentIndex = compIndex;
            totalLength  = compIndexList.length;
            // set global value
            compIndex    = nextIndex;
            selectorIndexToPass = compIndexList[nextIndex];
        } else {
            // whole list
            nextIndex        = getNextIndex(completion.index, aDirection, 0, completion.list.length, aRing);
            currentIndex     = completion.index;
            totalLength      = completion.list.length;
            // set global value
            completion.index = nextIndex;
            selectorIndexToPass = nextIndex;
        }

        setListBoxSelection(nextIndex, currentIndex);
        selectorDisplayStatusbarLine(currentRegexp, nextIndex, totalLength);
    }

    function createCompletionList() {
        if (!completion.list || !completion.list.length) {
            modules.display.echoStatusBar("No " + completion.name + " found", 1000);
            selectorIndexToPass = -1;
            return;
        }

        var index;
        var start = textbox.selectionStart;

        if (start == 0) {
            // create list of whole completion
            compIndexList = null;
            setListBoxFromStringList(completion.list);
            setRows(completion.list.length);
            listbox.hidden = false;
            completion.index = index = 0;
            currentRegexp = "";
        } else {
            var listLen = completion.list.length;
            var regexp = textbox.value;

            var substrIndex;

            // generate new completion list
            compIndexList = [];
            compIndex = 0;

            var keywords = regexp.split(" ");
            var useMigemoActual = (useMigemo &&
                                   window.xulMigemoCore &&
                                   keywords.every(function (aStr) aStr.length >= migemoMinWordLength));

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
            if (isMultipleList(completion.list)) {
                // multiple cols
                if (cellForSearch) {
                    // user specified the cells to ignore
                    matcher = (useMigemoActual) ?
                        function () {
                            return cellForSearch.some(
                                function (j) {
                                    return getCellValue(completion.list[i], j).match(migexp, "i");
                                });
                        }
                    : function () {
                        return keywords.every(
                            function (keyword) {
                                return cellForSearch.some(
                                    function (j) {
                                        return getCellValue(completion.list[i], [j]).match(keyword, "i");
                                    }
                                );
                            }
                        );
                    };  
                } else {
                    matcher = (useMigemoActual) ?
                        function () {
                            return completion.list[i].some(
                                function (item) {
                                    return (typeof item == "function" ?
                                            item.call(null, completion.list[i]) : item).match(migexp, "i");
                                }
                            );
                        }
                    : function () {
                        return keywords.every(
                            function (keyword) {
                                return completion.list[i].some(
                                    function (item, i) {
                                    return (typeof item == "function" ?
                                            item.call(null, completion.list[i]) : item).match(migexp, "i");
                                        return item.match(keyword, "i");
                                    }
                                );
                            }
                        );
                    };   
                }
            } else {
                // single col
                matcher = (useMigemoActual) ?
                    function () { return completion.list[i].match(migexp, "i"); }
                : function () {
                    return keywords.every(
                        function (keyword) { return completion.list[i].match(keyword, "i"); }
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
                selectorIndexToPass = -1;
                return;
            }

            index = compIndexList[0];
            currentRegexp = regexp;

            setListBoxFromIndexList(completion.list, compIndexList);

            // show
            setRows(compIndexList.length);
            listbox.hidden = false;
        }

        selectorIndexToPass = index;

        setListBoxSelection(0);
        selectorDisplayStatusbarLine(currentRegexp, 0,
                                     compIndexList ? compIndexList.length : completion.list.length);
    }

    // ============================== prompt.read main ============================== //

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
        switch (aEvent.keyCode) {
        case KeyEvent.DOM_VK_TAB:
        case KeyEvent.DOM_VK_SHIFT:
            break;
        default:
            // modules.display.prettyPrint(["old :: " + oldSelectionStart,
            //                              "cur :: " + textbox.selectionStart].join("\n"));
            if (textbox.selectionStart != oldSelectionStart &&
                textbox.selectionStart != textbox.value.length) {
                resetReadState();
            }
            oldSelectionStart = textbox.selectionStart;                        
            break;
        }
    }

    function handleKeyPressRead(aEvent) {
        switch (aEvent.keyCode) {
        case KeyEvent.DOM_VK_ESCAPE:
            finish(true);
            break;
        case KeyEvent.DOM_VK_RETURN:
        case KeyEvent.DOM_VK_ENTER:
            finish();
            break;
        case KeyEvent.DOM_VK_UP:
            if (completion.state) {
                fetchItem(completion, -1, true, true, substrMatch, true);
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
        case KeyEvent.DOM_VK_DOWN:
            if (completion.state) {
                fetchItem(completion, 1, true, true, substrMatch, true);
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
        case KeyEvent.DOM_VK_TAB:
            modules.util.stopEventPropagation(aEvent);

            if (completion.state) {
                fetchItem(completion, aEvent.shiftKey ? -1 : 1, true, true, substrMatch, true);
            } else {
                fetchItem(completion, 0, true, true, substrMatch, true);
                completion.state = true;
            }
            // reset history index
            resetState(history);
            break;
        default:
            break;
        }
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
                currentSubstr = aSubstrMatch ? header : null;

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
                                          " Match for [" + (currentSubstr || currentHead) + "]" +
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

    /**
     * Finish inputting and current the prompt and If user can
     * @param {boolean} aCanceled true, if user canceled the prompt
     */
    function finish(aCanceled) {
        clearTimeout(delayedCommandTimeout);
        eventListenerRemover();

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

        // ==================== temporary preservation ==================== //

        var savedCallback = currentCallback;
        var savedUserArg  = currentUserArg;

        var callbackArg;
        if (isSelector) {
            // prompt.selector
            callbackArg = aCanceled ? -1 : selectorIndexToPass;
        } else {
            // prompt.read
            callbackArg = aCanceled ? null : textbox.value;
        }

        // ==================== reset states ==================== //

        // -------------------- common -------------------- //

        currentCallback    = null;
        currentUserArg     = null;

        // -------------------- prompt.selector -------------------- //

        delayedCommandTimeout = null;
        selectorIndexToPass   = -1;
        listHeader            = null;
        flags                 = null;
        currentList           = null;
        currentIndexList      = null;

        // -------------------- prompt.read -------------------- //

        currentHead        = null;
        currentSubstr      = null;
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

        if (savedCallback) {
            // try to execute
            try {
                savedCallback(callbackArg, savedUserArg);
            } catch (x) {
                self.message(x);
                aCanceled = true;
            }

            // add history (not in the prompt.selector)
            if (!aCanceled && !isSelector && callbackArg.length) {
                if (ignoreDuplication) {
                    // remove all duplicated elements from list and add str to head
                    var li = history.list;
                    for (var i = 0; i < li.length; ++i) {
                        if (callbackArg == li[i]) {
                            li.splice(i, 1);
                        }
                    }
                    li.unshift(callbackArg);
                } else {
                    history.list.unshift(callbackArg);
                }
            }
        }

        // if canceled or error occured in callback, reset statusbar
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
            modules.HIDDEN = 1;
            modules.IGNORE = 2;
            modules.ICON   = 4;
            modules.RIGHT  = 8;
        },

        set ignoreDuplication(aBool) { ignoreDuplication = !!aBool; },
        get ignoreDuplication() { return ignoreDuplication; },

        set substrMatch(aBool) { substrMatch = !!aBool; },
        get substrMatch() { return substrMatch; },

        set rows(aNum) {
            if (typeof(aNum) == "number")
                listboxMaxRows = Math.round(aNum);
        },
        get rows() {
            return listboxMaxRows;
        },

        set useMigemo(aBool) {
            useMigemo = !!aBool;
        },

        set migemoMinWordLength(aNum) {
            if (typeof(aNum) == "number")
                migemoMinWordLength = Math.round(aNum);
        },

        set displayDelayTime(aMiliSec) {
            if (typeof(aMiliSec) == "number")
                displayDelayTime = aMiliSec;
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
                this.modules.display.echoStatusBar("Prompt is already used by another command");
                return;
            }

            savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;

            isSelector = false;

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
            // textbox.addEventListener('blur', onBlur, false);
            textbox.addEventListener('keypress', handleKeyPressRead, false);
            textbox.addEventListener('keyup', handleKeyUpRead, false);
            // textbox.addEventListener('input', handleInputRead, false);
            eventListenerRemover = function () {
                // textbox.removeEventListener('blur', onBlur, false);
                textbox.removeEventListener('keypress', handleKeyPressRead, false);
                textbox.removeEventListener('keyup', handleKeyUpRead, false);
                // textbox.removeEventListener('input', handleInputRead, false);
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
                this.modules.display.echoStatusBar("Prompt is already used by another command");
                return;
            }
            
            savedFocusedElement = document.commandDispatcher.focusedElement || content.window;

            // tell current command is the selector
            isSelector = true;

            // set up completion
            completion.list = aContext.collection;
            flags           = aContext.flags;
            listHeader      = aContext.header;

            // set up callbacks
            currentCallback = aContext.callback;

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
            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressSelector, false);
                textbox.removeEventListener('keyup', handleKeyUpSelector, false);
            };

            oldTextLength = 0;

            modules.display.echoStatusBar(modules.util.getLocaleString("dynamicReadKeyDescription"));

            createCompletionList();
        },

        message: KeySnail.message
    };

    return self;
}();
