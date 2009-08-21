KeySnail.Key = {
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
    // useful to for the access key
    escapeCurrentChar: false,

    // ==== magic keys ====
    // these keys can be configured through the user config file
    quitKey: "C-g",
    helpKey: "<f1>",
    escapeKey: "C-q",
    macroStartKey: "Not defined",
    macroEndKey: "Not defined",

    // ==== keyboard macro ====
    currentMacro: [],
    inputtingMacro: false,

    // ==== status ====
    status: false,
    suspended: false,
    hasEventListener: false,

    // ==== black list ====
    blackList: null,

    // ==== modes ====
    modes: {
        GLOBAL: "global",
        VIEW:   "view",
        EDIT:   "edit",
        CARET:  "caret"
        // MENU:   "menu"
    },

    init: function () {
        this.declareKeyMap(this.modes.GLOBAL);
        this.declareKeyMap(this.modes.VIEW);
        this.declareKeyMap(this.modes.EDIT);
        this.declareKeyMap(this.modes.CARET);
        this.currentKeyMap = this.keyMapHolder[this.modes.GLOBAL];

        this.status = nsPreferences
            .getBoolPref("extensions.keysnail.keyhandler.status", true);
    },

    // ==================== Run / Stop ====================

    /**
     * start key handler
     */
    run: function () {
        if (this.hasEventListener == false) {
            window.addEventListener("keypress", this, true);
            this.hasEventListener = true;
        }
        this.status = true;
        nsPreferences.setBoolPref("extensions.keysnail.keyhandler.status", true);
    },

    /**
     * stop key handler
     */
    stop: function () {
        if (this.hasEventListener == true) {
            window.removeEventListener("keypress", this, true);
            this.hasEventListener = false;
        }
        this.status = false;
        nsPreferences.setBoolPref("extensions.keysnail.keyhandler.status", false);
    },

    /**
     * toggle current keyhandler status
     * when init file is not loaded, reject
     */
    toggleStatus: function () {
        if (this.status) {
            this.stop();
        } else if (this.modules.userscript.initFileLoaded) {
            this.run();
        } else {
            // no initialization file is loaded
            this.modules.display.prettyPrint(this.modules.util
                                             .getLocaleString("noUserScriptLoaded"));
            // window.alert(this.modules.util.
            //              getLocaleString("noUserScriptLoaded"));
            this.status = false;
        }

        this.updateMenu();
        this.updateStatusBar();
    },

    /**
     * check for the black list regexp and if <aURL> found in black list,
     * suspend the keyhandler.
     * If <aURL> is undefined, force suspend.
     * @param {string} aURL page URL to check.
     */
    checkBlackList: function (aURL) {
        if (!this.blackList)
            return;

        if (aURL) {
            this.suspended =
                this.blackList.some(function (elem) { return !!aURL.match(elem); });
        } else {
            // about:blank ...
            this.suspended = false;
        }

        this.updateStatusBar();
    },

    /**
     * update the status bar icon
     */
    updateStatusBar: function () {
        var icon = document.getElementById("keysnail-statusbar-icon");
        if (!icon)
            return;

        if (this.status) {
            // enabled
            if (this.suspended) {
                icon.src = "chrome://keysnail/skin/icon16suspended.png";
                icon.tooltipText = this.modules.util
                    .getLocaleString("keySnailSuspended");
            } else {
                icon.src = "chrome://keysnail/skin/icon16.png";
                icon.tooltipText = this.modules.util
                    .getLocaleString("keySnailEnabled");
            }
        } else {
            // disabled
            icon.src = "chrome://keysnail/skin/icon16gray.png";
            icon.tooltipText = this.modules.util
                .getLocaleString("keySnailDisabled");
        }
    },

    /**
     * update the status bar menu
     */
    updateMenu: function () {
        var checkbox = document.getElementById("keysnail-menu-status");
        if (!checkbox) {
            return;
        }

        checkbox.setAttribute('checked', this.status);
    },

    // ==================== Handle Key Event ====================

    /**
     * first seek for the key from local-key-map
     * and if does not found, seek for global-key-map
     * Note: this function is called implicitly
     * when the 'keypress' event occured
     * @param {KeyboardEvent} aEvent event to handle
     */
    handleEvent: function (aEvent) {
        if (aEvent.ksNoHandle || this.suspended) {
            // ignore key event generated by generateKey
            // when ksNoHandle is set to true
            return;
        }

        if (this.escapeCurrentChar) {
            // no stop event propagation
            this.backToNeutral("Escaped", 3000);
            return;
        }

        // ----------------------------------------

        var key = this.keyEventToString(aEvent);

        if (this.inputtingMacro) {
            this.currentMacro.push(aEvent);
        }

        switch (key) {
        case this.escapeKey:
            this.modules.util.stopEventPropagation(aEvent);
            this.modules.display.echoStatusBar("Escape: ");
            this.escapeCurrentChar = true;
            return;
        case this.quitKey:
            this.modules.util.stopEventPropagation(aEvent);
            // call hooks
            this.modules.hook.callHook("KeyBoardQuit", aEvent);
            // cancell current key sequence
            this.backToNeutral("Quit");
            return;
        case this.macroEndKey:
            this.modules.util.stopEventPropagation(aEvent);
            if (this.inputtingMacro) {
                this.currentMacro.pop();
                this.modules.display.echoStatusBar("Keyboard macro defined", 3000);
                this.inputtingMacro = false;
            } else {
                if (this.currentMacro.length) {
                    this.modules.display.echoStatusBar("Do macro", 3000);
                    this.modules.macro.doMacro(this.currentMacro);
                } else {
                    this.modules.display.echoStatusBar("No macro defined", 3000);
                }
            }
            return;
        case this.macroStartKey:
            this.modules.util.stopEventPropagation(aEvent);
            if (this.inputtingMacro) {
                this.currentMacro.pop();
            } else {
                this.modules.display.echoStatusBar("Defining Keyboard macro ...", 3000);
                this.currentMacro.length = 0;
                this.inputtingMacro = true;
            }
            return;
        }

        if (this.inputtingPrefixArgument) {
            if (this.isKeyEventNum(aEvent) ||
                key == "C-u" ||
                ((this.currentKeySequence[this.currentKeySequence.length - 1] == "C-u") &&
                 (key == '-'))) {
                // append to currentKeySequence, while the key event is number value.
                // sequencial C-u like C-u C-u => 4 * 4 = 16 is also supported.
                // sequencial C-u - begins negative prefix argument
                this.modules.util.stopEventPropagation(aEvent);
                this.currentKeySequence.push(key);
                this.modules.display.echoStatusBar(this.currentKeySequence.join(" ") + " [prefix argument]");
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

        if (this.currentKeySequence.length) {
            // after second stroke
            if (key == this.helpKey) {
                this.modules.util.stopEventPropagation(aEvent);
                this.interactiveHelp();
                this.backToNeutral("");
                return;
            }
        } else {
            // first stroke
            if (this.isPrefixArgumentKey(key, aEvent)) {
                // user can disable the prefix argument feature
                if (nsPreferences.getBoolPref("extensions.keysnail.keyhandler.use_prefix_argument", true)) {
                    // transit state: to inputting prefix argument
                    this.modules.util.stopEventPropagation(aEvent);
                    this.currentKeySequence.push(key);
                    this.modules.display.echoStatusBar(key + " [prefix argument]");
                    this.inputtingPrefixArgument = true;
                    return;
                }
            }

            // decide which keymap to use
            var modeName;

            if (this.modules.util.isWritable()) {
                modeName = this.modes.EDIT;
            } else {
                modeName = this.modules.util.isCaretEnabled()
                    || nsPreferences.getBoolPref("accessibility.browsewithcaret") ?
                    this.modes.CARET : this.modes.VIEW;
            }

            // this.message(modeName + "-mode");
            // this.modules.display.prettyPrint(modeName + "-mode");
            this.currentKeyMap = this.keyMapHolder[modeName];
        }

        if (!this.currentKeyMap[key]) {
            // if key is not found in the local key map
            // check for the global key map, using currentKeySequence
            this.currentKeyMap = this.trailByKeySequence(this.keyMapHolder[this.modes.GLOBAL],
                                                         this.currentKeySequence);

            if (!this.currentKeyMap) {
                // failed to trace the currentKeySequence
                this.backToNeutral("");
                return;
            }
        }

        if (this.currentKeyMap[key]) {
            // prevent browser default behaviour
            this.modules.util.stopEventPropagation(aEvent);

            if (typeof(this.currentKeyMap[key]) == "function") {
                // save function and prefixArgument
                var func = this.currentKeyMap[key];
                var arg  = this.prefixArgument;
                this.backToNeutral("");

                // Maybe this annoys not a few people. So I disable this.
                // if (this.func.ksDescription) {
                //     this.modules.display.echoStatusBar(func.ksDescription, 2000);
                // }

                // call saved function
                // this.message("Prefix Argument : " + arg);
                this.executeFunction(func, aEvent, arg);
            } else {
                // add key to the key sequece
                this.currentKeySequence.push(key);

                // Display key sequence
                if (this.prefixArgumentString) {
                    this.modules.display.echoStatusBar(this.prefixArgumentString
                                                       + this.currentKeySequence.join(" "));
                } else {
                    this.modules.display.echoStatusBar(this.currentKeySequence.join(" "));
                }

                // move to the next keymap
                this.currentKeyMap = this.currentKeyMap[key];
            }
        } else {
            // call default handler or insert text
            if (this.currentKeySequence.length) {
                this.modules.util.stopEventPropagation(aEvent);
                this.backToNeutral(this.currentKeySequence.join(" ")
                                   + " " + key + " is undefined", 3000);
            } else {
                if (this.prefixArgument > 0 && this.modules.util.isWritable()) {
                    this.modules.util.stopEventPropagation(aEvent);
                    // insert repeated string
                    this.insertText(new Array(this.prefixArgument + 1)
                                    .join(String.fromCharCode(aEvent.charCode)));
                }
                this.backToNeutral("");
            }
        }
    },

    // ==================== magic key ==================== //

    /**
     * check if the key event is ctrl key (predicative)
     * @param {KeyboardEvent} aEvent
     * @return true when <aEvent> is control key
     */
    isControlKey: function (aEvent) {
        return aEvent.ctrlKey || aEvent.commandKey;
    },

    /**
     * check if the key event is meta key (predicative)
     * @param {KeyboardEvent} aEvent
     * @return true when <aEvent> is meta key
     */
    isMetaKey: function (aEvent) {
        return aEvent.altKey || aEvent.metaKey;
    },

    // ==================== key event => string ==================== //

    /**
     * convert key event to string expression
     * @param {KeyboardEvent} aEvent
     * @return {String} string expression of <aEvent>
     */
    keyEventToString: function (aEvent) {
        var key;

        // this.modules.display.prettyPrint("char code : " + aEvent.charCode + "   " +
        //                                  "key code : " + aEvent.keyCode + "   " +
        //                                  (aEvent.ctrlKey ? "C" : "_") + (aEvent.altKey ? "M" : "_")
        //                                 );

        if (aEvent.charCode >= 0x20 && aEvent.charCode <= 0x7e) {
            // ASCII displayable characters (0x20 : SPC)
            key = String.fromCharCode(aEvent.charCode);
            if (aEvent.charCode == 0x20) {
                key = "SPC";
            }
        } else if (aEvent.keyCode >= KeyEvent.DOM_VK_F1 &&
                   aEvent.keyCode <= KeyEvent.DOM_VK_F24) {
            // function keys
            key = "<f"
                + (aEvent.keyCode - KeyEvent.DOM_VK_F1 + 1)
                + ">";
        } else {
            // special charactors
            switch (aEvent.keyCode) {
            case KeyEvent.DOM_VK_ESCAPE:
                key = "ESC";
                break;
            case KeyEvent.DOM_VK_RETURN:
            case KeyEvent.DOM_VK_ENTER:
                key = "RET";
                break;
            case KeyEvent.DOM_VK_RIGHT:
                key = "<right>";
                break;
            case KeyEvent.DOM_VK_LEFT:
                key = "<left>";
                break;
            case KeyEvent.DOM_VK_UP:
                key = "<up>";
                break;
            case KeyEvent.DOM_VK_DOWN:
                key = "<down>";
                break;
            case KeyEvent.DOM_VK_PAGE_UP:
                key = "<prior>";
                break;
            case KeyEvent.DOM_VK_PAGE_DOWN:
                key = "<next>";
                break;
            case KeyEvent.DOM_VK_END:
                key = "<end>";
                break;
            case KeyEvent.DOM_VK_HOME:
                key = "<home>";
                break;
            case KeyEvent.DOM_VK_TAB:
                key = "<tab>";
                break;
            case KeyEvent.DOM_VK_BACK_SPACE:
                key = "<backspace>";
                break;
            case KeyEvent.DOM_VK_PRINTSCREEN:
                key = "<print>";
                break;
            case KeyEvent.DOM_VK_INSERT:
                key = "<insert>";
                break;
            case KeyEvent.DOM_VK_DELETE:
                key = "<delete>";
            case 0xE2:
                /**
                 * windows specific bug
                 * When Ctrl + _ is pressed, the char code becomes 0, not the 95
                 * and the key code becomes 242 (0xE2)
                 */
                if (aEvent.ctrlKey)
                    key = "_";
                break;
            }
        }

        // append modifier
        if (this.isControlKey(aEvent) && this.isMetaKey(aEvent)) {
            key = "C-M-" + key;
        } else if (this.isMetaKey(aEvent)) {
            key = "M-" + key;
        } else if (this.isControlKey(aEvent)) {
            key = "C-" + key;
        }

        return key;
    },

    /**
     * convert key event to string expression
     * @param {String} aKey string expression
     * @return {KeyboardEvent}
     */
    stringToKeyEvent: function (aKey) {
        var newEvent = document.createEvent('KeyboardEvent');
        var ctrlKey = false;
        var altKey = false;
        var keyCode = 0;
        var charCode = 0;

        // process modifier
        if (aKey.length > 1 && aKey.charAt(1) == '-') {
            while (aKey.charAt(0) == 'C' || aKey.charAt(0) == 'M') {
                switch (aKey.charAt(0)) {
                case 'C':
                    ctrlKey = true;
                    break;
                case 'M':
                    altKey = true;
                    break;
                }
                aKey = aKey.slice(2);
            }
            // has modifier
        }

        if (aKey.charAt(0) == '<') {
            // special key
            if (aKey.charAt(1).toLowerCase() == 'f') {
                // <f
                // function key
                var num = aKey.match("<f(\d+\)>");
                num = !!num ? parseInt(num[0]) : 0;

                if (num > 0 && num < 25) {
                    keyCode = KeyEvent.DOM_VK_F1 + num - 1;
                }
            } else {
                switch (aKey) {
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
                case "<delete>":
                    keyCode = KeyEvent.DOM_VK_DELETE;
                    break;
                }
            }
        } else {
            if (aKey.length == 1) {
                // ascii char
                charCode = aKey.charCodeAt(0);
            } else {
                switch (aKey) {
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

        newEvent.initKeyEvent('keypress', true, true, null,
                              ctrlKey, altKey, false, false,
                              keyCode, charCode);

        return newEvent;
    },

    /**
     * check if the key event is number
     * @param {KeyboardEvent} aEvent
     * @return {bool} true when <aEvent> is the event of the number key
     * e.g. 0, 1, 2, 3, 4 ,5, 6, 7, 8, 9
     */
    isKeyEventNum: function (aEvent) {
        return (aEvent.charCode >= 0x30 &&
                aEvent.charCode <= 0x39);
    },

    // @return true if aKey is the valid literal key expression
    // example)
    // a   => valid
    // C-t => valid
    // M-< => valid
    // C=C => invalid
    // %%% => invalid
    validateKey: function (aKey) {
        return true;
    },

    // @return index of the invalid key in the key sequence
    //         -1 when there are no invalid keys
    seekInvalidKey: function (aKeys) {
        var i = 0;
        var len = 0;
        for (; i < len; ++i) {
            if (!this.validateKey(aKeys[i])) {
                return i;
            }
        }

        return -1;
    },

    registerKeySequence: function (aKeys, aFunc, aKeyMap) {
        // validate (currently, not works)

        // var invalidKeyIndex = this.seekInvalidKey(aKeys);

        // if (invalidKeyIndex >= 0) {
        //     this.message("'" + aKeys[invalidKeyIndex]
        //                  + "' isn't a valid key");
        //     return false;
        // }

        var key;
        var to = aKeys.length - 1;
        for (var i = 0; i < to; ++i) {
            key = aKeys[i];

            switch (typeof(aKeyMap[key])) {
            case "function":
                this.message(aKeyMap[key].ksDescription
                             + " bound to [" + aKeys.slice(0, i + 1).join(" ")
                             + "] overrided with the prefix key.");
                // this.message("[" + aKeys.slice(0, i + 1).join(" ")
                //              + "] is already bound to "
                //              + aKeyMap[key].ksDescription);
                // this.message("Failed to bind "+ aFunc.ksDescription
                //              + " to [" + aKeys.join(" ") + "] ");
                // no break;
            case "undefined":
                // create a new (pseudo) aKeyMap
                aKeyMap[key] = new Object();
                break;
            }

            // dig, dig
            aKeyMap = aKeyMap[key];
        }

        aKeyMap[aKeys[i]] = aFunc;
    },

    // ==================== set key sequence to the keymap  ====================

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

    defineKey: function (aKeyMapName, aKeys, aFunc, aKsdescription, aKsNoRepeat) {
        var addTo = this.keyMapHolder[aKeyMapName];

        // if (aKsdescription) {
        aFunc.ksDescription = aKsdescription;
        // }
        // true, if you want to prevent the iteration
        // of the command when prefix argument specified.
        aFunc.ksNoRepeat = aKsNoRepeat;

        switch (typeof(aKeys)) {
        case "string":
            // one key stroke
            addTo[aKeys] = aFunc;
            break;
        case "object":
            if (typeof(aKeys[0]) == "object") {
                // multi registration
                for (var i = 0; i < aKeys.length; ++i) {
                    this.registerKeySequence(aKeys[i], aFunc, addTo);
                }
            } else {
                // simple form
                this.registerKeySequence(aKeys, aFunc, addTo);
            }
            break;
        }
    },

    declareKeyMap: function (aKeyMapName) {
        if (this.keyMapHolder[aKeyMapName] == undefined) {
            // undefined keyMap
            this.keyMapHolder[aKeyMapName] = new Object();
        }
    },

    copyKeyMap: function (aTargetKeyMapName, aDestinationKeyMapName) {
        var aTarget = this.keyMapHolder[aTargetKeyMapName];
        var aDestination = this.keyMapHolder[aDestinationKeyMapName];

        for (var property in aTarget) {
            aDestination[property] = aTarget[property];
        }
    },

    copy: function (aTargetKeyMapName, aDestinationKeyMapName) {
        this.message("key.copy() is obsoleted. Use key.copyKeyMap.");
        this.copyKeyMap(aTargetKeyMapName, aDestinationKeyMapName);
    },

    backToNeutral: function (aMsg, aTime) {
        // reset keymap
        this.currentKeyMap = this.keyMapHolder[this.modes.GLOBAL];
        // reset statusbar
        this.modules.display.echoStatusBar(aMsg, aTime);
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
     * @param {keyMap} aKeyMap
     * @param {[String]} aKeySequence
     * @return {keyMap} trailed keymap using <keyMap>. null when failed to trail
     */
    trailByKeySequence: function (aKeyMap, aKeySequence) {
        var key;
        var to = aKeySequence.length;
        for (var i = 0; i < to; ++i) {
            key = aKeySequence[i];
            if (typeof(aKeyMap[key]) != "object") {
                // failed to trail
                return null;
            }

            // when trailable, go to the next keymap
            aKeyMap = aKeyMap[key];
        }

        return aKeyMap;
    },

    /**
     * examples)
     * ["M--", "2", "1", "3"] => -213
     * ["C-u", "C-u", "C-u"] => 64
     * ["C-9", "2"] => 92
     * @param {[String]} aKeySequence key sequence (array) to be parsed
     * @return {Integer} prefix argument
     */
    parsePrefixArgument: function (aKeySequence) {
        if (!aKeySequence.length) {
            return null;
        }

        var arg = 0;
        var numSequence = [];
        var coef = 1;
        var i = 1;

        switch (aKeySequence[0]) {
        case "C-u":
            arg = 4;
            while (aKeySequence[i] == "C-u" && i < aKeySequence.length) {
                // Repeating C-u without digits or minus sign
                // multiplies the argument by 4 each time.
                arg <<= 2;
                i++;
            }
            if (i != aKeySequence.length) {
                // followed by non C-u key
                arg = 0;
                if (aKeySequence[1] == '-') {
                    // C-u -
                    coef = -1;
                    i = 2;
                }
            }
            break;
        case "C--":
        case "C-M--":
        case "M--":
            // negative argument
            coef = -1;
            break;
        default:
            // M-2 ... C-1 ... C-M-9
            // => 2 ... 1 ... 9
            var mix = aKeySequence[0];
            numSequence[0] = Number(mix.charAt(mix.length - 1));
        }

        // ["3", "2", "1"] => ["1", "2", "3"]
        for (; i < aKeySequence.length; ++i) {
            numSequence.unshift(Number(aKeySequence[i]));
        }

        var base = 1;
        for (i = 0; i < numSequence.length; base *= 10, ++i) {
            arg += (numSequence[i] * base);
        }

        // this.modules.display.prettyPrint("prefix : " + coef * arg);

        return coef * arg;
    },

    /**
     * @param {String} aKey literal expression of the aEvent
     * @param {Event} aEvent key event
     * @return {Boolean} true, is the key specified by aKey and aEvent
     *         will be followed by prefix argument
     */
    isPrefixArgumentKey: function (aKey, aEvent) {
        return (aKey == "C-u"   ||
                // negative argument
                aKey == "M--"   ||
                aKey == "C--"   ||
                aKey == "C-M--" ||
                // C-degit only (M-degit is useful for tab navigation ...)
                (aEvent.ctrlKey && this.isKeyEventNum(aEvent))
               );
    },

    /**
     * @param aFunc  function to execute / iterate
     * @param aEvent key event binded with the aFunc
     * @param aArg   prefix argument to be passed
     */
    executeFunction: function (aFunc, aEvent, aArg) {
        if (!aFunc.ksNoRepeat && aArg) {
            // iterate
            for (var i = 0; i < aArg; ++i) {
                // aFunc.apply(this.modules, [aEvent, aArg]);
                aFunc.apply(KeySnail, [aEvent, aArg]);
            }
        } else {
            // one time
            aFunc.apply(KeySnail, [aEvent, aArg]);
            // aFunc.apply(this.modules, [aEvent, aArg]);
        }
    },

    /**
     * @param aTarget   Target. in most case, this is retrieved from
     *                  event.target or event.originalTarget
     * @param aKey      key code of the key event to generate
     * @param {bool} aNoHandle when this argument is true, KeySnail does not handle
     *                  the key event generated by this method.
     */
    generateKey: function(aTarget, aKey, aNoHandle) {
        var newEvent = document.createEvent('KeyboardEvent');
        // event.initKeyEvent(type, bubbles, cancelable, viewArg,
        //                    ctrlKeyArg, altKeyArg, shiftKeyArg, metaKeyArg,
        //                    keyCodeArg, charCodeArg)
        newEvent.initKeyEvent('keypress', true, true, null,
                              false, false, false, false,
                              aKey, 0);
        if (aNoHandle) {
            // KeySnail does not handle this key event.
            // See "handleEvent".
            newEvent.ksNoHandle = true;
        }
        aTarget.dispatchEvent(newEvent);
    },

    /**
     * original code from Firemacs
     * http://www.mew.org/~kazu/proj/firemacs/
     * @param {String} text
     * @return
     */
    insertText: function (text) {
        var command = 'cmd_insertText';
        var controller = document.commandDispatcher.getControllerForCommand(command);
        if (controller && controller.isCommandEnabled(command)) {
            controller = controller.QueryInterface(Components.interfaces.nsICommandController);
            var params = Components.classes['@mozilla.org/embedcomp/command-params;1'];
            params = params.createInstance(Components.interfaces.nsICommandParams);
            params.setStringValue('state_data', text);
            controller.doCommandWithParams(command, params);
        }
    },

    /**
     *
     * @param {[String]} aContentHolder
     * @param {[String]} aKeyMap
     * @param {[String]} aKeySequence
     * @return
     */
    generateKeyBindingRows: function (aContentHolder, aKeyMap, aKeySequence) {
        if (!aKeyMap) {
            return;
        }

        if (!aKeySequence) {
            aKeySequence = [];
        }

        for (i in aKeyMap) {
            switch (typeof(aKeyMap[i])) {
            case "function":
                var pad = (aKeySequence.length  == 0) ? "" : " ";
                aContentHolder.push("<tr><td>" +
                                    this.modules.html
                                    .escapeTag(aKeySequence.join(" ") + pad + i) +
                                    "</td>" + "<td>" +
                                    this.modules.html
                                    .escapeTag(aKeyMap[i].ksDescription) +
                                    "</td></tr>");
                break;
            case "object":
                aKeySequence.push(i);
                this.generateKeyBindingRows(aContentHolder, aKeyMap[i], aKeySequence);
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
     * @return
     */
    generateKeyBindingTable: function (aContentHolder, aH2, aAnchor, aKeyMap, aKeySequence) {
        if (aKeyMap) {
            aContentHolder.push("<h2 id='" + aAnchor + "'>" + aH2 + "</h2>");
            aContentHolder.push("<table class='table-keybindings'>");
            aContentHolder.push("<tr><th>" + "Key" + "</th><th>" + "Binding" + "</th></tr>");
            this.generateKeyBindingRows(aContentHolder, aKeyMap, aKeySequence);
            aContentHolder.push("</table>\n");
        }
    },

    // Display beginning with ... help
    interactiveHelp: function () {
        var contentHolder = ['<h1>Key Bindings Starting With ' +
                             this.currentKeySequence.join(" ") + '</h1><hr />'];

        this.generateKeyBindingTable(contentHolder,
                                     "Global Bindings Starting With "
                                     + this.currentKeySequence.join(" "),
                                     this.modes.GLOBAL,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.GLOBAL],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        this.generateKeyBindingTable(contentHolder,
                                     "View mode Bindings Starting With "
                                     + this.currentKeySequence.join(" "),
                                     this.modes.VIEW,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.VIEW],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        this.generateKeyBindingTable(contentHolder,
                                     "Edit mode Bindings Starting With "
                                     + this.currentKeySequence.join(" "),
                                     this.modes.EDIT,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.EDIT],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        this.generateKeyBindingTable(contentHolder,
                                     "Caret mode Bindings Starting With "
                                     + this.currentKeySequence.join(" "),
                                     this.modes.CARET,
                                     this.trailByKeySequence(this.keyMapHolder[this.modes.CARET],
                                                             this.currentKeySequence),
                                     this.currentKeySequence);

        var contentSource = this.modules.html
            .createHTMLSource("Interactive Help", contentHolder.join("\n"));
        var contentPath = this.modules.html
            .createHTML(contentSource);

        this.viewURI(contentPath);
    },

    // List all key bindings
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

        with (this.modules) {
            contentHolder.push("<h2 id='special'>Special Keys</h2>");
            contentHolder.push("<table class='table-keybindings'>");
            contentHolder.push("<tr><th>Role</th><th>Key</th></tr>");
            contentHolder.push("<tr><td>Quit key</td><td>" + html.escapeTag(this.quitKey) + "</td></tr>");
            contentHolder.push("<tr><td>Help key</td><td>" + html.escapeTag(this.helpKey) + "</td></tr>");
            contentHolder.push("<tr><td>Escape key</td><td>" + html.escapeTag(this.escapeKey) + "</td></tr>");
            contentHolder.push("<tr><td>Start key macro recording</td><td>" + html.escapeTag(this.macroStartKey) + "</td></tr>");
            contentHolder.push("<tr><td>End key macro recording / Play key macro</td><td>" + html.escapeTag(this.macroEndKey) + "</td></tr>");
            contentHolder.push("</table>\n");

            contentHolder.push("<h2 id='parg'>Prefix Argument Keys</h2>");
            if (nsPreferences.getBoolPref("extensions.keysnail.keyhandler.use_prefix_argument", true)) {
                contentHolder.push("<p>" + util.getLocaleString("prefixArgumentYouCanDisable") + "</p>\n");

                var paNegDesc = util.getLocaleString("prefixArgumentNeg") + "</td></tr>";
                contentHolder.push("<table class='table-keybindings'>");
                contentHolder.push("<tr><th>Key</th><th>Description</th></tr>");
                contentHolder.push("<tr><td>C-u</td><td>" + util.getLocaleString("prefixArgumentCu") + "</td></tr>");
                contentHolder.push("<tr><td>C-[0-9]</td><td>" + util.getLocaleString("prefixArgumentPos") + "</td></tr>");
                contentHolder.push("<tr><td>M--</td><td>" + paNegDesc);
                contentHolder.push("<tr><td>C--</td><td>" + paNegDesc);
                contentHolder.push("<tr><td>C-M--</td><td>" + paNegDesc);
                contentHolder.push("</table>\n");
            } else {
                contentHolder.push("<p>" + util.getLocaleString("prefixArgumentYouCanEnable") + "</p>\n");
            }
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

        var contentSource = this.modules.html
            .createHTMLSource("All key bindings", contentHolder.join("\n"));
        var contentPath = this.modules.html
            .createHTML(contentSource);

        this.viewURI(contentPath);
    },

    viewURI: function (aURI) {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");

        mainWindow.getBrowser().loadOneTab(aURI, null, null, null, false, false);
    },

    message: KeySnail.message
};

// event.altKey   -- Alt key
// event.ctrlKey  -- Control key
// event.shiftKey
// event.metaKey

// event.keyCode

// "\C-n" => ctrl + n
// "\C-np" => (ctrl + n), p
