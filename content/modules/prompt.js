KeySnail.Prompt = {
    miniBuffer: null,
    label: null,
    input: null,

    init: function () {
        this.miniBuffer = document
            .getElementById('keysnail-minibuffer');
        this.label = document
            .getElementById('keysnail-minibuffer-label');
        this.input = document
            .getElementById('keysnail-minibuffer-input');
    },

    reset: function () {
        this.miniBuffer.hidden = true;
        this.label.value = "";
        this.input.value = "";
    },

    start: function (aPrompt, aInitialInput) {
        this.label.value = aPrompt;
        this.input.value = aInitialInput;
    },

    readString: function (aPrompt, aInitialInput, aDefaultValue) {
        this.reset();
        this.start(aPrompt, aInitialInput);
    },

    onKeyPress: function (aEvent) {
        this.message(this.modules.key.keyEventToString(aEvent));
    },

    message: KeySnail.message
};