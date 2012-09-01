/**
 * @fileOverview Plugin information model
 * @name plugin-info.jsm
 * @author mooz <stillpedant@gmail.com>
 * @license The MIT License
 */

const EXPORTED_SYMBOLS = ["PluginInfo"];
const { classes: Cc, interfaces: Ci } = Components;

function PluginInfo(xmlString, locale) {
    var domParser = Cc["@mozilla.org/xmlextras/domparser;1"]
            .createInstance(Ci.nsIDOMParser);
    this.raw = xmlString;
    this.doc = domParser.parseFromString(xmlString, "application/xml");
    this.locale = locale;
}

PluginInfo.prototype = {
    defaultIconURL: "chrome://keysnail/skin/script.png",

    getLocalizedText: function (nodeList) {
        var candidateNodes = Array.slice(nodeList).filter(function (node) {
            return !node.hasAttribute("lang") || node.getAttribute("lang") === this.locale;
        }, this);

        if (!candidateNodes.length)
            return null;

        var nodesWithLang = candidateNodes.filter(function (node) node.hasAttribute("lang"));

        if (nodesWithLang.length)
            return nodesWithLang[0].textContent;
        else
            return candidateNodes[0].textContent;
    },

    selectNodes: function (query) {
        return Array.slice(this.doc.querySelectorAll(query));
    },

    get name() {
        if (!this._name)
            this._name = this.getLocalizedText(this.selectNodes("KeySnailPlugin > name"));
        return this._name;
    },

    set name(text) {
        this._name = text;
    },

    get licenseInfo() {
        return this.selectNodes("KeySnailPlugin > license").map(function (node) {
            return {
                name: node.textContent,
                documentationURL: node.getAttribute("document")
            };
        })[0] || null;
    },

    get authorInfo() {
        return this.selectNodes("KeySnailPlugin > author").map(function (node) {
            return {
                name: node.textContent,
                mailAddress: node.getAttribute("mail"),
                homepageURL: node.getAttribute("homepage")
            };
        })[0] || null;
    },

    get version() {
        return this.getLocalizedText(this.selectNodes("KeySnailPlugin > version"));
    },

    get minKeySnailVersion() {
        return this.getLocalizedText(this.selectNodes("KeySnailPlugin > minVersion"));
    },

    get maxKeySnailSVersion() {
        return this.getLocalizedText(this.selectNodes("KeySnailPlugin > maxVersion"));
    },

    get updateURL() {
        return this.getLocalizedText(this.selectNodes("KeySnailPlugin > updateURL"));
    },

    get iconURL() {
        return this.getLocalizedText(this.selectNodes("KeySnailPlugin > iconURL")) || this.defaultIconURL;
    },

    get description() {
        return this.getLocalizedText(this.selectNodes("KeySnailPlugin > description"));
    },

    get helpDocumentation() {
        return this.getLocalizedText(this.selectNodes("KeySnailPlugin > detail"));
    },

    get includeDocumentURIs() {
        return Array.slice(this.selectNodes("KeySnailPlugin > include")).map(function (node) {
            return node.textContent;
        });
    },

    get excludeDocumentURIs() {
        return Array.slice(this.selectNodes("KeySnailPlugin > exclude")).map(function (node) {
            return node.textContent;
        });
    },

    get requiredScripts() {
        return Array.slice(this.selectNodes("KeySnailPlugin > require > script")).map(function (node) {
            return node.textContent;
        });
    },

    get exts() {
        return Array.slice(this.selectNodes("KeySnailPlugin > provides > ext")).map(function (node) {
            return node.textContent;
        });
    },

    addExt: function (extName) {
        var providesNode = this.doc.querySelector("KeySnailPlugin > provides");
        if (!providesNode) {
            providesNode = this.doc.createElement("provides");
            this.doc.querySelector("KeySnailPlugin").appendChild(providesNode);
        }
        var extNode = this.doc.createElement("ext");
        extNode.textContent = extName;
        providesNode.appendChild(extNode);
    },

    get options() {
        return Array.slice(this.selectNodes("KeySnailPlugin > options > option")).map(function (node) {
            return {
                name: node.querySelector("name").textContent,
                type: node.querySelector("type").textContent,
                description: this.getLocalizedText(node.querySelectorAll("description"))
            };
        }, this);
    },

    addOption: function (option) {
        var optionsNode = this.doc.querySelector("KeySnailPlugin > options");
        if (!optionsNode) {
            optionsNode = this.doc.createElement("options");
            this.doc.querySelector("KeySnailPlugin").appendChild(optionsNode);
        }

        var optionItemNode = this.doc.createElement("option");

        var nameNode = this.doc.createElement("name");
        nameNode.textContent = option.name || "";
        optionItemNode.appendChild(nameNode);

        var typeNode = this.doc.createElement("type");
        typeNode.textContent = option.type || "";
        optionItemNode.appendChild(typeNode);

        var descriptionNode = this.doc.createElement("description");
        descriptionNode.textContent = option.description || "";
        optionItemNode.appendChild(descriptionNode);

        optionsNode.appendChild(optionItemNode);
    }
};
