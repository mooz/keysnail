// most functions in this file
// are retrieved from "sage"

KeySnail.HTML = {
    // ==== common ====
    modules: null,

    htmlTemplate: '<html>\n' +
        '<head>\n' +
        '<title>##HTMLTITLE##</title>\n' +
        // '<link rel="stylesheet" type="text/css"' +
        // ' charset="utf-8" media="all" href="##CSSPATH##"' +
        '<style type="text/css">\n' +
        '##CSS##' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<div id="container">\n' +
        '##CONTENTS##\n' +
        '</div>\n' +
        '</body>\n' +
        '</html>'
    ,

    styleSheet: null,

    replacePair : {
        "<" : "&lt;",
        ">" : "&gt;"
    },

    init: function () {
        // this.modules = aModules;
    },

    // original code from Sage
    // https://addons.mozilla.org/ja/firefox/addon/77
    // create the HTML file
    // @param aContent complete HTML source
    // @return created html's path
    createHTML: function (aContent) {
        const Cc = Components.classes;
        const Ci = Components.interfaces;

        // キーバインド表示用の一時ファイルを作成
        var tmpFile = this.modules.util.getSpecialDir("UChrm");
        tmpFile.appendRelativePath("keybindings.html");

        var ioService = Cc["@mozilla.org/network/io-service;1"]
            .getService(Ci.nsIIOService);
        var xmlFilePath = ioService.newFileURI(tmpFile).spec;

        if(tmpFile.exists()) {
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

        if (!this.styleSheet) {
            this.styleSheet = this.modules.util
                .getContents("chrome://keysnail/content/resources/design.css");
        }

        source = source.replace("##CSS##", this.styleSheet);

        // source = source.replace("##CSSPATH##", this.modules.util
        //                         .chromeToPath("chrome://keysnail/content/design.css"));
        return this.modules.util
            .convertCharCodeFrom(source, "UTF-8");
    },

    escapeTag: function (aString) {
        for (var badStr in this.replacePair) {
            // this.message(badStr);
            // this.message(this.replacePair[badStr]);
            // this.message(aString);
            if (aString.search(badStr) != -1) {
                aString = aString.replace(badStr, this.replacePair[badStr]);
            }
        }

        return aString;
    },

    // original code from prototype.js
    escapeHTML: function(aStrTarget) {
        var div = document.createElement('div');
        var text =  document.createTextNode('');
        div.appendChild(text);
        text.data = aStrTarget;
        return div.innerHTML;
    },

    message: KeySnail.message
};
