/**
 * @fileOverview
 * @name style.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Style = function () {
    /**
     * @private
     */

    var modules;

    const Cc = Components.classes;
    const Ci = Components.interfaces;

    const XHTML = "@namespace url('http://www.w3.org/1999/xhtml');";
    const XUL   = "@namespace url('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul');";

    const ios = Components.classes["@mozilla.org/network/io-service;1"]
        .getService(Components.interfaces.nsIIOService);
    const sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
        .getService(Components.interfaces.nsIStyleSheetService);

    function cssURI(aCss, aNs) {
        return ios.newURI((aCss.indexOf("file://") === 0) ? 
                          window.encodeURI(aCss) :
                          "data:text/css," + window.encodeURI((aNs || XUL) + aCss), null, null);
    }

    /**
     * @param {string} aCss Style sheet or URL
     * @param {string} aNs  Name space of the css
     * @param {boolean} aAgent If this value is true, AGENT_SHEET will be used.
     * @returns
     */
    function getArg([aCss, aNs, aAgent]) {
        return [cssURI(aCss, aNs),
                aAgent ? sss.AGENT_SHEET : sss.USER_SHEET];
    }

    // ================ public ================ //

    var self = {
        init: function () {
            modules = this.modules;
        },

        get XHTML () { return XHTML; },
        get XUL   () { return XUL; },

        /**
         * Register user stylesheet
         *
         * ex1)
         * For xul document,
         * 
         * style.register("img { display:none; }");
         * 
         * ex2)
         * For current xhtml document,
         * 
         * style.register(style.local("img { display:none; }",
         *                            window.content.location.href),
         *                style.XHTML);
         */
        register: function () {
            var arg = getArg(arguments);

            if (!sss.sheetRegistered.apply(null, arg))
                sss.loadAndRegisterSheet.apply(null, arg);
        },

        unregister: function () {
            var arg = getArg(arguments);

            if (sss.sheetRegistered.apply(null, arg))
                sss.unregisterSheet.apply(null, arg);
        },

        toggle: function () {
            var arg = getArg(arguments);

            if (sss.sheetRegistered.apply(null, arg))
                sss.unregisterSheet.apply(null, arg);
            else
                sss.loadAndRegisterSheet.apply(null, arg);
        },

        local: function (aCss, aURIs) {
            let scheme;

            if (!(aURIs instanceof Array))
                aURIs = [aURIs];

            let selectors = aURIs.map(
                function (aURI) {
                    if (aURI.match("^[a-z]+://"))
                    {
                        let matched = aURI.match("\(.*\)\\*");
                        if (matched)
                            return "url-prefix('" + matched[1] + "')";
                        
                        return "url('" + aURI + "')";
                    }
                    else
                    {
                        return "domain('" + aURI + "')";
                    }
                });

            return "@-moz-document " + selectors.join(",") + " {\n" + aCss + "\n}\n";
        }
    };

    return self;
}();

