/**
 * @fileOverview
 * @name display.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Display = function () {
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    var modules;

    // ==== status bar ====
    var statusBar;            // reference to the status bar
    var msgTimeOut;           // timeout object to the status bar

    var smooth = 15;

    function fade(aProcess, aFinally, aInterval, aCount) {
        modules.util.sleep(aInterval);

        if (aCount > 0)
        {
            aProcess(aCount);
            arguments.callee(aProcess, aFinally, aInterval, --aCount);
        }
        else
        {
            if (aFinally)
                aFinally();
        }
    }

    function tween(aProcess, aFinally, aTotalsec) {
        modules.util.sleep(aTotalsec);

        if (aTotalsec > 1) {
            aProcess(aTotalsec);
            arguments.callee(aProcess, aFinally, aTotalsec / 2);
        }
        else
        {
            if (aFinally)
                aFinally();
        }
    }

    var self = {
        init: function () {
            modules = this.modules;

            statusBar = document.getElementById('statusbar-display');
        },

        echoStatusBar: function (msg, time) {
            if (!statusBar) return;

            if (msgTimeOut) {
                // Cancell, when the timeout is already set to
                clearTimeout(msgTimeOut);
                msgTimeOut = null;
            }

            statusBar.label = msg;
            if (time) {
                // Revert to default state (make closure and self to static)
                msgTimeOut = setTimeout(function () { self.echoStatusBar('', 0); }, time);
            }
        },

        prettyPrint: function (aMsg, aOptions) {
            aOptions = aOptions || {};

            var origOpacity = aOptions.opacity || 0.8;
            var aTimeout    = aOptions.timeout;
            var aFadetime   = aOptions.fade;

            function hideMessage() {
                function process(aCount) {
                    var percent = aCount / smooth;
                    container.style.opacity = origOpacity * percent;
                }

                function destructor() {
                    container.style.opacity = 0.0;
                    container.style.display = "none";
                }

                if (aFadetime)
                    fade(process, destructor, aFadetime / smooth, smooth);
                else
                    destructor();
            }

            function displayMessage() {
                container.style.opacity = 0.0;
                container.style.display = "block";

                function process(aCount) {
                    var percent = aCount / smooth;
                    container.style.opacity = origOpacity * (1.0 - percent);
                }

                function after() {
                    container.style.opacity = origOpacity;

                    if (aTimeout) {
                        setTimeout(hideMessage, aTimeout);
                    }
                }

                if (aFadetime)
                    fade(process, after, aFadetime / smooth, smooth);
                else
                    after();
            }

            var doc = content ? content.document : document;
            var dBody = doc.body;

            if (!dBody || modules.util.isFrameSetWindow(content)) {
                window.alert(aMsg);
                return;
            }

            var ksMessageId = "_ks_message";
            var ksMessageStyle = aOptions.style ||
                "z-index: 500; font-size: 30px; font-family: 'Bitstream Vera Sans Mono';"
                + " padding: 10px; margin: 3px;"
                + " color: #ff5e61; background-color: #111111;"
                + " position: fixed; -moz-border-radius: 5px;"
                + " top: 0.5em; right: 0.5em;"
                + "-moz-opacity: 0; opacity: 0;";

            var lines = aMsg.split('\n');
            var container = doc.getElementById(ksMessageId);

            if (!container)
            {
                container = doc.createElement("div");
                container.id = ksMessageId;

                container.addEventListener('click', hideMessage, true);

                dBody.appendChild(container);
            }
            else
            {
                // clear
                while (container.hasChildNodes()) {
                    container.removeChild(container.firstChild);
                }
            }

            container.style.cssText = ksMessageStyle;

            container.appendChild(doc.createTextNode(lines[0]));
            for (var i = 1; i < lines.length; ++i) {
                container.appendChild(doc.createElement("br"));
                container.appendChild(doc.createTextNode(lines[i]));
            }

            displayMessage();
        },

        notify: function (aMsg, aButtons) {
            const NOTIFY_ID = "ksNotifyMessage";

            if (typeof gBrowser == 'undefined') {
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

    return self;
}();