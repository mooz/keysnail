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

    history: null,
    historyIndex: 0,
    trailingHistory: false,

    init: function () {
        if (KeySnail.windowType == "navigator:browser") {
            this.promptbox = document.getElementById("keysnail-prompt");
            this.label     = document.getElementById("keysnail-prompt-label");
            this.textbox   = document.getElementById("keysnail-prompt-textbox");

            this.history = [];
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
        this.cleanUp();
    },

    handleKeyPress: function (aEvent) {
        switch (aEvent.keyCode) {
        case KeyEvent.DOM_VK_ESCAPE:
            this.cleanUp();
            break;
        case KeyEvent.DOM_VK_RETURN:
        case KeyEvent.DOM_VK_ENTER:
            this.finish();
            break;
        case KeyEvent.DOM_VK_UP:
            if (this.trailingHistory) {
                this.fetchHistory(1);                
            } else {
                this.fetchHistory(0);                
                this.trailingHistory = true;
            }
            break;
        case KeyEvent.DOM_VK_DOWN:
            if (this.trailingHistory) {
                this.fetchHistory(-1);
            } else {
                this.fetchHistory(0);                
                this.trailingHistory = true;
            }
            break;
            case KeyEvent.DOM_VK_TAB:
            this.modules.util.stopEventPropagation(aEvent);
            break;
        default:
            // reset history index
            this.historyIndex = 0;
            this.trailingHistory = false;
            break;
        }
    },

    fetchHistory: function (aDirection) {
        if (this.history.length == 0)
            return;

        var index = this.historyIndex + aDirection;

        if (index < 0 || index >= this.history.length)
            return;

        this.textbox.value = this.history[index];
        this.historyIndex = index;
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

    finish: function () {
        if (this.currentCallback) {
            var readStr = this.textbox.value;
            // this.parent.message(readStr);

            this.currentCallback(readStr, this.currentUserArg);

            if (readStr.length)
                this.history.unshift(readStr);
        }

        this.cleanUp();
    },

    /**
     * Read string from prompt and execute <aCallback>
     * @param {string} aMsg message to be displayed
     * @param {function} aCallback function to execute after read
     * @param aUserArg any object which will be passed to the <aCallback>
     * <aCallback> must take two arguments like below.
     * function callback(aReadStr, aUserArg);
     * The first aReadStr becomes the string read from prompt
     * The second arguments
     */
    read: function (aMsg, aCallback, aUserArg) {
        if (!this.promptbox || this.currentCallback) {
            return;
        }

        this.savedFocusedElement = document.commandDispatcher.focusedElement;
        this.historyIndex = 0;

        // set up callbacks
        this.currentCallback = aCallback;
        this.currentUserArg = aUserArg;

        // display prompt box
        this.label.value = aMsg;
        this.promptbox.hidden = false;

        // now focus to the input area
        this.textbox.focus();
        // add event listener
        this.textbox.addEventListener('blur', this, false);
        this.textbox.addEventListener('keypress', this, false);
    }
};
