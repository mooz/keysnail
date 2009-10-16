var ksExtViewer = function () {
    var modules;

    var extListBox;

    function initExtListBox() {
        var exts = modules.ext.exts;

        for (var name in exts) {
            var item = document.createElement("listitem");

            item.appendChild(createElementWithLabel("listcell", name));
            item.appendChild(createElementWithLabel("listcell", exts[name].description));

            extListBox.appendChild(item);
        }
    }

    function createElementWithLabel(aElemName, aLabel) {
        var elem = document.createElement(aElemName);
        elem.setAttribute("label", aLabel);

        return elem;
    }

    var self = {
        set modules(aModules) {
            modules = aModules;
        },

        onLoad: function () {
            extListBox = document.getElementById("ext-listbox");
            initExtListBox();
        },

        onFinish: function () {
            if (!extListBox.selectedItem || !extListBox.firstChild)
                return true;

            var exts = modules.ext.exts;

            var name = extListBox.selectedItem.firstChild.getAttribute("label");
            var description = exts[name].description;

            var func = "function (aEvent, aArg) { ext.exec('" + name + "', aArg); }";

            window.arguments[0].out = {
                desc : description,
                arg  : true,
                func : func,
                mode : 0
            };

            return true;
        }
    };

    return self;
}();

(function () {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
         .getService(Components.interfaces.nsIWindowMediator);
     var browserWindow = wm.getMostRecentWindow("navigator:browser");
     ksExtViewer.modules = browserWindow.KeySnail.modules;
 })();
