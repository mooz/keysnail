KeySnail.Macro = {
    init: function () {
        this.sleepTime = 100;
    },

    setSleepTime: function (aMsec) {
        this.sleepTime = aMsec;
    },

    doMacro: function (aEvents) {
        var len = aEvents.length;
        var newEvent;
        var sleepTime = this.sleepTime;
        // var keyEventToString = this.modules.key
        //     .keyEventToString;

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
            Application.console.log(this.modules.key
                                    .keyEventToString(event));
            event.originalTarget.dispatchEvent(newEvent);
            this.sleep(sleepTime);
        }
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
