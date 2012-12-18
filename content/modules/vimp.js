let liberator =
    (function () {
         let self = {
             echoerr: function (msg) {
                 display.echoStatusBar(msg);
             }
         };

         return self;
     })();

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

function getMostVisitedPages(count) {
    const historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
        .getService(Ci.nsINavHistoryService);
    let query   = historyService.getNewQuery();
    let options = historyService.getNewQueryOptions();
    options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
    options.maxResults = count;

    // execute the query
    let result = historyService.executeQuery(query, options);

    // iterate over the results
    result.root.containerOpen = true;

    let childCount = result.root.childCount;
    let collection = [];

    for (let i = 0; i < childCount; i++)
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
}

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
    extra.left.split(", ").forEach(
        function (left) {
            let query;

            let [args, state] = completer.utils.lex(left);

            let uri  = null;

            if (args.length > 1)
            {
                // search with engine or google words
                let engine = util.suggest.ss.getEngineByAlias(args[0]);

                if (engine)
                    uri = engine.getSubmission(args.slice(1).join(" "), null).uri.spec;
            }
            else
            {
                // url
                if (/^[a-zA-Z]+:\/\//.test(args[0]))
                    uri = args[0];
            }

            if (!uri)
            {
                let engine = util.suggest.ss.currentEngine;

                if (engine)
                    uri = engine.getSubmission(args[0], null).uri.spec;
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

            let sty = "";

            switch (args[3])
            {
            case TYPE_ENGINE:
                sty += style.prompt.engine;
                break;
            case TYPE_BM:
                sty += style.prompt.bookmark;
                break;
            case TYPE_HISTORY:
                sty += style.prompt.history;
                break;
            }

            return sty;
        }
    };

    let cc;
    let lefts = extra.left.split(/, /);
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

                cc.origin = left.lastIndexOf(completer.utils.escape(query));
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
            )(left);
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

            let mostVisited = getMostVisitedPages(15);
            cc.collection   = engines.concat(mostVisited.concat(bookmarks));
        }
        else
        {
            cc = { errorMsg: "No completions found" };
        }
    }

    cc.origin += extra.left.lastIndexOf(left);
    cc.supressAdjustOrigin = true;

    return cc;
}

shell.add(["t[abopen]", "tb"], "Open page in new tab", function (args, extra) {
              uriOpener(args, extra, function (uri, bang) {
                            if (uri) openUILinkIn(uri, extra.bang ? "tabshifted" : "tab");
                        });
          },
          {
              bang      : true,
              completer : uriCompleter,
              literal   : 0
          });

shell.add(["o[pen]", "e[dit]"],
          "Open one or more URLs in the current tab",
          function (args, extra) {
              let (opened = false)
                  uriOpener(args, extra, function (uri, bang) {
                                openUILinkIn(uri || "about:blank", opened ? "tabshifted" : (opened = true, "current"));
                            });
          },
          {
              completer : uriCompleter,
              literal   : 0
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
    ["passwordmanager",  "Manage passwords",
     function () { window.openDialog("chrome://passwordmgr/content/passwordManager.xul", "_blank", "chrome,dialog,centerscreen"); }],
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

shell.add(["res[tart]"],
          "Force firefox to restart",
          function () { command.restartApp(); },
          { argCount: "0" });

shell.add(["reloada[ll]"],
          "Reload all tab pages",
          function (args) { getBrowser().reloadAllTabs(); },
          {
              argCount : "0",
              bang     : true
          });

var remotePluginListCache = null;
function getRemotePluginListCached(purgeCache) {
    if (purgeCache)
        remotePluginListCache = null;
    if (!remotePluginListCache) {
        display.echoStatusBar("Fetching remote plugin list...");
        remotePluginListCache = plugins.getRemotePluginList();
    }
    return remotePluginListCache;
}
function getRemotePluginInfoByPluginName(pluginName) {
    for (let [, remotePluginInfo] in Iterator(getRemotePluginListCached()))
        if (remotePluginInfo.leafName === pluginName)
            return remotePluginInfo;
    return null;
}

function pluginCompleter(args, extra) {
    let cc    = null;
    let left  = extra.left;
    let query = null;

    let [args, state] = completer.utils.lex(left);

    if (state !== completer.states.NEUTRAL)
        query = args.pop();

    var inputPluginName = args[0];

    if (args.length === 0) {
        /* List commands */
        let options = {
            flags   : [0, 0],
            style   : [style.prompt["default"], style.prompt["description"]]
        };
        let commands = {};
        commands["enable"]   = "Enable plugin";
        commands["disable"]  = "Disable plugin";
        commands["update"]   = "Update plugin";
        commands["document"] = "See plugin documentation (Open plugin in plugin manager)";
        commands["install"]  = "Install plugin from repository";
        commands["uninstall"]  = "Uninstall plugin from your computer";
        cc = completer.matcher.migemo([[name, description]
                                       for ([name, description] in Iterator(commands))],
                                      null)(left);
    } else if (args.length >= 1) {
        /* List plugin names */

        let selectedPluginNames = args.slice(1);

        let command = args[0];
        let options = null;

        function pluginShouldBeDisplayed(pluginPath) {
            switch (command) {
            case "enable":
                return userscript.isDisabledPlugin(pluginPath);
            case "disable":
                return !userscript.isDisabledPlugin(pluginPath);
            default:
                return true;
            }
        }

        let pluginList = null;
        if (command === "install") {
            /* list remote plugins */
            options = {
                flags    : [
                    modules.ICON | modules.IGNORE,    /* plugin icon */
                    0,                                /* plugin name */
                    0,                                /* plugin description */
                    0                                 /* plugin author */
                ],
                style    : [style.prompt["default"], style.prompt["description"], style.prompt["engine"]],
                header   : ["Name", "Description", "Author"],
                multiple : true
            };
            pluginList = [[
                pluginInfo.iconURL, pluginInfo.leafName, pluginInfo.description, pluginInfo.authorName
            ] for ([, pluginInfo] in Iterator(getRemotePluginListCached()))];
        } else {
            /* list installed plugins */
            let installedPluginTable = plugins.getInstalledPlugins();

            options = {
                flags    : [
                    modules.ICON | modules.IGNORE,    /* plugin icon */
                    0,                                /* plugin name */
                    0                                 /* plugin description */
                ],
                style    : [style.prompt["default"], style.prompt["description"]],
                header   : ["Name", "Description"],
                multiple : true
            };

            pluginList = [[
                pluginInfo.iconURL, pluginName, pluginInfo.description
            ] for ([pluginName, {pluginPath, pluginInfo}] in Iterator(installedPluginTable))
              if (pluginShouldBeDisplayed(pluginPath))];
        }

        /* Remove already selected plugins */
        pluginList = pluginList.filter(function ([_, pluginName]) {
            return selectedPluginNames.indexOf(pluginName) < 0;
        });

        cc = completer.matcher.migemo(pluginList, options)(query || "");
        cc.origin = left.lastIndexOf(completer.utils.escape(query || ""));
    } else {
        cc = { errorMsg: "No completions" };
    }
    cc.query = query;
    cc.origin += extra.left.lastIndexOf(left);

    return cc;
}

shell.add(["pl[ugin]"], "Manage plugins", function (args, extra) {
    let command     = args[0];
    let pluginNames = args.slice(1);

    if (command === "install") {
        let remotePluginURLs = pluginNames
                .map(function (name) {
                    return getRemotePluginInfoByPluginName(name);
                })
                .filter(function (info) info && info.remoteURL)
                .map(function (info) info.remoteURL);
        userscript.installPluginsFromURLs(remotePluginURLs);
        return;
    }

    let pluginTable = plugins.getInstalledPlugins();
    let localPluginInfos = pluginNames
            .map(function (name) pluginTable[name])
            .filter(function (info) info);

    localPluginInfos.forEach(function (info) {
        let pluginPath = info.pluginPath;
        let pluginFile = util.openFile(pluginPath);

        switch (command) {
        case "enable":
            if (userscript.enablePlugin(pluginFile))
                display.echoStatusBar("Enabled " + pluginPath + " (" + info.name + ")");
            break;
        case "disable":
            if (userscript.disablePlugin(pluginFile))
                display.echoStatusBar("Disabled " + pluginPath + " (" + info.name + ")");
            break;
        case "document":
            userscript.openPluginManager(pluginPath);
            break;
        case "update":
            userscript.updatePlugin(pluginPath);
            break;
        case "uninstall":
            userscript.uninstallPlugin(pluginFile);
            break;
        default:
            break;
        }
    });
}, {
    bang      : true,
    completer : pluginCompleter,
    literal   : 0
}, true);
