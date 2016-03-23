/**
 * @fileOverview keyboard macro
 * @name macro.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var macro = {
    init: function () {
        this.sleepTime = 10;
    },

    /**
     * set sleep time of doMacro()
     * @param {Integer} aMsec sleep time in mili-second
     */
    setSleepTime: function (aMsec) {
        this.sleepTime = aMsec;
    },

    /**
     * return current focused element
     * @return {HTMLElement} current focused element
     */
    getCurrentFocusedElement: function () {
        return window.document.commandDispatcher.focusedElement || window.document;
    },

    /**
     * play keyboard macro
     * @param {[KeyboardEvent]} aEvents array of keypress event
     */
    doMacro: function (aEvents) {
        var len = aEvents.length;
        var sleepTime = this.sleepTime;

        for (let event of aEvents)
        {
            if (event.keyCode === KeyEvent.DOM_VK_TAB)
            {
                if (event.shiftKey)
                    document.commandDispatcher.rewindFocus();
                else
                    document.commandDispatcher.advanceFocus();
            }
            else
            {
                var newEvent = document.createEvent('KeyboardEvent');
                newEvent.initKeyEvent('keypress', true, true, null,
                                      event.ctrlKey,
                                      event.altKey,
                                      event.shiftKey,
                                      event.metaKey,
                                      event.keyCode,
                                      event.charCode);
                this.getCurrentFocusedElement().dispatchEvent(newEvent);
            }

            util.sleep(sleepTime);
        }
    }
};
