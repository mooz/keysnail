/**
 * @fileOverview
 * @name buffer.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

KeySnail.Buffer = {
    iframe: null,
    doc: null,

    init: function () {
        if (KeySnail.windowType == "navigator:browser") {
            this.iframe = document.getElementById("keysnail-minibuffer");
            var doc = iframe.contentDocument;
            this.doc = doc;

            doc.body.id = "keysnail-minibuffer-content";
            doc.body.appendChild(doc.createTextNode(""));
            doc.body.style.borderTop = "1px solid black";

            // this holds all history and 
            this.historyHolder = new Object;
            this.historyHolder["default"] = [];
        }
    }
};

