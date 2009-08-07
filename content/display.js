KeySnail.Display = {
    // ==== common ====
    modules: null,

    // ==== status bar ====
    statusBar: null,            // ステータスバーへの参照
    msgTimeOut: null,           // スタータスバーへのメッセージタイムアウトオブジェクト
    modeLine: null,

    init: function () {
        // this.modules = aModules;
        this.statusBar = document.getElementById('statusbar-display');
        // this.modeLine = document.getElementById('keysnail-minibuffer-modeline');
    },

    // ==================== Display ====================

    echoStatusBar: function (msg, time) {
        if (!this.statusBar) return;

        if (this.msgTimeOut) {
            // 既にタイムアウトが設定されている場合はキャンセル
            clearTimeout(this.msgTimeOut);
            this.msgTimeOut = null;
        }

        var self = this;

        // ここで this.statusbar とすると, タイムアウト処理時に setTimeout が
        // this となってしまうのでうまくいかない
        // 毎回 getElementById するのも嫌なので bind 修飾で
        self.statusBar.label = msg;
        if (time) {
            // 元に戻す (this が使えないのでクロージャを作っている)
            this.msgTimeOut = setTimeout(function () { self.echoStatusBar('', 0); }, time);
        }
    },

    hidePrettyPrint: function () {
        var ksMessageId = "_ks_message";
        var span = content.document.getElementById(ksMessageId);
        if (span)
            span.style.display = 'none';
    },

    prettyPrint: function (msg) {
        var dBody = content.document.body;
        if (!dBody) {
            dBody = document.body;
        }

        if (dBody) {
            var ksMessageId = "_ks_message";
            var ksMessageStyle = "z-index: 500; font-size: 14px; font-family: 'Helvetica';"
                + " padding: 3px; margin: 3px; color: white; background-color: #1e354a;"
                + " -moz-opacity: 0.9; opacity: 0.9; position: fixed;"
                + " bottom: 0.5em; left: 0.5em; display: inline;";

            // msg = msg.replace("\n", "<br />");

            var span = content.document.getElementById(ksMessageId)
                || document.getElementById(ksMessageId);

            if (span == null) {
                // this.message("<span> created");
                span = document.createElement("div");
                span.id = ksMessageId;
                span.style.cssText = ksMessageStyle;
                span.appendChild(document.createTextNode(msg));

                dBody.appendChild(span);

                span.onclick = function () {
                    this.style.display = 'none';
                };
            } else {
                var newText = document.createTextNode(msg);
                span.replaceChild(newText, span.childNodes[0]);
            }

            span.style.display = 'inline';
        } else {
            this.message("failed to find dBody");
        }
    },

    echoMiniBuffer: function (aLine) {
        this.modeLine.value = aLine;
    },

    message: function (msg) {
        Application.console.log(msg);
    }
};