/**
 * @fileOverview Functions which displays something to the screen
 * @name display.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var display = (function () {
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const NOTIFY_ID = "ks-notify-message";

    // ==== status bar ====
    function getStatusBar() {
        if (typeof gBrowser !== "undefined" && gBrowser.getStatusPanel) {
            return gBrowser.getStatusPanel();
        } else {
            return document.getElementById('statusbar-display');
        }
    }

    function getNotificationBox() {
        if (typeof gBrowser !== "undefined" && gBrowser.getNotificationBox) {
            return gBrowser.getNotificationBox();
        } else {
            return util.browserWindow.gBrowser.getNotificationBox();
        }
    }

    let echoArea;
    let msgTimeOut;           // timeout object to the status bar
    let hideMessageTimeout;

    let smooth = 15;

    function fade(aProcess, aFinally, aInterval, aCount) {
        util.sleep(aInterval);

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
        util.sleep(aTotalsec);

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

    // some functions are inspired by ui.js of liberator
    let echo = {
        document  : null,
        container : null,
        help      : "Press ESC to quit",

        get outputHeight() {
            return getBrowser().mPanelContainer.boxObject.height;
        },

        open: function () {
            if (echo.container.collapsed)
                echo.container.collapsed = false;

            getStatusBar().label = echo.help;
        },

        close: function () {
            if (!echo.container.collapsed)
                echo.container.collapsed = true;
        },

        updateHeight: function (percent) {
            let availableHeight = echo.outputHeight;

            if (!echo.container.collapsed)
                availableHeight += parseFloat(echo.container.height);

            echo.container.height = percent ?
                availableHeight * (Math.max(Math.min(percent, 100), 0) / 100) :
                Math.min(echo.document.height, availableHeight) + "px";

            echo.open();
        },

        createElement: function (name) {
            return echo.document.createElement(name);
        },

        createTextNode : function (text) {
            return echo.document.createTextNode(text);
        },

        createElementWithText: function (name, text) {
            let elem = echo.createElement(name);
            elem.appendChild(echo.createTextNode(text));
            return elem;
        },

        html: function (text, options) {
            options = options || {};

            echo.document = echoArea.contentDocument;

            echo.document.body.innerHTML = text;

            echo.updateHeight(typeof options.height === "number" ? options.height : 50);
            echoArea.focus();

            if (options.timeout)
                setTimeout(function () { echo.close(); }, options.timeout);

            echo.keyhandler = options.keyhandler;
        },

        handleEvent: function (ev) {
            if (ev.type === "keypress")
            {
                let k = key.keyEventToString(ev);

                if (k === "ESC")
                {
                    echo.close();
                }
                else if (typeof echo.keyhandler === "function")
                {
                    echo.keyhandler(k);
                }
            }
        }
    };

    let self = {
        init: function () {
            echoArea = document.getElementById('keysnail-echo-area');

            if (echoArea)
            {
                echo.container = echoArea.parentNode;

                echo.container.addEventListener("keypress", echo, true);
            }
        },

        echo: echo,

        echoStatusBar: function (msg, time) {
            let statusBar = getStatusBar();
            if (!statusBar) return;

            if (msgTimeOut)
            {
                // Cancell, when the timeout has been already set
                clearTimeout(msgTimeOut);
                msgTimeOut = null;
            }

            statusBar.label = msg;

            if (time)
                msgTimeOut = setTimeout(function () { self.echoStatusBar('', 0); }, time);
        },

        prettyPrint: function (aMsg, aOptions) {
            aOptions = aOptions || {};

            let origOpacity = aOptions.opacity || 0.8;
            let aTimeout    = aOptions.timeout;
            let aFadetime   = aOptions.fade;

            function hideMessage() {
                function process(aCount) {
                    let percent = aCount / smooth;
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
                    let percent = aCount / smooth;
                    container.style.opacity = origOpacity * (1.0 - percent);
                }

                function after() {
                    container.style.opacity = origOpacity;

                    if (aTimeout)
                    {
                        if (hideMessageTimeout)
                            clearTimeout(hideMessageTimeout);
                        hideMessageTimeout = setTimeout(() => hideMessage(), aTimeout);
                    }
                }

                if (aFadetime)
                    fade(process, after, aFadetime / smooth, smooth);
                else
                    after();
            }

            let doc = content ? content.document : document;
            let dBody = doc.body;

            if (!dBody || util.isFrameSetWindow(content))
            {
                window.alert(aMsg);
                return;
            }

            let ksMessageId = "_ks_message";
            let ksMessageStyle =
                (function (aStyles) {
                     let array = [];
                     let prop;
                     let userDefined = aOptions.style || {};

                     for (prop in aStyles) {
                         if (userDefined.hasOwnProperty(prop))
                             array.push(prop + ":" + userDefined[prop]);
                         else
                             array.push(prop + ":" + aStyles[prop]);
                     }

                     return array.join(";");
                 })(
                {
                    "z-index"            : "500",
                    "font-size"          : "30px",
                    "font-family"        : '"Trebuchet MS", Verdana, Arial, Helvetica, sans-serif',
                    "padding"            : "10px",
                    "margin"             : "3px",
                    "color"              : "#ff5e61",
                    "background-color"   : "#111111",
                    "position"           : "fixed",
                    "-moz-border-radius" : "5px",
                    "top"                : "0.5em",
                    "right"              : "0.5em",
                    "-moz-opacity"       : "0",
                    "opacity"            : "0"
                }
                );

            let lines = (aMsg || "").toString().split('\n');
            let container = doc.getElementById(ksMessageId);

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
            for (let i = 1; i < lines.length; ++i) {
                container.appendChild(doc.createElement("br"));
                container.appendChild(doc.createTextNode(lines[i]));
            }

            displayMessage();
        },

        notify: function (aMsg, aButtons, aIcon) {
            if (!aButtons)
            {
                aButtons = [
                    {
                        label: "OK",
                        callback: function (aNotification) {
                            try {
                                aNotification.close();
                            } catch (x) {}
                        },
                        accessKey: "o"
                    }
                ];
            }

            let notifyBox = getNotificationBox();
            let current = notifyBox.currentNotification;

            if (current && current.value == NOTIFY_ID)
                current.close();

            notifyBox.appendNotification(aMsg,
                                         NOTIFY_ID,
                                         aIcon || "chrome://keysnail/skin/notify-icon16.png",
                                         "PRIORITY_WARNING_HIGH",
                                         aButtons);
        },

        clearNotify: function (aId) {
            if (!aId)
                aId = NOTIFY_ID;

            let notifyBox = util.gBrowser.getNotificationBox();
            let current = notifyBox.currentNotification;

            while (current && current.value === aId)
            {
                current.close();
                current = notifyBox.currentNotification;
            }
        },

        showPopup: function (title, message, options) {
            try {
                var as = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
            } catch (x) {
                return false;
            }

            options = options || {};

            as.showAlertNotification(options.icon,
                                     title,
                                     message,
                                     !!options.clickable,
                                     options.cookie,
                                     options.observer);
            return true;
        }
    };

    return self;
})();
