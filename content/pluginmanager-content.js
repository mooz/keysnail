const pluginManagerContent = {
    toggleOptions: function (ev) {
        let elems = document.querySelectorAll("tr[data-no-description]");

        Array.forEach(elems, function (elem) {
            if (elem.getAttribute("data-no-description") === "hide")
                elem.setAttribute("data-no-description", "show");
            else
                elem.setAttribute("data-no-description", "hide");
        });
    }
};
