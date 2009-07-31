KeySnail.Macro = {
    init: function () {
        this.sleepTime = 10;
    },

    setSleepTime: function (aMsec) {
        this.sleepTime = aMsec;
    },

    getCurrentFocusedElement: function () {
        var doc;

        if (document) {
            doc = (document.commandDispatcher.focusedWindow
                   || gBrowser.contentWindow)
            .document;
        } else {
            doc = content.document;
        }

        return (doc.commandDispatcher) ? doc.commandDispatcher.focusedElement
            : doc;
    },

    doMacro: function (aEvents) {
        var len = aEvents.length;
        var newEvent;
        var sleepTime = this.sleepTime;
        // var stack = [];

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
            // stack.push(this.modules.key.keyEventToString(event));
            this.getCurrentFocusedElement().dispatchEvent(newEvent);
            this.sleep(sleepTime);
        }
        // Application.console.log(stack.join(" "));
    },

    // from http://d.hatena.ne.jp/fls/20090224/p1
    sleep: function (aWait) {
        var timer = {
            timeup: false
        };

        var interval = window.setInterval(function () { timer.timeup = true; }, aWait);
        var thread = Components.classes["@mozilla.org/thread-manager;1"]
            .getService().mainThread;
        while (!timer.timeup) {
            thread.processNextEvent(true);
        }
        window.clearInterval(interval);
    }
};
