/**
 * @fileOverview
 * @name prompt.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Prompt = function () {
    // ================ private ================ //

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

    var savedFocusedElement;

    // Options
    var isSelector = false;
    var itemIndexToUse = 0;

    var substrMatch = true;
    var ignoreDuplication = true;

    var currentHead;
    var currentSubstr;
    var compIndex;
    var compIndexList;
    var inNormalCompletion = false;

    var listboxMaxRows = 10;
    var listboxRows;

    // ListBox settings
    var currentList;
    var currentIndexList;

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

    function onBlur() {
        finish(true);
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
    function handleKeyDownRead(aEvent) {
        // Some KeyPress event is grabbed by KeySnail and stopped.
        // So we need to listen the keydown event for resetting the misc values.
        switch (aEvent.keyCode) {
        case KeyEvent.DOM_VK_TAB:
        case KeyEvent.DOM_VK_SHIFT:
            break;
        default:
            // when the keydown event occured,
            // the textbox value is old (keyevent is not applied)
            // so we need to delay to know the correct selection
            setTimeout(function () {
                           // modules.display.prettyPrint("old :: " + oldSelectionStart + "\n"
                           //                             + "now :: " + textbox.selectionStart);
                           if (textbox.selectionStart != oldSelectionStart &&
                               textbox.selectionStart != textbox.value.length) {
                               resetReadState();
                           }
                           oldSelectionStart = textbox.selectionStart;
                       }, 0);
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

    function handleKeyDownSelector(aEvent) {
        switch (aEvent.keyCode) {
        default:
            setTimeout(function () {
                           if (textbox.value.length != oldTextLength) {
                               if (delayedCommandTimeout) {
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
                       }, 0);
            break;
        }
    }

    var oldTextLength = 0;
    var displayDelayTime = 300;
    var delayedCommandTimeout;

    /**
     * KeyPress Event handler for dynamic completing selector
     * @param {} aEvent
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
        case KeyEvent.DOM_VK_TAB:
            modules.util.stopEventPropagation(aEvent);
            selectNextCompletion(aEvent.shiftKey ? -1 : 1, true);
            break;
        default:
            break;
        }
    }

    function setColumns(aColumn) {
        removeAllChilds(listbox);

        if (aColumn > 1) {
            var listcols = document.createElement("listcols");

            var item;
            for (var i = 0; i < aColumn; ++i) {
                item = document.createElement("listcol");
                item.flex = 1;
                item.setAttribute("width", (100 / aColumn).toString() + "%");
                listcols.appendChild(item);
            }

            listbox.appendChild(listcols);
        }
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

    function createRow(aCells) {
        var row = document.createElement("listitem");

        if (aCells.length > 1) {
            var cell;

            //   arg1 , arg2 , arg3 , ... ,
            // | col1 | col2 | col3 | ... |
            for (var i = 0; i < aCells.length; ++i) {
                cell = document.createElement("listcell");
                cell.setAttribute("label", aCells[i]);
                row.appendChild(cell);
            }
        } else {
            row.setAttribute("label", aCells[0]);
        }

        return row;
    }

    function setListBoxFromStringList(aList, aOffset) {
        var row;
        aOffset = aOffset || 0;
        var count = Math.min(listboxMaxRows, aList.length) + aOffset;

        removeAllChilds(listbox);

        if (isMultipleList(aList)) {
            // multiple
            setColumns(aList[0].length);
            for (var i = aOffset; i < count; ++i) {
                row = createRow(aList[i]);
                listbox.appendChild(row);
            }
        } else {
            // normal
            setColumns(1);
            for (var i = aOffset; i < count; ++i) {
                row = document.createElement("listitem");
                row.setAttribute("label", aList[i]);
                listbox.appendChild(row);
            }
        }

        // var a = new Date();

        // var b = new Date();
        // modules.display.prettyPrint("whole time :: " + (b - a));

        currentList      = aList;
        currentIndexList = null;
    }

    function setListBoxFromIndexList(aList, aIndexList, aOffset) {
        var row;
        aOffset = aOffset || 0;
        var count = Math.min(listboxMaxRows, aIndexList.length) + aOffset;

        // var a = new Date();

        removeAllChilds(listbox);

        if (isMultipleList(aList)) {
            // multiple
            setColumns(aList[0].length);
            for (var i = aOffset; i < count; ++i) {
                row = createRow(aList[aIndexList[i]]);
                listbox.appendChild(row);
            }
        } else {
            // normal
            setColumns(1);
            for (var i = aOffset; i < count; ++i) {
                row = document.createElement("listitem");
                row.setAttribute("label", aList[aIndexList[i]]);
                listbox.appendChild(row);
            }
        }

        // var b = new Date();
        // modules.display.prettyPrint("comp time :: " + (b - a));

        currentList      = aList;
        currentIndexList = aIndexList;
    }

    function setListBoxSelection(aIndex) {
        var center = listboxRows / 2; 
        var pos;
        var listLen = currentIndexList ? currentIndexList.length : currentList.length;

        if (listLen <= listboxRows) {
            listbox.currentIndex = listbox.selectedIndex = aIndex;            
            return;
        }

        function setupList(offset, pos) {
            if (currentIndexList) {
                setListBoxFromIndexList(currentList, currentIndexList, offset);                
            } else {
                setListBoxFromStringList(currentList, offset);                
            }

            listbox.currentIndex = listbox.selectedIndex = pos;
        }

        if (aIndex <= center) {
            setupList(0, aIndex);
        } else if (aIndex >= listLen - center) {
            setupList(listLen - listboxRows, listboxRows - (listLen - aIndex));
        } else {
            setupList(aIndex - center, center);
        }
    }

    // function setListBoxSelection(aIndex) {
    //     listbox.currentIndex = aIndex;
    //     listbox.selectedIndex = aIndex;

    //     var offset = listbox.getNumberOfVisibleRows() / 2;
    //     var dest = Math.max(0, aIndex - offset);
    //     if (dest > listbox.getRowCount() - 2 * offset)
    //         dest = listbox.getRowCount() - 2 * offset;

    //     listbox.scrollToIndex(dest);
    // }

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
        return (typeof(aList) == 'object' &&
                typeof(aList[0]) == 'object');
    }

    function getListText(aList, aIndex, aCellNum) {
        if (aCellNum == undefined)
            aCellNum = 0;

        return isMultipleList(aList) ?
            aList[aIndex][aCellNum] : aList[aIndex];
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

    var currentRegexp;
    function selectorDisplayStatusbarLine(aQuery, aIndex, aTotalLength) {
        modules.display.echoStatusBar("Completion Regexp Match for [" + aQuery + "]" +
                                      " (" + (aIndex + 1) +  " / " + aTotalLength + ")");
    }

    function selectNextCompletion(aDirection, aRing) {
        var nextIndex, totalLength;
        if (compIndexList) {
            totalLength = compIndexList.length;
            nextIndex = getNextIndex(compIndex, aDirection, 0,
                                     compIndexList.length, aRing);
            compIndex = nextIndex;
        } else {
            totalLength = completion.list.length;
            nextIndex = getNextIndex(completion.index, aDirection, 0,
                                     completion.list.length, aRing);
            completion.index = nextIndex;
        }

        setListBoxSelection(nextIndex);
        selectorDisplayStatusbarLine(currentRegexp, nextIndex, totalLength);
    }

    function createCompletionList() {
        if (!completion.list || !completion.list.length) {
            modules.display.echoStatusBar("No " + completion.name + " found", 1000);
            return;
        }

        var index;
        // get cursor position
        var start = textbox.selectionStart;

        if (start == 0) {
            // create list of whole completion
            compIndexList = null;
            setListBoxFromStringList(completion.list);
            setRows(completion.list.length);
            listbox.hidden = false;
            compIndex = 0;
            currentRegexp = "";
        } else {
            var listLen = completion.list.length;
            var regexp = textbox.value;

            var substrIndex;

            // generate new completion list
            compIndexList = [];
            compIndex = 0;

            var keywords = regexp.split(" ");

            var matcher = isMultipleList(completion.list) ?
                function (keyword) {
                    return completion.list[i].some(function (item) {return item.match(keyword, "i");});
                }
            : function (keyword) {
                return completion.list[i].match(keyword, "i");
            };

            for (var i = 0; i < listLen; ++i) {
                if (keywords.every(matcher)) {
                    compIndexList.push(i);
                }
            }

            if (compIndexList.length == 0) {
                compIndexList = null;
                removeAllChilds(listbox);
                modules.display.echoStatusBar("No match for [" + regexp + "]");
                return;
            }

            index = compIndexList[0];
            currentRegexp = regexp;

            setListBoxFromIndexList(completion.list, compIndexList);


            // show
            setRows(compIndexList.length);
            listbox.hidden = false;
        }

        setListBoxSelection(0);
        selectorDisplayStatusbarLine(currentRegexp, compIndex,
                                     compIndexList ? compIndexList.length : completion.list.length);
    }

    /**
     * if these string given,
     * command.hoge
     * command.huga
     * command.hoho
     * ________^___ <= return ^ index
     * @param {} aStringList
     * @param {} aIndexList
     * @returns {integer} common substring beginning index
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

        var readStr;
        if (aCanceled) {
            readStr = null;
        } else {
            if (isSelector) {
                var item = listbox.selectedItem;
                readStr = isMultipleList(completion.list) ? 
                    item.childNodes[itemIndexToUse].getAttribute("label") :
                    item.getAttribute("label");
            } else {
                readStr = textbox.value;
            }
        }

        // ==================== reset states ==================== //

        if (isSelector)
            delayedCommandTimeout = null;

        currentCallback    = null;
        currentUserArg     = null;

        currentHead        = null;
        inNormalCompletion = false;

        promptbox.hidden   = true;
        listbox.hidden     = true;

        textbox.value      = "";
        label.value        = "";

        resetState(history);
        resetState(completion);

        // ==================== execute callback ==================== //

        if (savedCallback) {
            try {
                savedCallback(readStr, savedUserArg);

                if (!aCanceled && readStr.length) {
                    // add history
                    if (ignoreDuplication) {
                        // remove all duplicated elements from list and add str to head
                        var li = history.list;
                        for (var i = 0; i < li.length; ++i) {
                            if (readStr == li[i]) {
                                li.splice(i, 1);
                            }
                        }
                        li.unshift(readStr);
                    } else {
                        history.list.unshift(readStr);
                    }
                }
            } catch (x) {
                aCanceled = true;
            }
        }

        // if canceled or error occured in callback, reset statusbar
        if (aCanceled)
            modules.display.echoStatusBar("");
    }

    // ================ public ================ //

    var self = {
        init: function () {
            modules = this.modules;

            if (KeySnail.windowType == "navigator:browser") {
                promptbox = document.getElementById("keysnail-prompt");
                label     = document.getElementById("keysnail-prompt-label");
                textbox   = document.getElementById("keysnail-prompt-textbox");
                container = document.getElementById("browser-bottombox");

                listbox   = document.getElementById("keysnail-completion-list");

                // this holds all history and
                historyHolder = new Object;
                historyHolder["default"] = [];
            }
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
            textbox.addEventListener('keydown', handleKeyDownRead, false);
            // textbox.addEventListener('input', handleInputRead, false);
            eventListenerRemover = function () {
                // textbox.removeEventListener('blur', onBlur, false);
                textbox.removeEventListener('keypress', handleKeyPressRead, false);
                textbox.removeEventListener('keydown', handleKeyDownRead, false);
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

            var aMsg            = aContext.message;
            var aCallback       = aContext.callback;
            var aCollection     = aContext.collection;
            var aItemIndexToUse = aContext.itemIndexToUse;

            savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;

            // tell current command is the selector
            isSelector = true;

            // set up completion
            completion.list = aCollection;

            // set up callbacks
            currentCallback = aCallback;

            // display prompt box
            label.value = aMsg;
            promptbox.hidden = false;
            // do not set selection value till textbox appear (cause crash)
            textbox.selectionStart = textbox.selectionEnd = 0;

            // now focus to the input area
            textbox.focus();

            // add event listener
            textbox.addEventListener('keypress', handleKeyPressSelector, false);
            textbox.addEventListener('keydown', handleKeyDownSelector, false);
            eventListenerRemover = function () {
                textbox.removeEventListener('keypress', handleKeyPressSelector, false);
                textbox.removeEventListener('keydown', handleKeyDownSelector, false);
            };

            oldTextLength = 0;

            if (isMultipleList(aCollection)) {
                if (aItemIndexToUse)
                    itemIndexToUse = (aItemIndexToUse < aCollection.length) ? aItemIndexToUse : 0;
                else
                    itemIndexToUse = 0;
            }

            modules.display.echoStatusBar(modules.util.getLocaleString("dynamicReadKeyDescription"));

            createCompletionList();
        },

        message: KeySnail.message
    };

    return self;
}();
