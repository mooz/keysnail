// PLUGIN_INFO {{ =========================================================== //

let PLUGIN_INFO =
<KeySnailPlugin>
    <name>dabbrev</name>
    <description>Generate abbreviation.</description>
    <description lang="ja">動的略語展開</description>
    <version>0.0.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/dabbrev.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/dabbrev.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.4</minVersion>
    <detail><![CDATA[
=== Usage ===

>|javascript|
key.setEditKey('C-j', function (ev, arg) {
    ext.exec("dabbrev-expand", arg, ev);
}, 'Expand previous word "dynamically".');
||<

>|javascript|
plugins.options["dabbrev.next_key"]   = "C-j";
plugins.options["dabbrev.prev_key"]   = "C-k";
plugins.options["dabbrev.candidates"] = [
    "The quick brown fox jumps over the lazy dog",
    "foo_bar_baz"
];
||<
    ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// Change Log {{ ============================================================ //
//
// ==== 0.0.1 (2010 02/xx) ====
//
// * Released
//
// }} ======================================================================= //

const pOptions = plugins.setupOptions("dabbrev", {
    "candidates"         : {
        preset: [],
        description: "Preset snippets"
    },
    "next_key"           : {
        preset: "M-/",
        description: "Next key"
    },
    "prev_key"           : {
        preset: "M-S-/",
        description: "Previous key"
    },
    "use_migemo"         : {
        preset: true,
        description: "Use migemo while expanding abbreviations"
    },
    "cancel_key_on_exit" : {
        preset: false,
        description: "Do not pass exit key event to Firefox"
    }
}, PLUGIN_INFO);

let counter =
    (function () {
         let begin, end;

         let self = {
             start: function () {
                 begin = Date.now();
             },
             stop: function () {
                 end = Date.now();
             },

             wrap: function (proc) {
                 self.start();
                 proc();
                 self.stop();

                 return self.result;
             },

             get result() {
                 return end - begin;
             }
         };

         return self;
     })();

// ============================================================ //

let dabbrev =
    (function () {
         const nextKey = pOptions["next_key"];
         const prevKey = pOptions["prev_key"];

         let currentQuery;
         let currentIndex;
         let currentCandidates;
         let currentInput;
         let currentPopup;

         function fixScrollPos(input, original) {
             if (original.scrollTop === 0 && original.scrollLeft === 0)
             {
                 command.inputScrollSelectionIntoView(input);
             }
             else
             {
                 input.scrollTop  = original.scrollTop;
                 input.scrollLeft = original.scrollLeft;
             }
         }

         function createPopup(items) {
             let popup = document.createElement("menupopup");

             popup.setAttribute("ignorekeys", "true");

             for (let [i, text] of util.keyValues(items))
             {
                 let item = document.createElement("menuitem");
                 item.setAttribute("label", text);
                 item.setAttribute("value", text);

                 popup.appendChild(item);
             }

             return popup;
         }

         function showPopup(popup, elem) {
             document.documentElement.appendChild(popup);

             popup.openPopup(elem, "after_end", 0, 0, true);
         }

         function expand(backward) {
             if (currentIndex == -1)
                 currentIndex = backward ? currentCandidates.length - 1 : 0;
             else
                 currentIndex += backward ? -1 : 1;

             if (currentIndex < 0 || currentIndex >= currentCandidates.length)
             {
                 currentIndex = -1;
                 display.echoStatusBar("");

                 // currentPopup.hidden = true;

                 reset(currentInput, original);
             }
             else
             {
                 let text = currentCandidates[currentIndex];
                 insert(currentInput, text, original, true);

                 display.echoStatusBar(util.format("abbreviations (%s / %s)", currentIndex + 1, currentCandidates.length));

                 // if (currentPopup.hidden)
                 //     currentPopup.hidden = false;

                 // let box = currentPopup.boxObject.QueryInterface(Ci.nsIMenuBoxObject);
                 // inspectObject(box);

                 // currentPopup.selectedIndex = currentIndex;
             }
         }

         function reset(input, original) {
             // reset to the original text
             input.value = original.actualValue;
             input.selectionStart = input.selectionEnd = original.actualSelectionStart;

             fixScrollPos(input, original);
         }

         function insert(input, text, original, select) {
             // normal insersion
             input.value =
                 original.value.slice(0, original.selectionStart)
                 + text
                 + original.value.slice(original.selectionStart, original.value.length);

             if (select)
             {
                 input.selectionStart = original.selectionStart;
                 input.selectionEnd   = input.selectionStart + text.length;
             }
             else
             {
                 input.selectionStart = original.selectionStart + text.length;
                 input.selectionEnd   = input.selectionStart;
             }

             fixScrollPos(input, original);
         }

         function textRetriever(doc) {
             counter.start();

             let exp = "//*/text()";

             let xpathResult = doc.evaluate(exp, doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
             let result = [];

             let len = xpathResult.snapshotLength;
             for (let i = 0; i < len; ++i)
                 result.push(xpathResult.snapshotItem(i).nodeValue);

             counter.stop();

             util.message("textRetriever : " + counter.result);

             return result;
         }

         function uniq(array) {
             return array.reduce(
                 function (accum, current) {
                     if (accum.every(function (done) current !== done))
                         accum.push(current);
                     return accum;
                 }, []);
         }

         function reduceCandidates(candidates, query) {
             let matched = [];
             let remains = [];

             candidates = uniq(candidates);

             candidates.forEach(function (s) {
                                    if (s.indexOf(query) === 0)
                                        matched.push(s);
                                    else
                                        remains.push(s);
                                });

             query = query.toLowerCase();
             remains.filter(function (s) {
                                if (s.toLowerCase().indexOf(query) === 0)
                                    return matched.push(s), true;
                                else
                                    return true;
                            });

             if (pOptions["use_migemo"] && "xulMigemoCore" in window)
             {
                 let migexp = new RegExp("^(" + xulMigemoCore.getRegExp(query) + ")");
                 remains.forEach(function (s) { if (migexp.test(s)) matched.push(s); });
             }

             return matched;
         }

         function handleKeypress(ev) {
             let k = key.keyEventToString(ev);

             if (k !== nextKey && k !== prevKey)
             {
                 let input = ev.originalTarget;
                 input.selectionStart = input.selectionEnd = input.selectionEnd;

                 display.echoStatusBar("Dynamic Abbreviation Ends", 2000);

                 key.passAllKeys = false;

                 // document.documentElement.removeChild(currentPopup);

                 window.removeEventListener("keypress", arguments.callee, true);

                 if (pOptions["cancel_key_on_exit"])
                 {
                     ev.stopPropagation();
                     ev.preventDefault();
                 }
                 else
                 {
                     key.handleEvent(ev);
                 }

                 return;
             }

             if (k === nextKey)
                 expand();
             else
                 expand(true);

             ev.stopPropagation();
             ev.preventDefault();
         }

         let original = {};

         function start(input, abbrevsGetter, options) {
             key.passAllKeys = true;

             try
             {
                 command.resetMark({originalTarget : input});

                 let query    = getQuery(input);
                 let cands    = split(input.value, acode);

                 if (pOptions["candidates"] instanceof Array)
                     cands = cands.concat(pOptions["candidates"]);

                 let dabbrevs = reduceCandidates(cands, query);

                 if (typeof abbrevsGetter === "function")
                 {
                     let result = abbrevsGetter(query);
                     if (result instanceof Array)
                         dabbrevs = dabbrevs.concat(result);
                 }

                 dabbrevs = dabbrevs.filter(function (s) s !== query);

                 if (!dabbrevs.length)
                 {
                     display.echoStatusBar("No abbreviations found", 2000);
                     key.passAllKeys = false;

                     return;
                 }

                 original.actualSelectionStart = input.selectionStart;
                 original.actualValue          = input.value;

                 original.selectionStart = input.selectionStart - query.length;
                 original.value          = input.value.slice(0, original.selectionStart) + input.value.slice(original.actualSelectionStart);

                 original.scrollTop  = input.scrollTop;
                 original.scrollLeft = input.scrollLeft;

                 currentQuery      = query;
                 currentCandidates = dabbrevs;
                 currentIndex      = -1;
                 currentInput      = input;
                 // currentPopup      = createPopup(dabbrevs);

                 // showPopup(currentPopup, input);

                 expand();

                 window.addEventListener("keypress", handleKeypress, true);
             }
             catch (x)
             {
                 util.message(x);
                 key.passAllKeys = false;
             }
         }

         let code = {
             word       : /[a-zA-Z0-9_-]/,
             hiragana   : /[\u3041-\u3093]/,
             katakana   : /[\u30A1-\u30F6]/,
             ten        : /[\u3001]/,
             maru       : /[\u3002]/,
             space      : /[ \u3000\t\n]/,
             connective : /[\u30FC\u301C]/
         };

         let acode = [for (p of code) p];

         const WORD       = 0;
         const HIRAGANA   = 1;
         const KATAKANA   = 2;
         const TEN        = 3;
         const MARU       = 4;
         const SPACE      = 5;
         const CONNECTIVE = 6;

         function isWord(c) c !== SPACE && c !== TEN && c !== MARU;

         function split(string, codes) {
             let buffer      = [];
             let fragments   = [];
             let currentType, nextType;

             function getType(c) {
                 let i = 0;
                 for (i = 0; i < codes.length; ++i)
                     if (codes[i].test(c))
                         break;
                 return i;
             }

             currentType = getType(string[0]);
             if (isWord(currentType))
                 buffer.push(string[0]);

             for (let i = 1; i < string.length; ++i)
             {
                 nextType = getType(string[i]);

                 if (nextType !== CONNECTIVE && nextType !== currentType)
                 {
                     if (buffer.length)
                     {
                         fragments.push(buffer.join(""));
                         buffer.length = 0;
                     }
                     currentType = nextType;
                 }

                 if (isWord(currentType))
                     buffer.push(string[i]);
             }

             if (buffer.length)
                 fragments.push(buffer.join(""));

             return fragments;
         }

         function getQuery(input) {
             let head  = input.value.slice(0, input.selectionStart);
             let words = split(head, acode);

             if (words.length === 0)
                 return null;

             let cand  = words[words.length - 1];
             let query = head.slice(head.lastIndexOf(cand));

             return query;
         }

         let self = {
             start : start,
             wordsInDocument: function (doc) {
                 let splitted = uniq(textRetriever(doc).reduce(function (ac, s) ac.concat(split(s, acode)), []));

                 return splitted;
             }
         };

         return self;
     })();

plugins.dabbrev = dabbrev;

// }} ======================================================================= //

// Add exts {{ ============================================================== //

plugins.withProvides(function (provide) {
    provide("dabbrev-expand-with-suggestions", function (ev, arg) {
        dabbrev.start(ev.originalTarget, function (query) {
            let engine = util.suggest.filterEngines(util.suggest.getEngines())[0];

            if (engine)
                return util.suggest.getSuggestions(engine, query);
        });
    }, "Expand previous word \"dynamically\".");
}, PLUGIN_INFO);

plugins.withProvides(function (provide) {
    provide("dabbrev-expand", function (ev, arg) {
        dabbrev.start(ev.originalTarget);
    }, "Expand previous word \"dynamically\".");
}, PLUGIN_INFO);

// }} ======================================================================= //
