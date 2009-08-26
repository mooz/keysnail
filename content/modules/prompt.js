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
    history: null,
    historyIndex: 0,
    trailingHistory: false,

    // Completion
    completion: null,
    trailingHistory: false,
    isCompleting: false,

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
            if (this.isCompleting) {
                this.fetchCompletion(-1);
            } else if (this.isTrailingHistory) {
                this.fetchHistory(-1);
            } else {
                this.fetchHistory(0);                
                this.isTrailingHistory = true;
            }
            break;
        case KeyEvent.DOM_VK_DOWN:
            if (this.isCompleting) {
                this.fetchCompletion(1);
            } else if (this.isTrailingHistory) {
                this.fetchHistory(-1);
            } else {
                this.fetchHistory(0);                
                this.isTrailingHistory = true;
            }
            break;
            case KeyEvent.DOM_VK_TAB:
            this.modules.util.stopEventPropagation(aEvent);
            if (this.isCompleting) {
                this.fetchCompletion(aEvent.shitfKey ? -1 : 1);
            } else {
                this.fetchCompletion(0);                
                this.isCompleting = true;
            }
            break;
        default:
            // reset history index
            this.historyIndex = 0;
            this.isTrailingHistory = false;
            // reset completion index
            this.completeIndex = 0;
            this.isCompleting = false;
            break;
        }
    },

    fetchCompletion: function (aDirection) {
        if (this.completion.length == 0)
            return;

        var start = this.textbox.selectionStart;
        var header = this.textbox.value.slice(0, start);

        var index = this.completionIndex + aDirection;

        if (index < 0)
            index = this.completion.length - 1;

        if (index >= this.completion.length)
            index = 0;            

        if (header.length > 0) {
            for (var i = index; i < this.completion.length; ++i) {
                if (this.completion[i].slice(0, start) == header) {
                    this.completionIndex = i;
                    break;
                }
            }
            for (i = 0; i < index; ++i) {
                if (this.completion[i].slice(0, start) == header) {
                    this.completionIndex = i;
                    break;
                }
            }
            if (i == index) {
                index = this.completionIndex;
            }
        }

        this.textbox.value = this.completion[index];
        this.completionIndex = index;

        if (header.length > 0)
            this.textbox.selectionStart = this.textbox.selectionEnd = start;
    },

    fetchHistory: function (aDirection) {
        if (this.history.length == 0)
            return;

        var index = this.historyIndex + aDirection;

        if (index < 0)
            index = this.completion.length - 1;

        if (index >= this.completion.length)
            index = 0;

        // if (index < 0 || index >= this.history.length)
        //     return;

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
     * @param {[string]} aCandidates string list used to completion
     * <aCallback> must take two arguments like below.
     * function callback(aReadStr, aUserArg);
     * The first aReadStr becomes the string read from prompt
     * The second arguments
     */
    read: function (aMsg, aCallback, aUserArg, aCandidates) {
        if (!this.promptbox || this.currentCallback) {
            return;
        }

        this.savedFocusedElement = document.commandDispatcher.focusedElement;
        this.historyIndex = 0;

        this.completion = aCandidates;
        this.completionIndex = 0;

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
