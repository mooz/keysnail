/**
 * @fileOverview
 * @name prompt.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Prompt = {
    // ==== common ====
    modules: null,

    // DOM Objects
    promptbox: null,
    label: null,
    textbox: null,

    // Callbacks
    currentCallback: null,
    currentUserArg: null,

    savedFocusedElement: null,

    // History
    history: {
        list: null,
        index: 0,
        state: false
    },

    // Completion
    completion : {
        list: null,
        index: 0,
        state: false
    },

    init: function () {
        if (KeySnail.windowType == "navigator:browser") {
            this.promptbox = document.getElementById("keysnail-prompt");
            this.label     = document.getElementById("keysnail-prompt-label");
            this.textbox   = document.getElementById("keysnail-prompt-textbox");

            this.history.list    = [];
            // this.completion.list = [];
        }
    },

    handleEvent: function (aEvent) {

        switch (aEvent.type) {
        case 'keypress':
            this.handleKeyPress(aEvent);
            break;
        case 'blur':
            this.onBlur();
            break;
        }
    },

    onBlur: function () {
        this.finish(true);
    },

    handleKeyPress: function (aEvent) {
        switch (aEvent.keyCode) {
        case KeyEvent.DOM_VK_ESCAPE:
            this.finish(true);
            break;
        case KeyEvent.DOM_VK_RETURN:
        case KeyEvent.DOM_VK_ENTER:
            this.finish();
            break;
        case KeyEvent.DOM_VK_UP:
            if (this.history.state) {
                this.fetchItem(this.history, -1);
            } else {
                this.fetchItem(this.history, 0);
                this.history.state = true;
            }
            // reset completion index
            this.resetState(this.completion);
            break;
        case KeyEvent.DOM_VK_DOWN:
            if (this.history.state) {
                this.fetchItem(this.history, -1);
            } else {
                this.fetchItem(this.history, 0);
                this.history.state = true;
            }
            // reset completion index
            this.resetState(this.completion);
            break;
        case KeyEvent.DOM_VK_TAB:
            this.modules.util.stopEventPropagation(aEvent);
            if (this.completion.state) {
                this.fetchItem(this.completion, aEvent.shiftKey ? -1 : 1);
            } else {
                this.fetchItem(this.completion, 0);
                this.completion.state = true;
            }
            // reset history index
            this.resetState(this.history);
            break;
        default:
            // reset history index
            this.resetState(this.history);
            // reset completion index
            this.resetState(this.completion);
            break;
        }
    },

    resetState: function (aType) {
        aType.index = 0;
        aType.state = false;
    },

    fetchItem: function (aType, aDirection) {
        if (!aType || !aType.list.length)
            return;

        var index = aType.index + aDirection;
        if (index < 0)
            index = aType.list.length - 1;
        if (index >= aType.list.length)
            index = 0;

        var start = this.textbox.selectionStart;

        if (start > 0) {
            // substr matched item only
            var header = this.textbox.value.slice(0, start);
            var listLen = aType.list.length;
            var delta = (aDirection >= 0) ? 1 : -1;
            var i = index;

            if (aDirection >= 0) {
                while (i < listLen) {
                    if (aType.list[i].slice(0, start) == header) {
                        index = i;
                        break;
                    }
                    i++;
                }
            } else {
                while (i >= 0) {
                    if (aType.list[i].slice(0, start) == header) {
                        index = i;
                        break;
                    }
                    i--;
                }
            }

            if ((aDirection >= 0 && i == listLen) ||
                (aDirection < 0  && i == -1)) {
                // stay current position
                index = aType.index;
            }
        }

        this.textbox.value = aType.list[index];
        aType.index = index;

        this.textbox.selectionStart = this.textbox.selectionEnd = start;
    },

    cleanUp: function () {
        this.textbox.removeEventListener('blur', this, false);
        this.textbox.removeEventListener('keypress', this, false);

        this.textbox.value = "";
        this.label.value = "";

        this.currentCallback = null;
        this.currentUserArg = null;
        this.promptbox.hidden = true;

        if (this.savedFocusedElement) {
            this.savedFocusedElement.focus();
            this.savedFocusedElement = null;
        }
    },

    /**
     * Finish inputting and current the prompt and If user can
     * @param {boolean} aCancelled true, if user cancelled the prompt
     */
    finish: function (aCancelled) {
        if (this.currentCallback) {
            var readStr = aCancelled ? null : this.textbox.value;

            this.currentCallback(readStr, this.currentUserArg);

            if (!aCancelled && readStr.length)
                this.history.list.unshift(readStr);
        }

        this.cleanUp();
    },

    /**
     * Read string from prompt and execute <aCallback>
     * @param {string} aMsg message to be displayed
     * @param {function} aCallback function to execute after read
     * @param {object} aUserArg any object which will be passed to the <aCallback>
     * <aCallback> must take two arguments like below.
     * function callback(aReadStr, aUserArg);
     * The first aReadStr becomes the string read from prompt
     * The second arguments
     * @param {[string]} aCollection string list used to completion
     */
    read: function (aMsg, aCallback, aUserArg, aCollection, aInitialInput, aInitialCount) {
        if (!this.promptbox) {
            return;
        }

        this.savedFocusedElement = window.document.commandDispatcher.focusedElement || window.content.window;

        // set up history
        this.history.index = 0;

        // set up completion
        this.completion.list = aCollection;
        this.completion.index = aInitialCount || 0;

        // set up callbacks
        this.currentCallback = aCallback;
        this.currentUserArg = aUserArg;

        // display prompt box
        this.label.value = aMsg;
        this.textbox.value = aInitialInput || "";
        this.promptbox.hidden = false;
        // do not set selection value till textbox appear 
        this.textbox.selectionStart = this.textbox.selectionEnd = 0;

        // now focus to the input area
        this.textbox.focus();
        // add event listener
        this.textbox.addEventListener('blur', this, false);
        this.textbox.addEventListener('keypress', this, false);
    },

    message: KeySnail.message
};
