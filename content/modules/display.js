/**
 * @fileOverview
 * @name display.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Display = {
    // ==== common ====
    modules: null,

    // ==== status bar ====
    statusBar: null,            // reference to the status bar
    msgTimeOut: null,           // timeout object to the status bar

    init: function () {
        // this.modules = aModules;
        this.statusBar = document.getElementById('statusbar-display');
    },

    // ==================== Display ====================

    echoStatusBar: function (msg, time) {
        if (!this.statusBar) return;

        if (this.msgTimeOut) {
            // Cancell, when the timeout is already set to
            clearTimeout(this.msgTimeOut);
            this.msgTimeOut = null;
        }

        let self = this;

        self.statusBar.label = msg;
        if (time) {
            // Revert to default state (make closure and self to static)
            this.msgTimeOut = setTimeout(function () { self.echoStatusBar('', 0); }, time);
        }
    },

    prettyPrint: function (msg) {
        if (!content || this.modules.util.isFrameSetWindow(content)) {
            this.message(msg);
            return;
        }

        var doc = content.document;
        var dBody = doc.body;

        if (dBody) {
            var ksMessageId = "_ks_message";
            var ksMessageStyle = "z-index: 500; font-size: 30px; font-family: 'Bitstream Vera Sans Mono';"
                + " padding: 10px; margin: 3px; color: #ff5e61; background-color: #111111;"
                + " -moz-opacity: 0.7; opacity: 0.7; position: fixed; -moz-border-radius: 5px;"
                + " top: 0.5em; right: 0.5em;";

            var lines = msg.split('\n');

            var container = doc.getElementById(ksMessageId);

            if (!container) {
                container = doc.createElement("div");
                container.id = ksMessageId;
                container.style.cssText = ksMessageStyle;

                container.addEventListener('click', function () {
                                               this.style.display = 'none';
                                           }, true);

                dBody.appendChild(container);
            } else {
                // clear
                while (container.hasChildNodes()) {
                    container.removeChild(container.firstChild);
                }
            }

            container.appendChild(doc.createTextNode(lines[0]));
            for (var i = 1; i < lines.length; ++i) {
                container.appendChild(doc.createElement("br"));
                container.appendChild(doc.createTextNode(lines[i]));
            }

            container.style.display = 'block';
        } else {
            this.echoStatusBar(msg);
        }
    },

    notify: function (aMsg, aButtons) {
        const NOTIFY_ID = "ksNotifyMessage";

        if (typeof(gBrowser) == 'undefined') {
            window.alert(aMsg);
            return;
        }

        if (!aButtons) {
            aButtons = [
                {
                    label: "OK",
                    callback: function (aNotification) {
                        aNotification.close();
                    },
                    accessKey: "o"
                }
            ];
        }

        var notifyBox = gBrowser.getNotificationBox();
        var current = notifyBox.currentNotification;

        if (current && current.value == NOTIFY_ID)
            current.close();

        notifyBox.appendNotification(aMsg,
                                     NOTIFY_ID,
                                     "chrome://keysnail/skin/notify-icon16.png",
                                     "PRIORITY_WARNING_HIGH",
                                     aButtons);
    },

    message: function (msg) {
        Application.console.log(msg);
    }
};