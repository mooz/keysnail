// Utils ============================================================ //

const NEW_TAB            = 0;
const NEW_BACKGROUND_TAB = 1;
const NEW_FOREGROUND_TAB = 2;
const NEW_WINDOW         = 3;
const CURRENT_TAB        = 4;

let XHTML = Namespace("html", "http://www.w3.org/1999/xhtml");
let XUL   = Namespace("xul", "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"); 
let NS    = Namespace("keysnail", "http://www.stillpedant-dummy.org/keysnail");

/**
 * Converts an E4X XML literal to a DOM node.
 *
 * @param {Node} node
 * @param {Document} doc
 * @param {Object} nodes If present, nodes with the "key" attribute are
 *     stored here, keyed to the value thereof.
 * @returns {Node}
 */
function xmlToDom(node, doc, nodes)
{
    if (node.length() != 1) {
        let domnode = doc.createDocumentFragment();
        for each (let child in node)
        domnode.appendChild(arguments.callee(child, doc, nodes));
        return domnode;
    }

    switch (node.nodeKind()) {
    case "text":
        return doc.createTextNode(node);
    case "element":
        let domnode = doc.createElementNS(node.namespace(), node.localName());

        for each (let attr in node.@*) {
            domnode.setAttributeNS(attr.name() == "highlight" ? NS.uri : attr.namespace(), attr.name(), String(attr));                
        }

        for each (let child in node.*) {
            domnode.appendChild(arguments.callee(child, doc, nodes));                
        }

        if (nodes && node.@key)
            nodes[node.@key] = domnode;
        return domnode;
    }

    return null;
}

/**
 * Fakes a click on a link.
 *
 * @param {Node} elem The element to click.
 * @param {number} where Where to open the link. See
 *     {@link liberator.open}.
 */
function followLink(elem, where) {
    let doc = elem.ownerDocument;
    let view = doc.defaultView;
    let offsetX = 1;
    let offsetY = 1;

    if (elem instanceof HTMLFrameElement || elem instanceof HTMLIFrameElement)
    {
        elem.contentWindow.focus();
        return;
    }
    else if (elem instanceof HTMLAreaElement) // for imagemap
    {
        let coords = elem.getAttribute("coords").split(",");
        offsetX = Number(coords[0]) + 1;
        offsetY = Number(coords[1]) + 1;
    }
    else if (elem instanceof HTMLInputElement && elem.type == "file")
    {
        openUploadPrompt(elem);
        return;
    }

    let ctrlKey = false, shiftKey = false;
    switch (where)
    {
    case NEW_TAB:
    case NEW_BACKGROUND_TAB:
        ctrlKey = true;
        shiftKey = (where != NEW_BACKGROUND_TAB);
        break;
    case NEW_WINDOW:
        shiftKey = true;
        break;
    case CURRENT_TAB:
        break;
    default:
        display.echoStatusBar("Invalid where argument for followLink()");
    }

    elem.focus();

    options.withContext(
        function () {
            options.setPref("browser.tabs.loadInBackground", true);
            ["mousedown", "mouseup", "click"].forEach(
                function (event) {
                    elem.dispatchEvent(events.create(doc, event, {
                                                         screenX: offsetX, screenY: offsetY,
                                                         ctrlKey: ctrlKey, shiftKey: shiftKey, metaKey: ctrlKey
                                                     }));
                });
        });
}

/**
 * Evaluates an XPath expression in the current or provided
 * document. It provides the xhtml, xhtml2 and liberator XML
 * namespaces. The result may be used as an iterator.
 *
 * @param {string} expression The XPath expression to evaluate.
 * @param {Document} doc The document to evaluate the expression in.
 * @default The current document.
 * @param {Node} elem The context element.
 * @default <b>doc</b>
 * @param {boolean} asIterator Whether to return the results as an
 *     XPath iterator.
 */
function evaluateXPath(expression, doc, elem, asIterator) {
    if (!doc)
        doc = window.content.document;
    if (!elem)
        elem = doc;

    let result = doc.evaluate(expression, elem,
                              function lookupNamespaceURI(prefix)
                              {
                                  return {
                                      xhtml: "http://www.w3.org/1999/xhtml",
                                      xhtml2: "http://www.w3.org/2002/06/xhtml2",
                                      keysnail: NS.uri
                                  }[prefix] || null;
                              },
                              asIterator ? XPathResult.ORDERED_NODE_ITERATOR_TYPE : XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                              null
                             );

    result.__iterator__ = asIterator
        ? function () { let elem; while ((elem = this.iterateNext())) yield elem; }
    : function () { for (let i = 0; i < this.snapshotLength; i++) yield this.snapshotItem(i); };

    return result;
}

/**
 * An interruptible generator that returns all values between <b>start</b>
 * and <b>end</b>. The thread yields every <b>time</b> milliseconds.
 *
 * @param {number} start The interval's start value.
 * @param {number} end The interval's end value.
 * @param {number} time The time in milliseconds between thread yields.
 * @returns {Iterator(Object)}
 */
function interruptibleRange(start, end, time)
{
    let endTime = Date.now() + time;
    while (start < end)
    {
        if (Date.now() > endTime)
        {
            util.threadYield(true, true);
            endTime = Date.now() + time;
        }
        yield start++;
    }
}

/**
 * A generator that returns the values between <b>start</b> and <b>end</b>,
 * in <b>step</b> increments.
 *
 * @param {number} start The interval's start value.
 * @param {number} end The interval's end value.
 * @param {boolean} step The value to step the range by. May be
 *     negative. @default 1
 * @returns {Iterator(Object)}
 */
function range(start, end, step)
{
    if (!step)
        step = 1;
    if (step > 0)
    {
        for (; start < end; start += step)
            yield start;
    }
    else
    {
        while (start > end)
            yield start += step;
    }
}

function flattenArray(array) {
    return Array.concat.apply([], array);
}

/**
 * Returns an XPath union expression constructed from the specified node
 * tests. An expression is built with node tests for both the null and
 * XHTML namespaces. See {@link Buffer#evaluateXPath}.
 *
 * @param nodes {Array(string)}
 * @returns {string}
 */
function makeXPath(nodes) {
    return flattenArray(nodes.map(function (node) [node, "xhtml:" + node]))
        .map(function (node) "//" + node).join(" | ");
}

// }} ============================================================ //

var ksHah = new function () {
    // Options {{ ============================================================ //
    const DEFAULT_HINTTAGS =
        makeXPath(["input[not(@type='hidden')]", "a", "area", "iframe", "textarea", "button", "select"])
            + " | //*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @role='link']";

    var options = {};
    options.hintinputs = plugins.options["ks_hah.hintinputs"] || DEFAULT_HINTTAGS;

    function setOption(aName, aDefault, aValidator) {
        var val = plugins.options["ks_hah." + aName];

        options[aName] = (val && (!aValidator || aValidator(val))) ? val : aDefault;
    }

    function checkXPath(val)
    {
        try
        {
            evaluateXPath(val, document.implementation.createDocument("", "", null));
            return true;
        }
        catch (e)
        {
            return false;
        }
    }

    setOption("extendedhinttags", DEFAULT_HINTTAGS, checkXPath);
    setOption("hinttags", DEFAULT_HINTTAGS, checkXPath);
    setOption("hinttimeout", 0, function (val) val >= 0);
    setOption("followhints", 0, function (val) val >= 0);
    setOption("hintmatching", "contains");
    // options.add(["hintmatching", "hm"],
    //     "How links are matched",
    //     "string", "contains",
    //     {
    //         completer: function (context) [
    //             ["contains",       "The typed characters are split on whitespace. The resulting groups must all appear in the hint."],
    //             ["wordstartswith", "The typed characters are split on whitespace. The resulting groups must all match the beginings of words, in order."],
    //             ["firstletters",   "Behaves like wordstartswith, but all groups much match a sequence of words."],
    //             ["custom",         "Delegate to a custom function: liberator.plugins.customHintMatcher(hintString)"]
    //         ],
    //         validator: Option.validateCompleter
    //     });

    // }} ============================================================ //
   
    const ELEM = 0, TEXT = 1, SPAN = 2, IMGSPAN = 3;

    var hintMode;
    var submode    = ""; // used for extended mode, can be "o", "t", "y", etc.
    var hintString = ""; // the typed string part of the hint is in this string
    var hintNumber = 0;  // only the numerical part of the hint
    var usedTabKey = false; // when we used <Tab> to select an element
    var prevInput = "";    // record previous user input type, "text" || "number"
    var extendedhintCount;  // for the count argument of Mode#action (extended hint only)

    // hints[] = [elem, text, span, imgspan, elem.style.backgroundColor, elem.style.color]
    var pageHints = [];
    var validHints = []; // store the indices of the "hints" array with valid elements

    var activeTimeout = null;  // needed for hinttimeout > 0
    var canUpdate = false;

    // keep track of the documents which we generated the hints for
    // docs = { doc: document, start: start_index in hints[], end: end_index in hints[] }
    var docs = [];

    const Mode = function (aPrompt, aAction, aTags) {
        return {
            prompt : aPrompt,
            action : aAction,
            tags   : aTags
        };
    };

    // Mode.defaultValue("tags", function () function () options.hinttags);
    function extended() options.extendedhinttags;
    function images() makeXPath(["img"]);

    const hintModes = {
        ";": Mode("Focus hint",                         function (elem) buffer.focusElement(elem),                             extended),
        "?": Mode("Show information for hint",          function (elem) buffer.showElementInfo(elem),                          extended),
        s: Mode("Save hint",                            function (elem) buffer.saveLink(elem, true)),
        a: Mode("Save hint with prompt",                function (elem) buffer.saveLink(elem, false)),
        f: Mode("Focus frame",                          function (elem) elem.ownerDocument.defaultView.focus(), function () makeXPath(["body"])),
        o: Mode("Follow hint",                          function (elem) buffer.followLink(elem, liberator.CURRENT_TAB)),
        t: Mode("Follow hint in a new tab",             function (elem) buffer.followLink(elem, liberator.NEW_TAB)),
        b: Mode("Follow hint in a background tab",      function (elem) buffer.followLink(elem, liberator.NEW_BACKGROUND_TAB)),
        w: Mode("Follow hint in a new window",          function (elem) buffer.followLink(elem, liberator.NEW_WINDOW),         extended),
        F: Mode("Open multiple hints in tabs",          followAndReshow),
        O: Mode("Generate an ':open URL' using hint",   function (elem, loc) commandline.open(":", "open " + loc, modes.EX)),
        T: Mode("Generate a ':tabopen URL' using hint", function (elem, loc) commandline.open(":", "tabopen " + loc, modes.EX)),
        W: Mode("Generate a ':winopen URL' using hint", function (elem, loc) commandline.open(":", "winopen " + loc, modes.EX)),
        v: Mode("View hint source",                     function (elem, loc) buffer.viewSource(loc, false),                    extended),
        V: Mode("View hint source in external editor",  function (elem, loc) buffer.viewSource(loc, true),                     extended),
        y: Mode("Yank hint location",                   function (elem, loc) util.copyToClipboard(loc, true)),
        Y: Mode("Yank hint description",                function (elem) util.copyToClipboard(elem.textContent || "", true),    extended),
        c: Mode("Open context menu",                    function (elem) buffer.openContextMenu(elem), extended),
        i: Mode("Show image",                           function (elem) liberator.open(elem.src), images),
        I: Mode("Show image in a new tab",              function (elem) liberator.open(elem.src, liberator.NEW_TAB), images)
    };

    /**
     * Follows the specified hint and then reshows all hints. Used to open
     * multiple hints in succession.
     *
     * @param {Node} elem The selected hint.
     */
    function followAndReshow(elem)
    {
        buffer.followLink(elem, liberator.NEW_BACKGROUND_TAB);

        // TODO: Maybe we find a *simple* way to keep the hints displayed rather than
        // showing them again, or is this short flash actually needed as a "usability
        // feature"? --mst
        ksHah.show("F");
    }

    /**
     * Reset hints, so that they can be cleanly used again.
     */
    function reset()
    {
        // statusline.updateInputBuffer("");
        display.echoStatusBar("");
        hintString       = "";
        hintNumber       = 0;
        usedTabKey       = false;
        prevInput        = "";
        pageHints        = [];
        validHints       = [];
        canUpdate        = false;
        docs             = [];
        ksHah.escNumbers = false;

        if (activeTimeout)
            clearTimeout(activeTimeout);
        activeTimeout = null;
    }

    /**
     * Display the current status to the user.
     */
    function updateStatusline()
    {
        display.echoStatusBar((ksHah.escNumbers ? mappings.getMapLeader() : "") + (hintNumber || ""));
    }

    /**
     * Get a hint for "input", "textarea" and "select".
     *
     * Tries to use <label>s if possible but does not try to guess that a
     * neighbouring element might look like a label. Only called by generate().
     *
     * If it finds a hint it returns it, if the hint is not the caption of the
     * element it will return showtext=true.
     *
     * @param {Object} elem The element used to generate hint text.
     * @param {Document} doc The containing document.
     *
     * @returns [text, showtext]
     */
    function getInputHint(elem, doc)
    {
        // <input type="submit|button|reset">   Always use the value
        // <input type="radio|checkbox">        Use the value if it is not numeric or label or name
        // <input type="password">              Never use the value, use label or name
        // <input type="text|file"> <textarea>  Use value if set or label or name
        // <input type="image">                 Use the alt text if present (showtext) or label or name
        // <input type="hidden">                Never gets here
        // <select>                             Use the text of the selected item or label or name

        let type = elem.type;

        if (elem instanceof HTMLInputElement && /(submit|button|reset)/.test(type)) {
            return [elem.value, false];
        }
        else
        {
            for (let option of options["hintinputs"].split(","))
            {
                if (option == "value")
                {
                    if (elem instanceof HTMLSelectElement)
                    {
                        if (elem.selectedIndex >= 0)
                            return [elem.item(elem.selectedIndex).text.toLowerCase(), false];
                    }
                    else if (type == "image")
                    {
                        if (elem.alt)
                            return [elem.alt.toLowerCase(), true];
                    }
                    else if (elem.value && type != "password")
                    {
                        // radio's and checkboxes often use internal ids as values - maybe make this an option too...
                        if (! ((type == "radio" || type == "checkbox") && !isNaN(elem.value)))
                            return [elem.value.toLowerCase(), (type == "radio" || type == "checkbox")];
                    }
                }
                else if (option == "label")
                {
                    if (elem.id)
                    {
                        // TODO: (possibly) do some guess work for label-like objects
                        let label = evaluateXPath("//label[@for='" + elem.id + "']", doc).snapshotItem(0);
                        if (label)
                            return [label.textContent.toLowerCase(), true];
                    }
                }
                else if (option == "name")
                    return [elem.name.toLowerCase(), true];
            }
        }

        return ["", false];
    }

    /**
     * Gets the actual offset of an imagemap area.
     *
     * Only called by generate().
     *
     * @param {Object} elem  The <area> element.
     * @param {number} leftpos  The left offset of the image.
     * @param {number} toppos  The top offset of the image.
     * @returns [leftpos, toppos]  The updated offsets.
     */
    function getAreaOffset(elem, leftpos, toppos)
    {
        try
        {
            // Need to add the offset to the area element.
            // Always try to find the top-left point, as per liberator default.
            let shape = elem.getAttribute("shape").toLowerCase();
            let coordstr = elem.getAttribute("coords");
            // Technically it should be only commas, but hey
            coordstr = coordstr.replace(/\s+[;,]\s+/g, ",").replace(/\s+/g, ",");
            let coords = coordstr.split(",").map(Number);

            if ((shape == "rect" || shape == "rectangle") && coords.length == 4)
            {
                leftpos += coords[0];
                toppos += coords[1];
            }
            else if (shape == "circle" && coords.length == 3)
            {
                leftpos += coords[0] - coords[2] / Math.sqrt(2);
                toppos += coords[1] - coords[2] / Math.sqrt(2);
            }
            else if ((shape == "poly" || shape == "polygon") && coords.length % 2 == 0)
            {
                let leftbound = Infinity;
                let topbound = Infinity;

                // First find the top-left corner of the bounding rectangle (offset from image topleft can be noticably suboptimal)
                for (let i = 0; i < coords.length; i += 2)
                {
                    leftbound = Math.min(coords[i], leftbound);
                    topbound = Math.min(coords[i + 1], topbound);
                }

                let curtop = null;
                let curleft = null;
                let curdist = Infinity;

                // Then find the closest vertex. (we could generalise to nearest point on an edge, but I doubt there is a need)
                for (let i = 0; i < coords.length; i += 2)
                {
                    let leftoffset = coords[i] - leftbound;
                    let topoffset = coords[i + 1] - topbound;
                    let dist = Math.sqrt(leftoffset * leftoffset + topoffset * topoffset);
                    if (dist < curdist)
                    {
                        curdist = dist;
                        curleft = coords[i];
                        curtop = coords[i + 1];
                    }
                }

                // If we found a satisfactory offset, let's use it.
                if (curdist < Infinity)
                    return [leftpos + curleft, toppos + curtop];
            }
        }
        catch (e) {} // badly formed document, or shape == "default" in which case we don't move the hint
        return [leftpos, toppos];
    }

    function getBodyOffsets(doc)
    {
        let bodyRect = (doc.body || doc.documentElement).getBoundingClientRect();
        return [-bodyRect.left, -bodyRect.top];
    }

    /**
     * Generate the hints in a window.
     *
     * Pushes the hints into the pageHints object, but does not display them.
     *
     * @param {Window} win The window,defaults to window.content.
     */
    function generate(win)
    {
        if (!win)
            win = window.content;

        let doc = win.document;
        let height = win.innerHeight;
        let width  = win.innerWidth;
        let [scrollX, scrollY] = getBodyOffsets(doc);

        // CHECK:
        // let baseNodeAbsolute = xmlToDom(<span highlight="Hint"/>, doc);
        let baseNodeAbsolute = doc.createElement("span");
        baseNodeAbsolute.setAttribute("highlight", "Hint");
        // baseNodeAbsolute.__ksHighlight__ = "Hint";

        let elem, text, span, rect, showtext;
        let res = evaluateXPath(hintMode.tags(), doc, null, true);

        // let fragment = xmlToDom(<div highlight="hints"/>, doc);
        let fragment = doc.createElement("div");
        fragment.setAttribute("highlight", "hints");
        // fragment.__ksHighlight__ = "hints";
        let start = pageHints.length;

        for (let elem in res) {
            showtext = false;

            // TODO: for iframes, this calculation is wrong
            rect = elem.getBoundingClientRect();
            if (!rect || rect.top > height || rect.bottom < 0 || rect.left > width || rect.right < 0)
                continue;

            rect = elem.getClientRects()[0];
            if (!rect)
                continue;

            let computedStyle = doc.defaultView.getComputedStyle(elem, null);
            if (computedStyle.getPropertyValue("visibility") != "visible" || computedStyle.getPropertyValue("display") == "none")
                continue;

            if (elem instanceof HTMLInputElement || elem instanceof HTMLSelectElement || elem instanceof HTMLTextAreaElement)
                [text, showtext] = getInputHint(elem, doc);
            else
                text = elem.textContent.toLowerCase();

            span = baseNodeAbsolute.cloneNode(true);

            let leftpos = Math.max((rect.left + scrollX), scrollX);
            let toppos =  Math.max((rect.top + scrollY), scrollY);

            if (elem instanceof HTMLAreaElement)
                [leftpos, toppos] = getAreaOffset(elem, leftpos, toppos);

            span.style.left = leftpos + "px";
            span.style.top =  toppos + "px";
            fragment.appendChild(span);

            pageHints.push([elem, text, span, null, elem.style.backgroundColor, elem.style.color, showtext]);
        }

        if (doc.body) {
            doc.body.appendChild(fragment);
            docs.push({ doc: doc, start: start, end: pageHints.length - 1 });
        }

        // also generate hints for frames
        Array.forEach(win.frames, generate);

        return true;
    }

    /**
     * Update the activeHint.
     *
     * By default highlights it green instead of yellow.
     *
     * @param {number} newId The hint to make active.
     * @param {number} oldId The currently active hint.
     */
    function showActiveHint(newId, oldId)
    {
        let oldElem = validHints[oldId - 1];
        if (oldElem)
            setClass(oldElem, false);

        let newElem = validHints[newId - 1];
        if (newElem)
            setClass(newElem, true);
    }

    /**
     * Toggle the highlight of a hint.
     *
     * @param {Object} elem The element to toggle.
     * @param {boolean} active Whether it is the currently active hint or not.
     */
    function setClass(elem, active)
    {
        let prefix = (elem.getAttributeNS(NS.uri, "class") || "") + " ";
        if (active)
            elem.setAttributeNS(NS.uri, "highlight", prefix + "HintActive");
        else
            elem.setAttributeNS(NS.uri, "highlight", prefix + "HintElem");
    }

    /**
     * Display the hints in pageHints that are still valid.
     */
    function showHints()
    {

        let elem, text, rect, span, imgspan, _a, _b, showtext;
        let hintnum = 1;
        let validHint = hintMatcher(hintString.toLowerCase());
        let activeHint = hintNumber || 1;
        validHints = [];

        for (let { doc: doc, start: start, end: end } of docs)
        {
            let [scrollX, scrollY] = getBodyOffsets(doc);

        inner:
            for (let i in (interruptibleRange(start, end + 1, 500)))
            {
                let hint = pageHints[i];
                [elem, text, span, imgspan, _a, _b, showtext] = hint;

                let valid = validHint(text);
                span.style.display = (valid ? "" : "none");
                if (imgspan)
                    imgspan.style.display = (valid ? "" : "none");

                if (!valid)
                {
                    elem.removeAttributeNS(NS.uri, "highlight");
                    continue inner;
                }

                if (text == "" && elem.firstChild && elem.firstChild instanceof HTMLImageElement)
                {
                    if (!imgspan)
                    {
                        rect = elem.firstChild.getBoundingClientRect();
                        if (!rect)
                            continue;


                        // CHECK:
                        imgspan = xmlToDom(<span highlight="Hint"/>, doc);
                        // imgspan = doc.createElement("span");
                        // imgspan.__ksHighlight__ = "Hint";
                        // imgspan = doc.setAttribute("class", "HintImage");
                        imgspan.setAttributeNS(NS.uri, "class", "HintImage");
                        imgspan.style.left   = (rect.left + scrollX) + "px";
                        imgspan.style.top    = (rect.top + scrollY) + "px";
                        imgspan.style.width  = (rect.right - rect.left) + "px";
                        imgspan.style.height = (rect.bottom - rect.top) + "px";
                        hint[IMGSPAN] = imgspan;
                        span.parentNode.appendChild(imgspan);
                    }
                    setClass(imgspan, activeHint == hintnum);
                }

                span.setAttribute("number", showtext ? hintnum + ": " + text.substr(0, 50) : hintnum);
                if (imgspan)
                    imgspan.setAttribute("number", hintnum);
                else
                    setClass(elem, activeHint == hintnum);
                validHints.push(elem);
                hintnum++;
            }
        }

        if (getBrowser().markupDocumentViewer.authorStyleDisabled)
        {
            let css = [];
            // FIXME: Broken for imgspans.
            for (let { doc: doc } of docs)
            {
                for (let elem in evaluateXPath("//*[@keysnail:highlight and @number]", doc))
                {
                    let group = elem.getAttributeNS(NS.uri, "highlight");
                    css.push(highlight.selector(group) + "[number='" + elem.getAttribute("number") + "'] { " + elem.style.cssText + " }");
                }
            }
            styles.addSheet(true, "hint-positions", "*", css.join("\n"));
        }

        return true;
    }

    /**
     * Remove all hints from the document, and reset the completions.
     *
     * Lingers on the active hint briefly to confirm the selection to the user.
     *
     * @param {number} timeout The number of milliseconds before the active
     *     hint disappears.
     */
    function removeHints(timeout)
    {
        let firstElem = validHints[0] || null;

        for (let { doc: doc, start: start, end: end } of docs)
        {
            for (let elem in evaluateXPath("//*[@keysnail:highlight='hints']", doc))
                elem.parentNode.removeChild(elem);
            for (let i in range(start, end + 1))
            {
                let hint = pageHints[i];
                if (!timeout || hint[ELEM] != firstElem)
                    hint[ELEM].removeAttributeNS(NS.uri, "highlight");
            }

            // animate the disappearance of the first hint
            if (timeout && firstElem)
                setTimeout(function () { firstElem.removeAttributeNS(NS.uri, "highlight"); }, timeout);
        }
        // styles.removeSheet(true, "hint-positions");

        reset();
    }

    /**
     * Finish hinting.
     *
     * Called when there are one or zero hints in order to possibly activate it
     * and, if activated, to clean up the rest of the hinting system.
     *
     * @param {boolean} followFirst Whether to force the following of the first
     *     link (when 'followhints' is 1 or 2)
     *
     */
    function processHints(followFirst)
    {
        if (validHints.length == 0)
        {
            // beep
            return false;
        }

        if (options["followhints"] > 0)
        {
            if (!followFirst)
                return false; // no return hit; don't examine uniqueness

            // OK. return hit. But there's more than one hint, and
            // there's no tab-selected current link. Do not follow in mode 2
            if (options["followhints"] == 2 && validHints.length > 1 && !hintNumber)
                return false;
        }

        if (!followFirst)
        {
            let firstHref = validHints[0].getAttribute("href") || null;
            if (firstHref)
            {
                if (validHints.some(function (e) e.getAttribute("href") != firstHref))
                    return false;
            }
            else if (validHints.length > 1)
                return false;
        }

        // let timeout = followFirst || events.feedingKeys ? 0 : 500;
        let timeout     = followFirst ? 0 : 500;
        let activeIndex = (hintNumber ? hintNumber - 1 : 0);
        let elem        = validHints[activeIndex];
        removeHints(timeout);

        // if (timeout == 0)
        //     // force a possible mode change, based on whether an input field has focus
        //     events.onFocusChange();
        setTimeout(
            function () {
                //        if (modes.extended & modes.HINTS)
                // modes.reset();
                hintMode.action(elem, elem.href || "", extendedhintCount);
            }, timeout);
        return true;
    }

    function checkUnique()
    {
        if (hintNumber == 0)
            return;
        if (hintNumber > validHints.length) {
            // beep
            return;            
        }

        // if we write a numeric part like 3, but we have 45 hints, only follow
        // the hint after a timeout, as the user might have wanted to follow link 34
        if (hintNumber > 0 && hintNumber * 10 <= validHints.length)
        {
            let timeout = options["hinttimeout"];
            if (timeout > 0)
                activeTimeout = setTimeout(function () { processHints(true); }, timeout);
        }
        else // we have a unique hint
            processHints(true);
    }

    /**
     * Handle user input.
     *
     * Will update the filter on displayed hints and follow the final hint if
     * necessary.
     *
     * @param {Object} aArg Argument passed by prompt.reader.
     */
    function onInput(aArg)
    {
        prevInput = "text";

        // clear any timeout which might be active after pressing a number
        if (activeTimeout)
        {
            clearTimeout(activeTimeout);
            activeTimeout = null;
        }

        hintNumber = 0;
        hintString = aArg.textbox.value;
        updateStatusline();
        showHints();
        if (validHints.length == 1)
            processHints(false);
    }

    /**
     * Get the hintMatcher according to user preference.
     *
     * @param {string} hintString The currently typed hint.
     * @returns {hintMatcher}
     */
    function hintMatcher(hintString) //{{{
    {
        /**
         * Divide a string by a regular expression.
         *
         * @param {RegExp|string} pat The pattern to split on.
         * @param {string} str The string to split.
         * @returns {Array(string)} The lowercased splits of the splitting.
         */
        function tokenize(pat, str) str.split(pat).map(String.toLowerCase);

        /**
         * Get a hint matcher for hintmatching=contains
         *
         * The hintMatcher expects the user input to be space delimited and it
         * returns true if each set of characters typed can be found, in any
         * order, in the link.
         *
         * @param {string} hintString  The string typed by the user.
         * @returns {function(String):boolean} A function that takes the text
         *     of a hint and returns true if all the (space-delimited) sets of
         *     characters typed by the user can be found in it.
         */
        function containsMatcher(hintString) //{{{
        {
            let tokens = tokenize(/\s+/, hintString);
            return function (linkText) {
                linkText = linkText.toLowerCase();
                return tokens.every(function (token) linkText.indexOf(token) >= 0);
            };
        } //}}}

        /**
         * Get a hintMatcher for hintmatching=firstletters|wordstartswith
         *
         * The hintMatcher will look for any division of the user input that
         * would match the first letters of words. It will always only match
         * words in order.
         *
         * @param {string} hintString The string typed by the user.
         * @param {boolean} allowWordOverleaping Whether to allow non-contiguous
         *     words to match.
         * @returns {function(String):boolean} A function that will filter only
         *     hints that match as above.
         */
        function wordStartsWithMatcher(hintString, allowWordOverleaping) //{{{
        {
            let hintStrings    = tokenize(/\s+/, hintString);
            let wordSplitRegex = RegExp(options["wordseparators"]);

            /**
             * Match a set of characters to the start of words.
             *
             * What the **** does this do? --Kris
             * This function matches hintStrings like 'hekho' to links
             * like 'Hey Kris, how are you?' -> [HE]y [K]ris [HO]w are you
             * --Daniel
             *
             * @param {string} chars The characters to match.
             * @param {Array(string)} words The words to match them against.
             * @param {boolean} allowWordOverleaping Whether words may be
             *     skipped during matching.
             * @returns {boolean} Whether a match can be found.
             */
            function charsAtBeginningOfWords(chars, words, allowWordOverleaping)
            {
                function charMatches(charIdx, chars, wordIdx, words, inWordIdx, allowWordOverleaping)
                {
                    let matches = (chars[charIdx] == words[wordIdx][inWordIdx]);
                    if ((matches == false && allowWordOverleaping) || words[wordIdx].length == 0)
                    {
                        let nextWordIdx = wordIdx + 1;
                        if (nextWordIdx == words.length)
                            return false;

                        return charMatches(charIdx, chars, nextWordIdx, words, 0, allowWordOverleaping);
                    }

                    if (matches)
                    {
                        let nextCharIdx = charIdx + 1;
                        if (nextCharIdx == chars.length)
                            return true;

                        let nextWordIdx = wordIdx + 1;
                        let beyondLastWord = (nextWordIdx == words.length);
                        let charMatched = false;
                        if (beyondLastWord == false)
                            charMatched = charMatches(nextCharIdx, chars, nextWordIdx, words, 0, allowWordOverleaping);

                        if (charMatched)
                            return true;

                        if (charMatched == false || beyondLastWord == true)
                        {
                            let nextInWordIdx = inWordIdx + 1;
                            if (nextInWordIdx == words[wordIdx].length)
                                return false;

                            return charMatches(nextCharIdx, chars, wordIdx, words, nextInWordIdx, allowWordOverleaping);
                        }
                    }

                    return false;
                }

                return charMatches(0, chars, 0, words, 0, allowWordOverleaping);
            }

            /**
             * Check whether the array of strings all exist at the start of the
             * words.
             *
             * i.e. ['ro', 'e'] would match ['rollover', 'effect']
             *
             * The matches must be in order, and, if allowWordOverleaping is
             * false, contiguous.
             *
             * @param {Array(string)} strings The strings to search for.
             * @param {Array(string)} words The words to search in.
             * @param {boolean} allowWordOverleaping Whether matches may be
             *     non-contiguous.
             * @returns boolean Whether all the strings matched.
             */
            function stringsAtBeginningOfWords(strings, words, allowWordOverleaping)
            {
                let strIdx = 0;
                for (let word of words)
                {
                    if (word.length == 0)
                        continue;

                    let str = strings[strIdx];
                    if (str.length == 0 || word.indexOf(str) == 0)
                        strIdx++;
                    else if (!allowWordOverleaping)
                        return false;

                    if (strIdx == strings.length)
                        return true;
                }

                for (; strIdx < strings.length; strIdx++)
                {
                    if (strings[strIdx].length != 0)
                        return false;
                }
                return true;
            }

            return function (linkText) {
                if (hintStrings.length == 1 && hintStrings[0].length == 0)
                    return true;

                let words = tokenize(wordSplitRegex, linkText);
                if (hintStrings.length == 1)
                    return charsAtBeginningOfWords(hintStrings[0], words, allowWordOverleaping);
                else
                    return stringsAtBeginningOfWords(hintStrings, words, allowWordOverleaping);
            };
        } //}}}

        switch (options["hintmatching"]) {
        case "contains"      : return containsMatcher(hintString);
        case "wordstartswith": return wordStartsWithMatcher(hintString, /*allowWordOverleaping=*/ true);
        case "firstletters"  : return wordStartsWithMatcher(hintString, /*allowWordOverleaping=*/ false);
        case "custom"        : return liberator.plugins.customHintMatcher(hintString);
        default              : display.echoStatusBar("Invalid hintmatching type: " + hintMatching);
        }

        return null;
    } //}}}

    // options.add([, "eht"],
    //     "XPath string of hintable elements activated by ';'",
    //     "string", DEFAULT_HINTTAGS,
    //     { validator: checkXPath });

    // options.add(["hinttags", "ht"],
    //     "XPath string of hintable elements activated by 'f' and 'F'",
    //     "string", DEFAULT_HINTTAGS,
    //     { validator: checkXPath });

    // options.add(["hinttimeout", "hto"],
    //     "Timeout before automatically following a non-unique numerical hint",
    //     "number", 0,
    //     { validator: function (value) value >= 0 });

    // options.add(["followhints", "fh"],
    //     // FIXME: this description isn't very clear but I can't think of a
    //     // better one right now.
    //     "Change the behaviour of <Return> in hint mode",
    //     "number", 0,
    //     {
    //         completer: function () [
    //             ["0", "Follow the first hint as soon as typed text uniquely identifies it. Follow the selected hint on <Return>."],
    //             ["1", "Follow the selected hint on <Return>."],
    //             ["2", "Follow the selected hint on <Return> only it's been <Tab>-selected."]
    //         ],
    //         validator: Option.validateCompleter
    //     });

    // options.add(["hintmatching", "hm"],
    //     "How links are matched",
    //     "string", "contains",
    //     {
    //         completer: function (context) [
    //             ["contains",       "The typed characters are split on whitespace. The resulting groups must all appear in the hint."],
    //             ["wordstartswith", "The typed characters are split on whitespace. The resulting groups must all match the beginings of words, in order."],
    //             ["firstletters",   "Behaves like wordstartswith, but all groups much match a sequence of words."],
    //             ["custom",         "Delegate to a custom function: liberator.plugins.customHintMatcher(hintString)"]
    //         ],
    //         validator: Option.validateCompleter
    //     });

    // options.add(["wordseparators", "wsp"],
    //     "How words are split for hintmatching",
    //     "string", '[.,!?:;/"^$%&?()[\\]{}<>#*+|=~ _-]');

    // options.add(["hintinputs", "hin"],
    //     "How text input fields are hinted",
    //     "stringlist", "label,value",
    //     {
    //         completer: function (context) [
    //             ["value", "Match against the value contained by the input field"],
    //             ["label", "Match against the value of a label for the input field, if one can be found"],
    //             ["name",  "Match against the name of an input field, only if neither a name or value could be found."]
    //         ],
    //         validator: Option.validateCompleter
    //     });


    /////////////////////////////////////////////////////////////////////////////}}}
    ////////////////////// MAPPINGS ////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////{{{

    // mappings.add(myModes, ["f"],
    //     "Start QuickHint mode",
    //     function () { hints.show("o"); });

    // At the moment, "F" calls
    //    buffer.followLink(clicked_element, DO_WHAT_FIREFOX_DOES_WITH_CNTRL_CLICK)
    // It is not clear that it shouldn't be:
    //    buffer.followLink(clicked_element, !DO_WHAT_FIREFOX_DOES_WITH_CNTRL_CLICK)
    // In fact, it might be nice if there was a "dual" to F (like H and
    // gH, except that gF is already taken). --tpp
    //
    // Likewise, it might be nice to have a liberator.NEW_FOREGROUND_TAB
    // and then make liberator.NEW_TAB always do what a Cntrl+Click
    // does. --tpp

    // mappings.add(myModes, ["F"],
    //     "Start QuickHint mode, but open link in a new tab",
    //     function () { hints.show(options.getPref("browser.tabs.loadInBackground") ? "b" : "t"); });

    // mappings.add(myModes, [";"],
    //     "Start an extended hint mode",
    //     function (count)
    //     {
    //         extendedhintCount = count;
    //         commandline.input(";", null,
    //             {
    //                 promptHighlight: "Normal",
    //                 completer: function (context)
    //                 {
    //                     context.compare = function () 0;
    //                     context.completions = [for (k of hintModes) [k, hintModes[k].prompt]];
    //                 },
    //                 onChange: function () { modes.pop(); },
    //                 onCancel: function (arg) { arg && setTimeout(function () hints.show(arg), 0); }
    //             });
    //     }, { count: true });

    /////////////////////////////////////////////////////////////////////////////}}}
    ////////////////////// PUBLIC SECTION //////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////{{{

    var self = {

        /**
         * Creates a new hint mode.
         *
         * @param {string} mode The letter that identifies this mode.
         * @param {string} prompt The description to display to the user
         *     about this mode.
         * @param {function(Node)} action The function to be called with the
         *     element that matches.
         * @param {function():string} tags The function that returns an
         *     XPath expression to decide which elements can be hinted (the
         *     default returns options.hinttags).
         * @optional
         */
        addMode: function (mode, prompt, action, tags)
        {
            hintModes[mode] = Mode.apply(Mode, Array.slice(arguments, 1));
        },

        /**
         * Updates the display of hints.
         *
         * @param {string} minor Which hint mode to use.
         * @param {string} filter The filter to use.
         * @param {Object} win The window in which we are showing hints.
         */
        show: function (aMinor, aFilter, aWin) {
            hintMode = hintModes[aMinor];
            if (!hintMode)
                return;

            prompt.reader(
                {
                    message  : hintMode.prompt + ": ",
                    onChange : onInput
                }
            );

            // ここらで KeySnail をサスペンドしておく
            // modes.extended = modes.HINTS;

            key.suspended = true;

            submode    = aMinor;
            hintString = aFilter || "";
            hintNumber = 0;
            prevInput  = "";
            canUpdate  = false;

            generate(aWin);

            // get all keys from the input queue
            util.threadYield(true);

            display.prettyPrint("hogehoge");

            canUpdate = true;
            showHints();

            if (validHints.length == 0) {
                modes.reset();
            } else if (validHints.length == 1) {
                processHints(false);                
            } else {
                checkUnique();           
            }

            key.suspended = false;
        },

        /**
         * Cancel all hinting.
         */
        hide: function () {
            removeHints(0);
        },

        /**
         * Handle a hint mode event.
         *
         * @param {Event} event The event to handle.
         */
        onEvent: function (aEvent) {
            let key = key.keyEventToString(aEvent);
            let followFirst = false;

            // clear any timeout which might be active after pressing a number
            if (activeTimeout) {
                clearTimeout(activeTimeout);
                activeTimeout = null;
            }

            switch (key) {
            case "RET":
                followFirst = true;
                break;
            case "<tab>":
            case "S-<tab>":
                usedTabKey = true;
                if (hintNumber == 0)
                    hintNumber = 1;

                let oldId = hintNumber;
                if (key == "<tab>") {
                    if (++hintNumber > validHints.length)
                        hintNumber = 1;
                } else {
                    if (--hintNumber < 1)
                        hintNumber = validHints.length;
                }
                showActiveHint(hintNumber, oldId);
                updateStatusline();
                return;
            case "<backspace>":
                if (hintNumber > 0 && !usedTabKey) {
                    hintNumber = Math.floor(hintNumber / 10);
                    if (hintNumber == 0)
                        prevInput = "text";
                } else {
                    usedTabKey = false;
                    hintNumber = 0;
                }
                break;
            // case mappings.getMapLeader():
            //     hints.escNumbers = !hints.escNumbers;
            //     if (hints.escNumbers && usedTabKey) // hintNumber not used normally, but someone may wants to toggle
            //         hintNumber = 0;            // <tab>s ? reset. Prevent to show numbers not entered.

            //     updateStatusline();
            //     return;
            default:
                if (/^\d$/.test(key)) {
                    prevInput = "number";

                    let oldHintNumber = hintNumber;
                    if (hintNumber == 0 || usedTabKey) {
                        usedTabKey = false;
                        hintNumber = parseInt(key, 10);
                    } else {
                        hintNumber = (hintNumber * 10) + parseInt(key, 10);                        
                    }

                    updateStatusline();

                    if (!canUpdate)
                        return;

                    if (docs.length == 0) {
                        generate();
                        showHints();
                    }
                    showActiveHint(hintNumber, oldHintNumber || 1);

                    if (hintNumber == 0) {
                        // beep
                        return;                        
                    }

                    checkUnique();
                }
            }

            updateStatusline();

            if (canUpdate)
            {
                if (docs.length == 0 && hintString.length > 0)
                    generate();

                showHints();
                processHints(followFirst);
            }
        }
    };

    return self;
};

ext.add("hit-a-hint",
        function () {
            ksHah.show("f");
        }, "ヒントをたどって！");

/***** BEGIN LICENSE BLOCK ***** {{{
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

Copyright (c) 2006-2009 by Martin Stubenschrott <stubenschrott@vimperator.org>

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
}}} ***** END LICENSE BLOCK *****/


var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Hit a Hint Vimp Forked</name>
    <description>Cick links by hitting hints!</description>
    <description lang="ja">キーボードを使ってリンクをジャンプ</description>
    <version>1.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/hit-a-hint.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/hit-a-hint.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.0.0</minVersion>
    <include>main</include>
    <provides>
        <ext>hah-begin</ext>
    </provides>
    <options>
        <option>
            <name>twitter_client.use_popup_notification</name>
            <type>boolean</type>
            <description>Whether display pop up notification when statuses are updated or not</description>
            <description lang="ja">ステータス更新時にポップアップ通知を行うかどうか</description>
        </option>
        <option>
            <name>twitter_client.update_interval</name>
            <type>integer</type>
            <description>Interval between status updates in mili-seconds</description>
            <description lang="ja">ステータスを更新する間隔 (ミリ秒)</description>
        </option>
        <option>
            <name>twitter_client.main_column_width</name>
            <type>[integer]</type>
            <description>Each column width of [User name, Message, Info] in percentage</description>
            <description lang="ja">[ユーザ名, つぶやき, 情報] 各カラムの幅をパーセンテージ指定</description>
        </option>
        <option>
            <name>twitter_client.block_users</name>
            <type>[string]</type>
            <description>Specify user id who you don't want to see pop up notification</description>
            <description lang="ja">ステータス更新時にポップアップを表示させたくないユーザの id を配列で指定</description>
        </option>
        <option>
            <name>twitter_client.automatically_begin</name>
            <type>boolean</type>
            <description>Automatically begin fetching the statuses</description>
            <description lang="ja">プラグインロード時、自動的にステータスの取得を開始するかどうか (初回起動時間の短縮につながる)</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===
==== Launching ====
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== 起動 ====
]]></detail>
</KeySnailPlugin>; 
