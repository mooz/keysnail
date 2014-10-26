/**
 * @fileOverview Handle key sequences and commands.
 * @name key.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const key = {
    modules: null,
    // "modules" is automatically added
    // by KeySnail.initModule in keysnail.js

    // ==== key maps ====
    keyMapHolder: {},           // hash, all mode-keymaps are stored to
    // currently, {"global", "view", "edit", "caret"}
    currentKeyMap: null,        // current keymap (transit)
    currentKeySequence: [],     // array, current key sequence set to

    // ==== prefix argument ====
    prefixArgument: null,       // prefix argument (integer)
    // string expression of the key sequence e.g. "C-u 4 0 2"
    // this is used for displaing to the status-bar
    prefixArgumentString: null,
    inputtingPrefixArgument : false,

    // ==== escape char ====
    escapeCurrentChar: false,

    // ==== special keys ====
    // these keys can be configured through the user config file
    quitKey: "C-g",
    helpKey: "<f1>",
    escapeKey: "C-q",
    // key macro
    macroStartKey: "Not defined",
    macroEndKey: "Not defined",
    // prefix argument
    universalArgumentKey: "C-u",
    negativeArgument1Key: "C--",
    negativeArgument2Key: "C-M--",
    negativeArgument3Key: "M--",
    // switching suspension
    suspendKey: "<f2>",

    // ==== keycodes not defined in nsIDOMKeyEvents ====
    // ref. http://homepage3.nifty.com/ic/help/rmfunc/vkey.htm
    keyCode2Name: {
        0x15: "kana",
        0x19: "kanji",
        0x1C: "convert",
        0x1D: "nonconvert",
        0x1E: "accept",
        0x1F: "modechange",
        0x29: "select",
        0x2A: "print",
        0x2B: "execute",
        0x5B: "l_windows",
        0x5C: "r_windows"
    },
    keyName2Code: {
        kana:       0x15,
        hangeul:    0x15,
        hangul:     0x15,
        kanji:      0x19,
        hanja:      0x19,
        convert:    0x1C,
        nonconvert: 0x1D,
        accept:     0x1E,
        modechange: 0x1F,
        select:     0x29,
        print:      0x2A,
        execute:    0x2B,
        l_windows:  0x5B,
        r_windows:  0x5C
    },

    // ==== keyboard macro ====
    currentMacro: [],
    inputtingMacro: false,

    // ==== status ====
    status: false,
    suspended: false,

    // userful for github wiki, auto complete in amazon
    passAllKeys: false,
    hasEventListener: false,
    useCapture: true,

    // ==== black list ====
    blackList: null,

    // ==== last command's function ====
    lastFunc: null,

    // ==== set to true, while loading the external (imported from .keysnail.js or plugin)
    inExternalFile: false,

    withExternalFileStatus: function (status, f, self) {
        let savedStatus = this.inExternalFile;
        try {
            this.inExternalFile = status;
            f.call(self || null);
        } finally {
            this.inExternalFile = savedStatus;
        }
    },

    // ==== modes ====

    // major modes
    modes: {
        GLOBAL : "global",
        VIEW   : "view",
        EDIT   : "edit",
        CARET  : "caret"
    },

    init: function () {
        this.declareKeyMap(this.modes.GLOBAL);
        this.declareKeyMap(this.modes.VIEW);
        this.declareKeyMap(this.modes.EDIT);
        this.declareKeyMap(this.modes.CARET);
        this.currentKeyMap = this.keyMapHolder[this.modes.GLOBAL];

        this.useCapture = !util.getBoolPref("extensions.keysnail.keyhandler.low_priority", false);

        this.status = util.getBoolPref("extensions.keysnail.keyhandler.status", true);
    },

    // Run / Stop {{ ============================================================ //

    /**
     * start key handler
     */
    run: function () {
        if (this.hasEventListener == false)
        {
            /**
             * third boolean value means "use capture or not".
             * so to say "keysnail prior to webpage's shortcut key or not".
             */
            window.addEventListener("keypress", this, this.useCapture);
            this.hasEventListener = true;
        }
        this.status = true;
        util.setBoolPref("extensions.keysnail.keyhandler.status", true);
    },

    /**
     * stop key handler
     */
    stop: function () {
        if (this.hasEventListener == true)
        {
            window.removeEventListener("keypress", this, this.useCapture);
            this.hasEventListener = false;
        }
        this.status = false;
        util.setBoolPref("extensions.keysnail.keyhandler.status", false);
    },

    /**
     * toggle current keyhandler status
     * when init file is not loaded, reject
     */
    toggleStatus: function (elem) {
        let name = elem ? elem.localName : "<not given>";
        util.message("toggleStatus called " + this.status + " " + name);

        if (this.status)
            this.stop();
        else {
            if (!userscript.initFileLoaded)
                userscript.load();

            if (!userscript.initFileLoaded)
                this.status = false;
            else
                this.run();
        }

        key.updateStatusDisplay();
    },

    /**
     * check for the black list regexp and if <aURL> found in black list,
     * suspend the keyhandler.
     * If <aURL> is undefined, force unsuspend.
     * @param {string} aURL page URL to check.
     */
    suspendWhenMatched: function (aURL, aBlackList) {
        if (!aBlackList)
            return;

        if (aURL)
        {
            this.suspended =
                aBlackList.some(function (elem) { return (aURL == elem || !!aURL.match(elem)); });
        }
        else
        {
            // about:blank ...
            this.suspended = false;
        }

        this.updateStatusDisplay();
    },

    // }} ======================================================================= //

    // Update GUI {{ ============================================================ //

    STATUSES: {
        ENABLED: "enabled",
        DISABLED: "disabled",
        SUSPENDED: "suspended"
    },

    get statusString() {
        if (!this.status)
            return this.STATUSES.DISABLED;
        if (this.suspended)
            return this.STATUSES.SUSPENDED;
        return this.STATUSES.ENABLED;
    },

    updateStatusDisplay: function () {
        this.updateMenu();
        this.updateToolbarButton();
        this.updateStatusBar();
    },

    updateToolbarButton: function () {
        let button = document.getElementById("keysnail-toolbar-button");
        if (!button)
            return;

        button.setAttribute("data-ks-status", this.statusString);
    },

    /**
     * update the status bar icon
     */
    updateStatusBar: function () {
        let icon = document.getElementById("keysnail-statusbar-icon");
        if (!icon)
            return;

        let src, tooltip;

        switch (this.statusString) {
        case this.STATUSES.ENABLED:
            src = "chrome://keysnail/skin/icon16.png";
            tooltip = util.getLocaleString("keySnailEnabled");
            break;
        case this.STATUSES.DISABLED:
            src = "chrome://keysnail/skin/icon16gray.png";
            tooltip = util.getLocaleString("keySnailDisabled");
            break;
        default:
            src = "chrome://keysnail/skin/icon16suspended.png";
            tooltip = util.getLocaleString("keySnailSuspended");
            break;
        }

        icon.src = src;
        icon.tooltipText = tooltip;
    },

    /**
     * update the status bar menu
     */
    updateMenu: function () {
        var checkbox = document.getElementById("keysnail-menu-status");
        if (!checkbox)
            return;

        checkbox.setAttribute('checked', this.status);
    },

    /**
     * update the tool box menu (from onpopupshowing)
     */
    updateToolMenu: function () {
        var checkbox = document.getElementById("keysnail-tool-menu-status");
        if (!checkbox)
            return;

        checkbox.setAttribute('checked', this.status);
    },

    /**
     * update the toolbar button menu (from onpopupshowing)
     */
    updateToolbarButtonMenu: function () {
        var checkbox = document.getElementById("keysnail-toolbar-button-status");
        if (!checkbox)
            return;

        checkbox.setAttribute('checked', this.status);
    },

    // }} ======================================================================= //

    // Mode {{ ================================================================== //

    getCurrentMode: function (aEvent, aKey) {
        if (util.isWritable(aEvent))
            return this.modes.EDIT;

        return (util.isCaretEnabled() ||
                util.getBoolPref("accessibility.browsewithcaret")) ?
            this.modes.CARET : this.modes.VIEW;
    },

    // }} ======================================================================= //

    // Utils {{ ================================================================= //

    /**
     * feed keys to web pages content
     * ex)
     * In Gmail, try key.feed(["j", "j"], 5); or key.feed(["j", "j"], -1);
     * @param {(string|[string])} aKeys
     * @param {integer} aFrameNum
     * @param {(string|[string])} aType
     */
    feed: function (aKeys, aFrameNum, aType) {
        if (typeof aFrameNum !== 'number')
            aFrameNum = 0;

        var dest = document.commandDispatcher.focusedWindow;

        // inspired from feedSomeKey.js
        // http://coderepos.org/share/browser/lang/javascript/vimperator-plugins/trunk/feedSomeKey.js
        if (aFrameNum !== 0) {
            var frames = [];

            // push all frames (includes frames frames) to frames
            (function frameCollector(frame) {
                if (frame.document.body.localName.toLowerCase() === 'body')
                    frames.push(frame);

                for (let i = 0, len = frame.frames.length; i < len; ++i)
                    frameCollector(frame.frames[i]);
            })(window.content);

            frames = frames.filter(function (frame) {
                frame.focus();
                return (document.commandDispatcher.focusedWindow === frame);
            });

            if (aFrameNum < 0)
                aFrameNum = frames.length + aFrameNum;

            dest = frames[aFrameNum] || dest;
        }

        var target = dest.document.body || dest.document;

        if (typeof aKeys == "string")
            aKeys = [aKeys];

        if (typeof aType == "string")
            aType = [aType];
        else if (!(aType instanceof Array))
            aType = ["keydown", "keypress", "keyup"];

        target.focus();

        this.passAllKeys = true;

        for (let [, keyStr] in Iterator(aKeys)) {
            for (let [, type] in Iterator(aType)) {
                util.message("feed " + keyStr);
                let event = this.stringToKeyEvent(keyStr, true, type, true);
                // event.ksNoHandle becomes undefined while propagating
                target.dispatchEvent(event);
            }
        }

        this.passAllKeys = false;
    },

    // }} ======================================================================= //

    // Key handler {{ =========================================================== //

    /**
     * Reset Key handler status
     * @param {string} aMsg message echoed to the status bar.
     * @param {integer} aTime message timeout in milli second
     */
    backToNeutral: function (aMsg, aTime) {
        // reset keymap
        this.currentKeyMap = this.keyMapHolder[this.modes.GLOBAL];
        // reset statusbar
        display.echoStatusBar(aMsg, aTime);
        // reset key sequence
        this.currentKeySequence.length = 0;
        // reset prefixArgument
        this.inputtingPrefixArgument = false;
        this.prefixArgument = null;
        this.prefixArgumentString = null;
        // reset escape char
        this.escapeCurrentChar = false;
    },

    /**
     * first seek for the key from local-key-map
     * and if does not found, seek for global-key-map
     * Note: this function is called implicitly
     * when the 'keypress' event occurred
     * @param {KeyboardEvent} aEvent event to handle
     */
    handleEvent: function (aEvent) {
        if (aEvent.ksNoHandle || this.passAllKeys)
        {
            // ignore key event generated by generateKey
            // when ksNoHandle is set to true
            return;
        }

        // ----------------------------------------

        var keyStr = this.keyEventToString(aEvent);

        if (this.escapeCurrentChar)
        {
            // no stop event propagation
            this.backToNeutral(keyStr + " Escaped", 3000);
            return;
        }

        if (!keyStr)
            return;

        if (keyStr == this.suspendKey)
        {
            util.stopEventPropagation(aEvent);
            this.suspended = !this.suspended;
            this.updateStatusDisplay();
            this.backToNeutral("Suspension switched", 1000);
            return;
        }

        if (this.suspended)
            return;

        if (this.inputtingMacro)
            this.currentMacro.push(aEvent);

        try {
            hook.callHook("KeyPress", aEvent);
        } catch (x) {}

        switch (keyStr)
        {
        case this.escapeKey:
            util.stopEventPropagation(aEvent);
            display.echoStatusBar("Escape next key: ");
            this.escapeCurrentChar = true;
            return;
        case this.quitKey:
            util.stopEventPropagation(aEvent);
            // call hooks
            hook.callHook("KeyBoardQuit", aEvent);
            // cancell current key sequence
            this.backToNeutral("Quit");
            return;
        case this.macroEndKey:
            util.stopEventPropagation(aEvent);
            if (this.inputtingMacro)
            {
                this.currentMacro.pop();
                display.echoStatusBar("Keyboard macro defined", 3000);
                this.inputtingMacro = false;
            }
            else
            {
                if (this.currentMacro.length)
                {
                    display.echoStatusBar("Do macro", 3000);
                    macro.doMacro(this.currentMacro);
                }
                else
                {
                    display.echoStatusBar("No macro defined", 3000);
                }
            }
            return;
        case this.macroStartKey:
            util.stopEventPropagation(aEvent);
            if (this.inputtingMacro)
            {
                this.currentMacro.pop();
            }
            else
            {
                display.echoStatusBar("Defining Keyboard macro ...", 3000);
                this.currentMacro.length = 0;
                this.inputtingMacro = true;
            }
            return;
        }

        if (this.inputtingPrefixArgument)
        {
            if (this.isNumKey(aEvent) ||
                keyStr == this.universalArgumentKey ||
                ((this.currentKeySequence[this.currentKeySequence.length - 1] == this.universalArgumentKey) &&
                 (keyStr == '-')))
            {
                // append to currentKeySequence, while the key event is number value.
                // sequencial C-u like C-u C-u => 4 * 4 = 16 is also supported.
                // sequencial C-u - begins negative prefix argument
                util.stopEventPropagation(aEvent);
                this.currentKeySequence.push(keyStr);
                display.echoStatusBar(this.currentKeySequence.join(" ") +
                                                   " [Prefix argument :: " +
                                                   this.parsePrefixArgument(this.currentKeySequence) + "]");
                // do nothing and return
                return;
            }

            // prefix argument keys input end. now parse them.
            this.prefixArgument
                = this.parsePrefixArgument(this.currentKeySequence);
            this.inputtingPrefixArgument = null;
            // for displaying status-bar
            this.prefixArgumentString = this.currentKeySequence.join(" ") + " ";
            this.currentKeySequence.length = 0;
        }

        if (this.currentKeySequence.length)
        {
            // after second stroke
            if (keyStr == this.helpKey)
            {
                util.stopEventPropagation(aEvent);
                this.interactiveHelp();
                this.backToNeutral("");
                return;
            }
        }
        else
        {
            // first stroke
            if (util.getBoolPref("extensions.keysnail.keyhandler.use_prefix_argument")
                && this.isPrefixArgumentKey(keyStr, aEvent))
            {
                // transit state: to inputting prefix argument
                util.stopEventPropagation(aEvent);
                this.currentKeySequence.push(keyStr);
                display.echoStatusBar(this.currentKeySequence.join(" ") +
                                                   " [Prefix argument :: " +
                                                   this.parsePrefixArgument(this.currentKeySequence) + "]");
                this.inputtingPrefixArgument = true;
                return;
            }

            // decide which keymap to use
            var modeName = this.getCurrentMode(aEvent, keyStr);

            this.currentKeyMap = this.keyMapHolder[modeName];
        }

        // KeySnail ignores the keybindings bounded with "null".
        // this is useful when keymap is the site-local
        // and user not want this "key" to handled by KeySnail.
        if (keyStr in this.currentKeyMap && this.currentKeyMap[keyStr] === null)
        {
            this.backToNeutral("");
            return;
        }

        if (!this.currentKeyMap[keyStr])
        {
            // if key is not found in the local key map
            // check for the global key map, using currentKeySequence
            this.currentKeyMap = this.trailByKeySequence(this.keyMapHolder[this.modes.GLOBAL],
                                                         this.currentKeySequence);

            if (!this.currentKeyMap)
            {
                // failed to trace the currentKeySequence
                this.backToNeutral("");
                return;
            }
        }

        if (this.currentKeyMap[keyStr])
        {
            // prevent browser default behaviour
            util.stopEventPropagation(aEvent);

            if (typeof(this.currentKeyMap[keyStr]) == "function")
            {
                // save function and prefixArgument
                var func = this.currentKeyMap[keyStr];
                var arg  = this.prefixArgument;
                this.backToNeutral("");

                // call saved function
                this.executeFunction(func, aEvent, arg);
            }
            else
            {
                // add key to the key sequece
                this.currentKeySequence.push(keyStr);

                // Display key sequence
                if (this.prefixArgumentString)
                {
                    display.echoStatusBar(this.prefixArgumentString
                                                       + this.currentKeySequence.join(" "));
                }
                else
                {
                    display.echoStatusBar(this.currentKeySequence.join(" "));
                }

                // move to the next keymap
                this.currentKeyMap = this.currentKeyMap[keyStr];
            }
        }
        else
        {
            this.lastFunc = null;

            // call default handler or insert text
            if (this.currentKeySequence.length)
            {
                util.stopEventPropagation(aEvent);
                this.backToNeutral(this.currentKeySequence.join(" ")
                                   + " " + keyStr + " is undefined", 3000);
            }
            else
            {
                if (this.prefixArgument > 0)
                {
                    if (!this.isDisplayableKey(aEvent))
                    {
                        util.stopEventPropagation(aEvent);

                        for (let i in util.interruptibleRange(0, this.prefixArgument))
                        {
                            if (keyStr == "<tab>")
                            {
                                document.commandDispatcher.advanceFocus();
                            }
                            else if (keyStr == "S-<tab>")
                            {
                                document.commandDispatcher.rewindFocus();
                            }
                            else
                            {
                                aEvent.originalTarget.dispatchEvent(this.stringToKeyEvent(keyStr, true));
                            }
                        }
                    }
                    else if (util.isWritable(aEvent))
                    {
                        // displayable and writable
                        util.stopEventPropagation(aEvent);
                        // insert repeated string
                        command.insertText(new Array(this.prefixArgument + 1).join(String.fromCharCode(aEvent.charCode)));
                    }
                }
                this.backToNeutral("");
            }
        }
    },

    // }} ======================================================================= //

    // Predicatives {{ ========================================================== //

    /**
     * check if the key event is ctrl key (predicative)
     * @param {KeyboardEvent} aEvent
     * @returns true when <aEvent> is control key
     */
    isControlKey: function (aEvent) {
        return aEvent.ctrlKey || aEvent.commandKey;
    },

    /**
     * check if the key event is meta key (predicative)
     * @param {KeyboardEvent} aEvent
     * @returns true when <aEvent> is meta key
     */
    isMetaKey: function (aEvent) {
        return aEvent.altKey || aEvent.metaKey;
    },

    isDisplayableKey: function (aEvent) {
        return aEvent.charCode >= 0x20 && aEvent.charCode <= 0x7e;
    },

    /**
     * check if the key event is number
     * @param {KeyboardEvent} aEvent
     * @returns {bool} true when <aEvent> is the event of the number key
     * e.g. 0, 1, 2, 3, 4 ,5, 6, 7, 8, 9
     */
    isNumKey: function (aEvent) {
        return (aEvent.charCode >= 0x30 &&
                aEvent.charCode <= 0x39);
    },

    /**
     * Check whether key event (and string expression) is the digit argument key
     * @param {KeyBoardEvent} aEvent key event
     * @returnss {boolean} true when the <aEvent> is regarded as the digit argument
     */
    isDigitArgumentKey: function (aEvent) {
        var modifier = false;

        switch (util.getUnicharPref("extensions.keysnail.keyhandler.digit_prefix_argument_type"))
        {
        case "C":
            modifier = this.isControlKey(aEvent) && !this.isMetaKey(aEvent);
            break;
        case "M":
            modifier = this.isMetaKey(aEvent) && !this.isControlKey(aEvent);
            break;
        case "C-M":
            modifier = this.isControlKey(aEvent) && this.isMetaKey(aEvent);
            break;
        case "Digit":
            modifier = !util.isWritable(aEvent);
            break;
        default:
            break;
        }

        return (modifier && this.isNumKey(aEvent));
    },

    /**
     * Check whether key event (and string expression) is the prefix argument key
     * @param {string} aKey literal expression of the aEvent
     * @param {KeyBoardEvent} aEvent key event
     * @returnss {boolean} true, is the key specified by <aKey> and <aEvent>
     * will be followed by prefix argument
     */
    isPrefixArgumentKey: function (aKey, aEvent) {
        return aKey == this.universalArgumentKey ||
            // negative argument
            aKey == this.negativeArgument1Key ||
            aKey == this.negativeArgument2Key ||
            aKey == this.negativeArgument3Key ||
            // [prefix]-digit
            this.isDigitArgumentKey(aEvent);
    },

    // }} ======================================================================= //

    // Convert key event to string, vice versa {{ =============================== //

    /**
     * convert key event to string expression
     * @param {KeyboardEvent} aEvent
     * @returns {String} string expression of <aEvent>
     */
    keyEventToString: function (aEvent) {
        var keyStr;

        // display.prettyPrint(
        //     ["char code :: " + aEvent.charCode,
        //      "key code  :: " + aEvent.keyCode,
        //      "ctrl      :: " + (aEvent.ctrlKey ? "on" : "off"),
        //      "alt       :: " + (aEvent.altKey ? "on" : "off"),
        //      "meta      :: " + (aEvent.metaKey ? "on" : "off"),
        //      "command   :: " + (aEvent.commandKey ? "on" : "off")].join("\n"));

        if (this.isDisplayableKey(aEvent))
        {
            // ASCII displayable characters (0x20 : SPC)
            keyStr = String.fromCharCode(aEvent.charCode);
            if (aEvent.charCode == 0x20)
            {
                keyStr = "SPC";
            }
        }
        else if (aEvent.keyCode >= KeyEvent.DOM_VK_F1 &&
                 aEvent.keyCode <= KeyEvent.DOM_VK_F24)
        {
            // function keys
            keyStr = "<f"
                + (aEvent.keyCode - KeyEvent.DOM_VK_F1 + 1)
                + ">";
        }
        else
        {
            // special charactors
            switch (aEvent.keyCode)
            {
            case KeyEvent.DOM_VK_ESCAPE:
                keyStr = "ESC";
                break;
            case KeyEvent.DOM_VK_RETURN:
            case KeyEvent.DOM_VK_ENTER:
                keyStr = "RET";
                break;
            case KeyEvent.DOM_VK_RIGHT:
                keyStr = "<right>";
                break;
            case KeyEvent.DOM_VK_LEFT:
                keyStr = "<left>";
                break;
            case KeyEvent.DOM_VK_UP:
                keyStr = "<up>";
                break;
            case KeyEvent.DOM_VK_DOWN:
                keyStr = "<down>";
                break;
            case KeyEvent.DOM_VK_PAGE_UP:
                keyStr = "<prior>";
                break;
            case KeyEvent.DOM_VK_PAGE_DOWN:
                keyStr = "<next>";
                break;
            case KeyEvent.DOM_VK_END:
                keyStr = "<end>";
                break;
            case KeyEvent.DOM_VK_HOME:
                keyStr = "<home>";
                break;
            case KeyEvent.DOM_VK_TAB:
                keyStr = "<tab>";
                break;
            case KeyEvent.DOM_VK_BACK_SPACE:
                keyStr = "<backspace>";
                break;
            case KeyEvent.DOM_VK_PRINTSCREEN:
                keyStr = "<print>";
                break;
            case KeyEvent.DOM_VK_INSERT:
                keyStr = "<insert>";
                break;
            case KeyEvent.DOM_VK_PAUSE:
                keyStr = "<pause>";
                break;
            case KeyEvent.DOM_VK_DELETE:
                keyStr = "<delete>";
            case 0xE2:
                /**
                 * windows specific bug
                 * When Ctrl + _ is pressed, the char code becomes 0, not the 95
                 * and the key code becomes 242 (0xE2)
                 */
                if (aEvent.ctrlKey)
                    keyStr = "_";
                break;
            default:
                if (aEvent.keyCode in this.keyCode2Name)
                    keyStr = "<"+this.keyCode2Name[aEvent.keyCode]+">";
                break;
            }
        }

        if (!keyStr)
            return null;

        // append modifier
        if (this.isMetaKey(aEvent))
            keyStr = "M-" + keyStr;
        if (this.isControlKey(aEvent))
            keyStr = "C-" + keyStr;
        if (aEvent.shiftKey && (!this.isDisplayableKey(aEvent) || aEvent.charCode == 0x20))
            keyStr = "S-" + keyStr;

        return keyStr;
    },

    /**
     * convert string to key event
     * @param {string} aKey string expression of the key
     * @param {boolean} aKsNoHandle whether keysnail handle the generated keyevent or not
     * @param {string} aType keyboard event type (keydown, keypress, keyup)
     * @param {boolean} aContent which to use content.docuemnt (true) or docuemnt (false)
     * @returns {keyboardevent}
     */
    stringToKeyEvent: function (aKey, aKsNoHandle, aType, aIsContent) {
        var newEvent = (aIsContent ? content.document : document).createEvent('KeyboardEvent');
        var ctrlKey  = false;
        var altKey   = false;
        var shiftKey = false;
        var keyCode  = 0;
        var charCode = 0;

        // process modifier
        if (aKey.length > 1 && aKey.charAt(1) == '-')
        {
            while (aKey.charAt(0) == 'C' || aKey.charAt(0) == 'M' || aKey.charAt(0) == 'S')
            {
                switch (aKey.charAt(0))
                {
                case 'C':
                    ctrlKey = true;
                    break;
                case 'M':
                    altKey = true;
                    break;
                case 'S':
                    shiftKey = true;
                    break;
                }
                aKey = aKey.slice(2);
            }
            // has modifier
        }

        if (aKey.charAt(0) == '<')
        {
            // special key
            if (aKey.charAt(1).toLowerCase() == 'f')
            {
                // <f
                // function key
                var num = aKey.match("<f(\d+\)>");
                num = !!num ? parseInt(num[0]) : 0;

                if (num > 0 && num < 25)
                {
                    keyCode = KeyEvent.DOM_VK_F1 + num - 1;
                }
            }
            else
            {
                switch (aKey)
                {
                case "<right>":
                    keyCode = KeyEvent.DOM_VK_RIGHT;
                    break;
                case "<left>":
                    keyCode = KeyEvent.DOM_VK_LEFT;
                    break;
                case "<up>":
                    keyCode = KeyEvent.DOM_VK_UP;
                    break;
                case "<down>":
                    keyCode = KeyEvent.DOM_VK_DOWN;
                    break;
                case "<prior>":
                    keyCode = KeyEvent.DOM_VK_PAGE_UP;
                    break;
                case "<next>":
                    keyCode = KeyEvent.DOM_VK_PAGE_DOWN;
                    break;
                case "<end>":
                    keyCode = KeyEvent.DOM_VK_END;
                    break;
                case "<home>":
                    keyCode = KeyEvent.DOM_VK_HOME;
                    break;
                case "<tab>":
                    keyCode = KeyEvent.DOM_VK_TAB;
                    break;
                case "<backspace>":
                    keyCode = KeyEvent.DOM_VK_BACK_SPACE;
                    break;
                case "<print>":
                    keyCode = KeyEvent.DOM_VK_PRINTSCREEN;
                    break;
                case "<insert>":
                    keyCode = KeyEvent.DOM_VK_INSERT;
                    break;
                case "<pause>":
                    keyCode = KeyEvent.DOM_VK_PAUSE;
                    break;
                case "<delete>":
                    keyCode = KeyEvent.DOM_VK_DELETE;
                    break;
                default:
                    let (keyName = aKey.replace(/^<|>$/g, "")) {
                        if (keyName in this.keyName2Code)
                            keyCode = this.keyName2Code[keyName];
                    };
                    break;
                }
            }
        }
        else
        {
            if (aKey.length === 1)
            {
                // ascii char
                if (!aType || aType === 'keypress')
                    charCode = aKey.charCodeAt(0);
                else
                    keyCode = KeyEvent.DOM_VK_A + (aKey.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0));

                shiftKey = (aKey !== aKey.toLowerCase());
            }
            else
            {
                switch (aKey)
                {
                case "ESC":
                    keyCode = KeyEvent.DOM_VK_ESCAPE;
                    break;
                case "RET":
                    keyCode = KeyEvent.DOM_VK_ENTER;
                    break;
                case "SPC":
                    charCode = 0x20;
                    break;
                }
            }
        }

        newEvent.initKeyEvent(aType || 'keypress',
                              true, true,
                              aIsContent ? content : null,
                              ctrlKey, altKey, shiftKey, false,
                              keyCode, charCode);

        if (aKsNoHandle)
            newEvent.ksNoHandle = true;

        return newEvent;
    },

    // }} ======================================================================= //

    // Key map manipulation {{ ================================================== //

    declareKeyMap: function (aKeyMapName) {
        this.keyMapHolder[aKeyMapName] = {};
    },

    copyKeyMap: function (aTargetKeyMapName, aDestinationKeyMapName) {
        var aTarget = this.keyMapHolder[aTargetKeyMapName];
        var aDestination = this.keyMapHolder[aDestinationKeyMapName];

        for (let [property, value] in Iterator(aTarget))
            aDestination[property] = value;
    },

    registerKeySequence: function (aKeys, aFunc, aKeyMap) {
        var keyStr;
        var to = aKeys.length - 1;

        for (var i = 0; i < to; ++i)
        {
            keyStr = aKeys[i];

            switch (typeof aKeyMap[keyStr])
            {
            case "function":
                util.message("%s bound to [%s] overrided with the prefix key.",
                             aKeyMap[keyStr].ksDescription,
                             aKeys.slice(0, i + 1).join(" "));
                // no break;
            case "undefined":
                // create a new (pseudo) aKeyMap
                aKeyMap[keyStr] = {};
                break;
            }

            // dig, dig
            aKeyMap = aKeyMap[keyStr];
        }

        aKeyMap[aKeys[i]] = aFunc;
    },

    setGlobalKey: function (aKeys, aFunc, aKsdescription, aKsNoRepeat) {
        this.defineKey(this.modes.GLOBAL, aKeys, aFunc, aKsdescription, aKsNoRepeat);
    },

    setEditKey: function (aKeys, aFunc, aKsdescription, aKsNoRepeat) {
        this.defineKey(this.modes.EDIT, aKeys, aFunc, aKsdescription, aKsNoRepeat);
    },

    setViewKey: function (aKeys, aFunc, aKsdescription, aKsNoRepeat) {
        this.defineKey(this.modes.VIEW, aKeys, aFunc, aKsdescription, aKsNoRepeat);
    },

    setCaretKey: function (aKeys, aFunc, aKsdescription, aKsNoRepeat) {
        this.defineKey(this.modes.CARET, aKeys, aFunc, aKsdescription, aKsNoRepeat);
    },

    defineKey: function (aKeyMapName, aKeys, aFunc, aKsDescription, aKsNoRepeat) {
        if (!aKeyMapName || !aKeys || !aFunc)
            return;

        if (!(aKeyMapName instanceof Array))
            aKeyMapName = [aKeyMapName];

        for (let [, keyMapName] in Iterator(aKeyMapName))
        {
            var addTo = this.keyMapHolder[keyMapName];

            aFunc.ksDescription = aKsDescription;
            aFunc.ksNoRepeat    = aKsNoRepeat;

            // check if this keybind is defined in external file (plugins)
            if (this.inExternalFile)
                aFunc.ksDefinedInExternalFile = this.inExternalFile;

            switch (typeof aKeys)
            {
            case "string":
                // one key stroke
                addTo[aKeys] = aFunc;
                break;
            case "object":
                if (aKeys[0] instanceof Array)
                {
                    // multiple registration
                    for (var i = 0; i < aKeys.length; ++i)
                    {
                        this.registerKeySequence(aKeys[i], aFunc, addTo);
                    }
                }
                else
                {
                    // simple form
                    this.registerKeySequence(aKeys, aFunc, addTo);
                }
                break;
            }
        }
    },

    // }} ======================================================================= //

    /**
     * @param {keyMap} aKeyMap
     * @param {[String]} aKeySequence
     * @returns {keyMap} trailed keymap using <b>keyMap</b>. null when failed to trail
     */
    trailByKeySequence: function (aKeyMap, aKeySequence) {
        var keyStr;
        var to = aKeySequence.length;

        for (var i = 0; i < to; ++i)
        {
            keyStr = aKeySequence[i];

            // if we can't find key sequence specified by aKeySequence in aKeyMap, return null
            if (typeof aKeyMap[keyStr] !== "object")
                return null;

            // go to the next keymap (dig)
            aKeyMap = aKeyMap[keyStr];
        }

        return aKeyMap;
    },

    /**
     * examples)
     * ["M--", "2", "1", "3"] => -213
     * [this.universalArgumentKey, this.universalArgumentKey, this.universalArgumentKey] => 64
     * ["C-9", "2"] => 92
     * @param {[String]} aKeySequence key sequence (array) to be parsed
     * @returns {Integer} prefix argument
     */
    parsePrefixArgument: function (aKeySequence) {
        if (!aKeySequence.length)
        {
            return null;
        }

        var arg = 0;
        var numSequence = [];
        var coef = 1;
        var i = 1;

        switch (aKeySequence[0])
        {
        case this.universalArgumentKey:
            arg = 4;
            while (aKeySequence[i] == this.universalArgumentKey && i < aKeySequence.length)
            {
                // Repeating C-u without digits or minus sign
                // multiplies the argument by 4 each time.
                arg <<= 2;
                i++;
            }
            if (i != aKeySequence.length)
            {
                // followed by non C-u key
                arg = 0;
                if (aKeySequence[1] == '-')
                {
                    // C-u -
                    coef = -1;
                    i = 2;
                }
            }
            break;
        case this.negativeArgument1Key:
        case this.negativeArgument2Key:
        case this.negativeArgument3Key:
            // negative argument
            coef = -1;
            break;
        default:
            while (typeof aKeySequence[i] === "string" &&
                   util.getUnicharPref("extensions.keysnail.keyhandler.digit_prefix_argument_type") !== "Digit" &&
                   this.isDigitArgumentKey(this.stringToKeyEvent(aKeySequence[i])))
            {
                i++;
            }

            // M-2 ... C-1 ... C-M-9
            // => 2 ... 1 ... 9
            var mix = aKeySequence[i - 1];
            numSequence[0] = Number(mix.charAt(mix.length - 1));
        }

        // ["3", "2", "1"] => [1, 2, 3]
        for (; i < aKeySequence.length; ++i)
        {
            numSequence.unshift(Number(aKeySequence[i]));
        }

        var base = 1;
        for (i = 0; i < numSequence.length; base *= 10, ++i)
        {
            arg += (numSequence[i] * base);
        }

        return coef * arg;
    },

    /**
     * @param aFunc  function to execute / iterate
     * @param aEvent key event binded with the aFunc
     * @param aArg   prefix argument to be passed
     */
    executeFunction: function (aFunc, aEvent, aArg) {
        let hookArg = {
            func  : aFunc,
            event : aEvent,
            arg   : aArg
        };

        /**
         * User can cancell command from PreCommand hook
         * by throwing exception
         */
        try {
            hook.callHook("PreCommand", hookArg);
        } catch (x) {
            return;
        }

        try {
            if (!aFunc.ksNoRepeat && aArg) {
                // iterate
                for (let i = 0; i < aArg; ++i)
                    aFunc(aEvent, aArg);
            } else {
                // one time
                aFunc(aEvent, aArg);
            }
        } catch (x) {
            util.error(x, "key.executeFunction");
        }

        this.lastFunc = aFunc;

        hook.callHook("PostCommand", hookArg);
    },

    /**
     * @param aTarget   Target. in most case, this is retrieved from
     *                  event.target or event.originalTarget
     * @param aKey      key code of the key event to generate
     * @param {bool} aNoHandle when this argument is true, KeySnail does not handle
     *                  the key event generated by this method.
     * @param aType     KeyboardEvent type (keypress, keydown, keyup, ...)
     */
    generateKey: function(aTarget, aKey, aNoHandle, aType) {
        // Make effort to use document in the aTargets's context
        var doc = document;
        try {
            var globalForTarget = Components.utils.getGlobalForObject(aTarget);
            if (globalForTarget.document) {
                doc = globalForTarget.document;
            }
        } catch (x) {}

        var newEvent = doc.createEvent('KeyboardEvent');
        newEvent.initKeyEvent(aType || 'keypress' /* type */,
                              true /* bubbles */,
                              true /* cancelable */,
                              null /* viewArg */,
                              false /* ctrlKeyArg */,
                              false /* altKeyArg */,
                              false /* shiftKeyArg */,
                              false /* metaKeyArg */,
                              aKey /* keyCodeArg */,
                              0 /* charCodeArg*/);
        if (aNoHandle) {
            // KeySnail does not handle this key event.
            // See "handleEvent".
            newEvent.ksNoHandle = true;
        }
        aTarget.dispatchEvent(newEvent);
    },

    /**
     * To keep compatibility, define this method as member of key module.
     * @param {} aText
     */
    insertText: function (aText) {
        command.insertText(aText);
    },

    // Key binding list, help {{ ================================================ //

    /**
     *
     * @param {[String]} aContentHolder
     * @param {[String]} aKeyMap
     * @param {[String]} aKeySequence
     * @returns
     */
    generateKeyBindingRows: function (aContentHolder, aKeyMap, aKeySequence) {
        if (!aKeyMap)
            return;

        if (!aKeySequence)
            aKeySequence = [];

        for (let [keyStr, cont] in Iterator(aKeyMap))
        {
            switch (typeof cont)
            {
            case "function":
                var pad = (aKeySequence.length == 0) ? "" : " ";
                aContentHolder.push("<tr><td>" +
                                    html.escapeTag(aKeySequence.join(" ") + pad + keyStr) +
                                    "</td>" + "<td>" +
                                    html.escapeTag(cont.ksDescription) +
                                    "</td></tr>");
                break;
            case "object":
                aKeySequence.push(keyStr);
                this.generateKeyBindingRows(aContentHolder, aKeyMap[keyStr], aKeySequence);
                aKeySequence.pop();
                break;
            }
        }
    },

    /**
     *
     * @param {} aContentHolder
     * @param {} aH2
     * @param {} aAnchor
     * @param {} aKeyMap
     * @param {} aKeySequence
     * @returns
     */
    generateKeyBindingTable: function (aContentHolder, aH2, aAnchor, aKeyMap, aKeySequence) {
        if (aKeyMap)
        {
            aContentHolder.push("<h2 id='" + aAnchor + "'>" + aH2 + "</h2>");
            aContentHolder.push("<table class='table-keybindings'>");
            aContentHolder.push("<tr><th>" + "Key" + "</th><th>" + "Binding" + "</th></tr>");
            this.generateKeyBindingRows(aContentHolder, aKeyMap, aKeySequence);
            aContentHolder.push("</table>\n");
        }
    },

    /**
     * List all key bindings
     */
    listKeyBindings: function () {
        var contentHolder = ['<h1>All key bindings</h1><hr />',
                             '<ul>',
                             '<li><a href="#special">Special Keys</a></li>',
                             '<li><a href="#parg">Prefix Argument Keys</a></li>',
                             '<li><a href="#global">Global Bindings</a></li>',
                             '<li><a href="#view">View mode Bindings</a></li>',
                             '<li><a href="#edit">Edit mode Bindings</a></li>',
                             '<li><a href="#caret">Caret mode Bindings</a></li>',
                             '</ul>'];

        contentHolder.push("<h2 id='special'>Special Keys</h2>");
        contentHolder.push("<table class='table-keybindings'>");
        contentHolder.push("<tr><th>Role</th><th>Key</th><th>Description</th></tr>");
        contentHolder.push("<tr><td>Quit key</td><td>" + html.escapeTag(this.quitKey) + "</td><td>" +
                           util.getLocaleString("specialKeyQuit") + "</td></tr>");
        contentHolder.push("<tr><td>Help key</td><td>" + html.escapeTag(this.helpKey) + "</td><td>" +
                           util.getLocaleString("specialKeyHelp") + "</td></tr>");
        contentHolder.push("<tr><td>Escape key</td><td>" + html.escapeTag(this.escapeKey) + "</td><td>" +
                           util.getLocaleString("specialKeyEscape") + "</td></tr>");
        contentHolder.push("<tr><td>Start key macro recording</td><td>" + html.escapeTag(this.macroStartKey) + "</td><td>" +
                           util.getLocaleString("specialKeyMacroStart") + "</td></tr>");
        contentHolder.push("<tr><td>End key macro recording / Play key macro</td><td>" + html.escapeTag(this.macroEndKey) + "</td><td>" +
                           util.getLocaleString("specialKeyMacroEnd") + "</td></tr>");
        contentHolder.push("<tr><td>Suspension switch key</td><td>" + html.escapeTag(this.suspendKey) + "</td><td>" +
                           util.getLocaleString("specialKeySuspend") + "</td></tr>");
        contentHolder.push("</table>\n");

        contentHolder.push("<h2 id='parg'>Prefix Argument Keys</h2>");
        if (util.getBoolPref("extensions.keysnail.keyhandler.use_prefix_argument", true))
        {
            contentHolder.push("<p>" + util.getLocaleString("prefixArgumentYouCanDisable") + "</p>\n");
            contentHolder.push("<table class='table-keybindings'>");
            contentHolder.push("<tr><th>Key</th><th>Description</th></tr>");
            contentHolder.push("<tr><td>" + html.escapeTag(this.universalArgumentKey) + "</td><td>" +
                               util.getLocaleString("prefixArgumentUniv", [html.escapeTag(this.universalArgumentKey),
                                                                           html.escapeTag(this.universalArgumentKey)]) +
                               "</td></tr>");

            var digitArgumentKey = "-[0-9]";
            var modifier;
            switch (modifier = util.getUnicharPref("extensions.keysnail.keyhandler.digit_prefix_argument_type"))
            {
            case "C":
            case "M":
            case "C-M":
                digitArgumentKey = modifier + digitArgumentKey;
                break;
            default:
                digitArgumentKey = "";
            }

            contentHolder.push("<tr><td>" + digitArgumentKey + "</td><td>" + util.getLocaleString("prefixArgumentPos") + "</td></tr>");
            var paNegDesc = util.getLocaleString("prefixArgumentNeg") + "</td></tr>";
            contentHolder.push("<tr><td>" + html.escapeTag(this.negativeArgument1Key) + "</td><td>" + paNegDesc);
            contentHolder.push("<tr><td>" + html.escapeTag(this.negativeArgument2Key) + "</td><td>" + paNegDesc);
            contentHolder.push("<tr><td>" + html.escapeTag(this.negativeArgument3Key) + "</td><td>" + paNegDesc);
            contentHolder.push("</table>\n");
        }
        else
        {
            contentHolder.push("<p>" + util.getLocaleString("prefixArgumentYouCanEnable") + "</p>\n");
        }

        this.generateKeyBindingTable(contentHolder,
                                     "Global Bindings",
                                     this.modes.GLOBAL,
                                     this.keyMapHolder[this.modes.GLOBAL]);

        this.generateKeyBindingTable(contentHolder,
                                     "View mode Bindings",
                                     this.modes.VIEW,
                                     this.keyMapHolder[this.modes.VIEW]);

        this.generateKeyBindingTable(contentHolder,
                                     "Edit mode Bindings",
                                     this.modes.EDIT,
                                     this.keyMapHolder[this.modes.EDIT]);

        this.generateKeyBindingTable(contentHolder,
                                     "Caret mode Bindings",
                                     this.modes.CARET,
                                     this.keyMapHolder[this.modes.CARET]);

        var contentSource = html.createHTMLSource("All key bindings", contentHolder.join("\n"));
        var contentPath = html.createHTML(contentSource);

        this.viewURI(contentPath);
    },

    /**
     * Display beginning with ... help
     */
    interactiveHelp: function () {
        var contentHolder = ['<h1>Key Bindings Starting With ' +
                             html.escapeTag(this.currentKeySequence.join(" ")) + '</h1><hr />'];

        this.generateKeyBindingTable(contentHolder,
                                     "Global Bindings Starting With "
                                     + html.escapeTag(this.currentKeySequence.join(" ")),
                                     this.modes.GLOBAL,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.GLOBAL],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        this.generateKeyBindingTable(contentHolder,
                                     "View mode Bindings Starting With "
                                     + html.escapeTag(this.currentKeySequence.join(" ")),
                                     this.modes.VIEW,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.VIEW],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        this.generateKeyBindingTable(contentHolder,
                                     "Edit mode Bindings Starting With "
                                     + html.escapeTag(this.currentKeySequence.join(" ")),
                                     this.modes.EDIT,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.EDIT],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        this.generateKeyBindingTable(contentHolder,
                                     "Caret mode Bindings Starting With "
                                     + html.escapeTag(this.currentKeySequence.join(" ")),
                                     this.modes.CARET,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.CARET],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        var contentSource = html.createHTMLSource("Interactive Help", contentHolder.join("\n"));
        var contentPath = html.createHTML(contentSource);

        this.viewURI(contentPath);
    },

    viewURI: function (aURI) {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");

        mainWindow.getBrowser().loadOneTab(aURI, null, null, null, false, false);
    },

    // }} ======================================================================= //

    message: KeySnail.message
};
