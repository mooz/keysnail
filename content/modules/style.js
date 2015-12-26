/**
 * @fileOverview Manipulate styles
 * @name style.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

var style = function () {
    /**
     * @private
     */

    const Cc = Components.classes;
    const Ci = Components.interfaces;

    const XHTML = "@namespace url('http://www.w3.org/1999/xhtml');";
    const XUL   = "@namespace url('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul');";

    const ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

    function cssURI(aCss, aNs) {
        return ios.newURI((aCss.indexOf("file://") === 0) ?
                          window.encodeURIComponent(aCss) :
                          "data:text/css," + window.encodeURIComponent((aNs || XUL) + aCss), null, null);
    }

    /**
     * @param {string} aCss Style sheet or URL
     * @param {string} aNs  Name space of the css
     * @param {boolean} aAgent If this value is true, AGENT_SHEET will be used.
     * @returns
     */
    function getArg(args) {
        var [aCss, aNs, aAgent] = Array.slice(args);
        return [cssURI(aCss, aNs),
                aAgent ? sss.AGENT_SHEET : sss.USER_SHEET];
    }

    /**
     * @public
     */
    var self = {
        init: function () {
        },

        prompt: {
            default     : "color:black;",
            description : "color:#484848;",
            url         : "color:blue;text-decoration:underline;",
            //
            engine      : "color:#0f3a48;",
            bookmark    : "color:#470f39;",
            history     : "color:#39470f;"
        },

        js: {
            "function"  : "color:#003d72;",
            "object"    : "color:#b63404;",
            "string"    : "color:#165b00;",
            "xml"       : "color:#290070;",
            "number"    : "color:#8505ac;",
            "boolean"   : "color:#860000;",
            "undefined" : "color:#91046c;",
            "null"      : "color:#008e6d;"
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
        register: function (aCss, aNs, aAgent) {
            var arg = getArg(arguments);

            if (!sss.sheetRegistered.apply(sss, arg))
                sss.loadAndRegisterSheet.apply(sss, arg);
        },

        unregister: function (aCss, aNs, aAgent) {
            var arg = getArg(arguments);

            if (sss.sheetRegistered.apply(sss, arg))
                sss.unregisterSheet.apply(sss, arg);
        },

        toggle: function (aCss, aNs, aAgent) {
            var arg = getArg(arguments);

            if (sss.sheetRegistered.apply(sss, arg))
                sss.unregisterSheet.apply(sss, arg);
            else
                sss.loadAndRegisterSheet.apply(sss, arg);
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
