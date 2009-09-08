/**
 * @fileOverview
 * @name macro.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Macro = {
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

        // var doc;
        // doc = (window.document.commandDispatcher.focusedWindow || window).document;
        // return (doc.commandDispatcher) ? doc.commandDispatcher.focusedElement : doc;
    },

    /**
     * play keyboard macro
     * @param {[KeyboardEvent]} aEvents array of keypress event
     */
    doMacro: function (aEvents) {
        var len = aEvents.length;
        var event, newEvent;
        var sleepTime = this.sleepTime;

        for (var i = 0; i < len; ++i) {
            event = aEvents[i];
            newEvent = document.createEvent('KeyboardEvent');
            newEvent.initKeyEvent('keypress', true, true, null,
                                  event.ctrlKey,
                                  event.altKey,
                                  event.shiftKey,
                                  event.metaKey,
                                  event.keyCode,
                                  event.charCode);
            this.getCurrentFocusedElement().dispatchEvent(newEvent);
            this.sleep(sleepTime);
            // stack.push(this.modules.key.keyEventToString(event));
        }
        // Application.console.log(stack.join(" "));
    },

    /**
     * sleep current thread for <aWait> [msec] time.
     * from http://d.hatena.ne.jp/fls/20090224/p1
     * @param {Integer} aWait sleep time in mili-second
     */
    sleep: function (aWait) {
        var timer = {
            timeup: false
        };

        var thread = Components.classes["@mozilla.org/thread-manager;1"]
            .getService().mainThread;

        var interval = window.setInterval(function () { timer.timeup = true; }, aWait);
        while (!timer.timeup) {
            thread.processNextEvent(true);
        }
        window.clearInterval(interval);
    }
};
