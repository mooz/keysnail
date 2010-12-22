/**
 * @fileOverview Manipulate HTML
 * @name html.js
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const html = {
    htmlTemplate: <><![CDATA[
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <title>##HTMLTITLE##</title>
                <style type="text/css">
                    ##CSS##
                </style>
            </head>
            <body>
                <div id="container">
                    ##CONTENTS##
                </div>
            </body>
        </html>
    ]]></>.toString(),

    styleSheet: null,

    replacePair : {
        "<" : "&lt;",
        ">" : "&gt;",
        "'" : "&apos;",
        "\"": "&quot;"
    },

    init: function () {
    },

    // original code from Sage
    // https://addons.mozilla.org/ja/firefox/addon/77
    // create the HTML file
    // @param aContent complete HTML source
    // @return created html's path
    createHTML: function (aContent) {
        // Make temporary file for listing the keybindings
        var tmpFile = util.getSpecialDir("UChrm");
        tmpFile.appendRelativePath("keybindings.html");

        var ioService = Cc["@mozilla.org/network/io-service;1"]
            .getService(Ci.nsIIOService);
        var xmlFilePath = ioService.newFileURI(tmpFile).spec;

        if (tmpFile.exists())
        {
            tmpFile.remove(true);
        }
        tmpFile.create(tmpFile.NORMAL_FILE_TYPE, 0666);

        var stream = Cc['@mozilla.org/network/file-output-stream;1']
            .createInstance(Ci.nsIFileOutputStream);
        stream.init(tmpFile, 2, 0200, false); // open as "write only"

        stream.write(aContent, aContent.length);
        stream.flush();
        stream.close();

        return xmlFilePath;
    },

    createHTMLSource: function (aTitle, aBody) {
        var source = this.htmlTemplate.replace("##HTMLTITLE##", aTitle);
        source = source.replace("##CONTENTS##", aBody);

        if (!this.styleSheet)
            this.styleSheet = util.readTextFileFromPackage("chrome://keysnail/content/resources/design.css");

        source = source.replace("##CSS##", this.styleSheet);

        return util.convertCharCodeFrom(source, "UTF-8");
    },

    escapeTag: function (aString) {
        if (!aString)
            return "";

        for (let [bad, good] in Iterator(this.replacePair))
            while (aString.indexOf(bad) !== -1)
                aString = aString.replace(bad, good);

        return aString;
    },

    unEscapeTag: function (aString) {
        if (!aString)
            return "";

        for (let [bad, good] in Iterator(this.replacePair))
            while (aString.indexOf(good) !== -1)
                aString = aString.replace(good, bad);

        return aString;
    },

    // original code from prototype.js
    escapeHTML: function(aStrTarget) {
        var div = document.createElement('div');
        var text =  document.createTextNode('');
        div.appendChild(text);
        text.data = aStrTarget;
        return div.innerHTML;
    }
};
