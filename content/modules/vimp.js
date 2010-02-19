let places = function () {
    const defaultFavicon = "chrome://mozapps/skin/places/defaultFavicon.png";

    // PlacesUtils.placesRootId;
    // PlacesUtils.toolbarFolderId;
    // PlacesUtils.bookmarksMenuFolderId;
    // PlacesUtils.unfiledBookmarksFolderId;

    function getFaviconPath(aURL) {
        if (!aURL)
            return defaultFavicon;

        if (typeof aURL === "string")
            return aURL;

        return aURL.spec;
    }

    function getBookmarks(aItemId) {
        return util.filterBookmarks(
            aItemId,
            function (childNode, parentNode) [getFaviconPath(childNode.icon),
                                              childNode.uri,
                                              childNode.title]
        );
    }

    let self = {
        bookmarks: getBookmarks
    };

    return self;
}();

const TYPE_ENGINE  = 0;
const TYPE_HISTORY = 1;
const TYPE_BM      = 2;

let bookmarks = [PlacesUtils.toolbarFolderId,
                 PlacesUtils.bookmarksMenuFolderId,
                 PlacesUtils.unfiledBookmarksFolderId]
    .reduce(function (accum, id) accum.concat(places.bookmarks(id)), [])
    .map(function (r) r.concat(TYPE_BM));

let engines = util.suggest.ensureAliases(util.suggest.getEngines()).map(
    function (e) [(e.iconURI || { spec: "" }).spec, e.alias, e.description, TYPE_ENGINE]
);

let memoizedHist = [];

// setTimeout(function (max) {
//                const history = Cc["@mozilla.org/browser/nav-history-service;1"]
//                    .getService(Ci.nsINavHistoryService);

//                let query   = history.getNewQuery();
//                let options = history.getNewQueryOptions();

//                options.sortingMode = options.SORT_BY_DATE_DESCENDING;
//                options.resultType  = options.RESULTS_AS_URI;
//                options.maxResults  = max || 10000;

//                let result = history.executeQuery(query, options);

//                // The root property of a query result is an object representing the folder you specified above.
//                let root = result.root;

//                let collection = [];

//                root.containerOpen = true;

//                for (let i = 0; i < root.childCount; i++)
//                {
//                    let node = root.getChild(i);
//                    collection.push(
//                        [
//                            node.icon || "",
//                            node.uri,
//                            node.title,
//                            TYPE_HISTORY
//                        ]
//                    );
//                }

//                root.containerOpen = false;

//                memoizedHist = collection;
//            }, 0);

function uriOpener(args, extra, callback) {
    extra.left.split(",").forEach(
        function (left) {
            let query;

            let [args, state] = completer.utils.lex(left);

            let uri  = null;

            if (args.length > 1)
            {
                // search with engine or google words
                let engine = util.suggest.ss.getEngineByAlias(args[0]);

                if (engine)
                    uri = engine.getSubmission(left.slice(left.indexOf(args[1])), null).uri.spec;
            }
            else
            {
                // url
                if (/^[a-zA-Z]+:\/\//.test(left))
                    uri = left;
            }

            if (!uri)
            {
                let engine = util.suggest.ss.currentEngine;

                if (engine)
                    uri = engine.getSubmission(left, null).uri.spec;
            }

            callback(uri, extra.bang);
        });
}

function uriCompleter(args, extra) {
    let options = {
        flags   : [modules.ICON | modules.IGNORE, 0, 0, modules.HIDDEN],
        style   : ["", style.prompt.description],
        stylist : function (args, n, current) {
            if (n !== 2)
                return null;

            let style = "";

            switch (args[3])
            {
            case TYPE_ENGINE:
                style += "color:#0f3a48;";
                break;
            case TYPE_BM:
                style += "color:#470f39;";
                break;
            case TYPE_HISTORY:
                style += "color:#39470f;";
                break;
            }

            return style;
        }
    };

    let cc;
    let lefts = extra.left.split(",");
    let left  = lefts[lefts.length - 1];
    let query;

    let [args, state] = completer.utils.lex(left);

    if (state !== completer.states.NEUTRAL)
        query = args.pop();

    if (query)
    {
        // user inputting query

        let engine = util.suggest.ss.getEngineByAlias(args[0]);

        if (args.length > 0 && engine)
        {
            // display suggestions by engine
            if (engine.supportsResponseType(util.suggest.responseType))
            {
                cc = options;

                // with suggest
                let suggestions = util.suggest.getSuggestions(engine, query)
                    .map(function (e) [engine.iconURI.spec, e, engine.description, TYPE_ENGINE]);

                cc.collection = suggestions;

                cc.origin = left.lastIndexOf(query);
            }
            else
            {
                // specified engine does not support suggestions
                cc = options;
                cc.errorMsg = util.format("\"%s\" does not support suggestions", engine.name);
            }
        }
        else
        {
            options.multiple = true;
            cc = completer.matcher.migemo(
                engines.concat(bookmarks).concat(memoizedHist), options
            )(left, left);
        }

        cc.query = query;
    }
    else
    {
        if (!args.length)
        {
            // list all completions
            cc            = options;
            cc.origin     = left.length;
            cc.query      = "";

            let mostVisited = (
                function () {
                    const historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
                        .getService(Ci.nsINavHistoryService);
                    let query   = historyService.getNewQuery();
                    let options = historyService.getNewQueryOptions();
                    options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
                    options.maxResults = 15;

                    // execute the query
                    let result = historyService.executeQuery(query, options);

                    // iterate over the results
                    result.root.containerOpen = true;

                    let count      = result.root.childCount;
                    let collection = [];

                    for (let i = 0; i < count; i++)
                    {
                        let node = result.root.getChild(i);
                        collection.push(
                            [
                                node.icon || "",
                                node.uri,
                                node.title,
                                TYPE_HISTORY
                            ]
                        );
                    }

                    result.root.containerOpen = false;

                    return collection;
                })();

            cc.collection = engines.concat(mostVisited.concat(bookmarks));
        }
        else
        {
            cc = { errorMsg: "No completions found" };
        }
    }

    cc.origin += extra.left.lastIndexOf(left);

    return cc;
}

shell.add(["t[abopen]", "tb"], "Open page in new tab", function (args, extra) {
              uriOpener(args, extra, function (uri, bang) {
                            if (uri) openUILinkIn(uri, extra.bang ? "tabshifted" : "tab");
                        });
          },
          {
              bang      : true,
              completer : uriCompleter
          });

shell.add(["o[pen]"], "Open page in current tab", function (args, extra) {
              uriOpener(args, extra, function (uri, bang) {
                            if (uri) openUILinkIn(uri, "current");
                        });
          },
          {
              completer : uriCompleter
          });

let dialogs = [
    ["about",            "About Firefox",
     function () { window.openDialog("chrome://browser/content/aboutDialog.xul", "_blank", "chrome,dialog,modal,centerscreen"); }],
    ["addbookmark",      "Add bookmark for the current page",
                                       function () { PlacesCommandHook.bookmarkCurrentPage(true, PlacesUtils.bookmarksRootId); }],
    ["addons",           "Manage Add-ons",
     function () { window.BrowserOpenAddonsMgr(); }],
    ["bookmarks",        "List your bookmarks",
     function () { window.openDialog("chrome://browser/content/bookmarks/bookmarksPanel.xul", "Bookmarks", "dialog,centerscreen,width=600,height=600"); }],
    ["checkupdates",     "Check for updates",
                                function () { window.checkForUpdates(); }],
    ["cleardata",        "Clear private data",
     function () { Cc[GLUE_CID].getService(Ci.nsIBrowserGlue).sanitize(window || null); }],
    ["cookies",          "List your cookies",
     function () { window.toOpenWindowByType("Browser:Cookies", "chrome://browser/content/preferences/cookies.xul", "chrome,dialog=no,resizable"); }],
    ["console",          "JavaScript console",
     function () { window.toJavaScriptConsole(); }],
    ["customizetoolbar", "Customize the Toolbar",
     function () { window.BrowserCustomizeToolbar(); }],
    ["dominspector",     "DOM Inspector",
     function () { try { window.inspectDOMDocument(content.document); } catch (e) { display.echoStatusBar("DOM Inspector extension not installed"); } }],
    ["downloads",        "Manage Downloads",
     function () { window.toOpenWindowByType("Download:Manager", "chrome://mozapps/content/downloads/downloads.xul", "chrome,dialog=no,resizable"); }],
    ["history",          "List your history",
     function () { window.openDialog("chrome://browser/content/history/history-panel.xul", "History", "dialog,centerscreen,width=600,height=600"); }],
    ["import",           "Import Preferences, Bookmarks, History, etc. from other browsers",
     function () { window.BrowserImport(); }],
    ["openfile",         "Open the file selector dialog",
     function () { window.BrowserOpenFileWindow(); }],
    ["pageinfo",         "Show information about the current page",
     function () { window.BrowserPageInfo(); }],
    ["pagesource",       "View page source",
     function () { window.BrowserViewSourceOfDocument(content.document); }],
    ["places",           "Places Organizer: Manage your bookmarks and history",
     function () { PlacesCommandHook.showPlacesOrganizer(ORGANIZER_ROOT_BOOKMARKS); }],
    ["preferences",      "Show Firefox preferences dialog",
     function () { window.openPreferences(); }],
    ["printpreview",     "Preview the page before printing",
     function () { PrintUtils.printPreview(onEnterPrintPreview, onExitPrintPreview); }],
    ["printsetup",       "Setup the page size and orientation before printing",
     function () { PrintUtils.showPageSetup(); }],
    ["print",            "Show print dialog",
     function () { PrintUtils.print(); }],
    ["saveframe",        "Save frame to disk",
     function () { window.saveFrameDocument(); }],
    ["savepage",         "Save page to disk",
     function () { window.saveDocument(window.content.document); }],
    ["searchengines",    "Manage installed search engines",
     function () { window.openDialog("chrome://browser/content/search/engineManager.xul", "_blank", "chrome,dialog,modal,centerscreen"); }],
    ["selectionsource",  "View selection source",
     function () { buffer.viewSelectionSource(); }]
];

shell.add("dia[log]", "Open a dialog",
          function (args, extra) {
              let arg = args[0];

              try
              {
                  for (let [, dialog] in Iterator(dialogs))
                  {
                      if (dialog[0].toLowerCase() === arg.toLowerCase())
                      {
                          dialog[2]();
                          return;
                      }
                  }

                  display.echoStatusBar("Invalid argument: " + arg);
              }
              catch (e)
              {
                  display.echoStatusBar("Error opening '" + arg + "': " + e);
              }
          },
          {
              argCount  : "1",
              completer : function (args, extra) {
                  let cc =  completer.matcher.header(
                      dialogs.map(function (r) [r[0], r[1]])
                  )(extra.query || "");

                  cc.style = [null, style.prompt.description];

                  return cc;
              }
          });
