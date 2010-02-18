KeySnail.Shell = function () {
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    let modules;

    let completer, ext, prompt, util, display;

    let localCommands;

    let commands = {};

    let option = {
        ANY    : 0,
        NOARG  : 1,
        BOOL   : 2,
        STRING : 3,
        INT    : 4,
        FLOAT  : 5,
        LIST   : 6
    };

    const OPT_NAMES      = 0;
    const OPT_TYPE       = 1;
    const OPT_VALIDATOR  = 2;
    const OPT_CANDIDATES = 3;

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

    function add(name, description, callback, extra, replace) {
        if (!name)
            return;

        if (!(name instanceof Array))
            name = [name];

        let names = name.reduce(function (accum, str) accum.concat(extractCommandName(str)), []);

        let command = {
            description : description,
            callback    : callback,
            extra       : extra,
            names       : names
        };

        names.forEach(
            function (name) {
                if (!commands[name] || replace)
                    commands[name] = command;
            }
        );
    }

    function extractCommandName(name) {
        let names;

        // "hoge[hgoe]"
        if (name[name.length - 1] === "]")
        {
            let begin = name.lastIndexOf("[");

            if (begin > 0)
            {
                let abbrev   = name.slice(0, begin);
                let fullname = abbrev + name.slice(begin + 1, name.length - 1);

                names = [fullname, abbrev];
            }
            else
            {
                // invalid
                names = [];
            }
        }
        else
        {
            names = [name];
        }

        return names;
    }

    /**
     * Parse command from givend text.
     * If <b>complete</b> is true,
     * @param   {} left
     * @param   {} complete
     * @returns {}
     */
    function parseCommand(left, isComplete) {
        let cmdEnd = left.indexOf(" ");
        let cmd    = null;
        let bang   = false;

        if (cmdEnd < 0 && isComplete && left.length)
        {
            // e.g. left is "quit" and complete is true

            cmdEnd = left.length;
            cmd    = left;
        }

        if (cmdEnd > 0)
        {
            // certain command name is given

            cmd = cmd || left.slice(0, cmdEnd);

            if (cmd !== "!" && cmd[cmd.length - 1] === "!")
            {
                bang = true;
                cmd  = cmd.slice(0, cmd.length - 1);
            }
        }

        return {
            cmd        : cmd,
            cmdEnd     : cmdEnd,
            queryStart : cmdEnd + left.slice(cmdEnd).match(/[ ]*/)[0].length,
            bang       : bang
        };
    }

    function parseOptions(args, opts) {
        if (!args || !args.length)
            return null;

        let parsed = {
            args     : [],
            options  : {},
            errorMsg : null
        };

        for (let i = 0; i < args.length; ++i)
        {
            let arg = args[i];

            if (arg && arg[0] === "-")
            {
                let opt;
                if (opts.some(function (r) r[0].some(function (s) s === arg) ? (opt = r, true) : false))
                {
                    if (opt[OPT_TYPE] === option.NOARG)
                    {
                        parsed.option[opt[OPT_NAMES][0]] = true;
                        continue;
                    }

                    ++i;

                    if (i >= args.length)
                    {
                        // not enough option
                        parsed.errorMsg = "Missing value for option " + arg;
                        break;
                    }

                    let optName = opt[OPT_NAMES][0];
                    let optValue;

                    switch (opt[OPT_TYPE])
                    {
                    case option.LIST:
                        optValue = args[i].split(",");
                        break;
                    case option.ANY:    // 1
                    case option.STRING: // 1
                        optValue = args[i];
                        break;
                    case option.BOOL:   // 1
                        let (v = {true : true, false : false}[args[i].toLowerCase()])
                        {
                            if (typeof v === "undefined")
                                parsed.errorMsg = "Option [" + arg + "] expects boolean but invalid value is given";
                            else
                                optValue = v;
                        };
                        break;
                    case option.INT:    // 1
                        if (+args[i] === parseInt(args[i]))
                            optValue = +args[i];
                        else
                            parsed.errorMsg = "Option [" + arg + "] expects integer but invalid value is given";
                        break;
                    case option.FLOAT:  // 1
                        let (v = parseFloat(args[i]))
                        {
                            if (isNaN(v))
                                optValue = v;
                            else
                                parsed.errorMsg = "Option [" + arg + "] expects float but invalid value given";
                        };
                        break;
                    default:
                        parsed.errorMsg = "Invalid type is specified for option " + arg;
                    }

                    if (parsed.errorMsg)
                        break;

                    parsed.options[optName] = optValue;
                }
                else
                {
                    // invalid option
                    parsed.errorMsg = "Invalid option " + arg;
                    break;
                }
            }
            else
            {
                parsed.args.push(arg);
            }
        }

        return parsed;
    }

    function validateArgumentsCount(current, count) {
        let valid, errorMsg;

        if (!isNaN(+count))
        {
            valid    = current === +count;
            errorMsg = "Just " + count + " arguments is permitted";
        }
        else
        {
            switch (count)
            {
            case "+":
                valid = current > 0;
                errorMsg = "At least 1 argument is needed";
                break;
            case "*":
                valid = true;
                break;
            case "?":
                valid    = current === 0 || current === 1;
                errorMsg = "Only 0 or 1 argument is permitted";
                break;
            }
        }

        return [valid, errorMsg];
    }

    function executeCommand(str) {
        let parsed = parseCommand(str, true);

        if (parsed.cmd)
        {
            let left = str.slice(parsed.queryStart);
            let [args, state] = completer.utils.lex(left);

            if (parsed.cmd in commands)
            {
                let command = commands[parsed.cmd];

                let extra   = {
                    bang  : parsed.bang,
                    state : state,
                    left  : left,
                    whole : str
                };

                if (command.extra.options)
                {
                    let parseResult = parseOptions(args, command.extra.options);

                    if (parseResult.errorMsg)
                    {

                    }
                    else
                    {
                        args          = parseResult.args;
                        extra.options = parseResult.options;
                    }
                }

                // check for count
                if (typeof command.extra.count !== "undefined")
                {
                    let [valid, msg] = validateArgumentsCount(args.length, command.extra.count);

                    if (!valid)
                    {
                        display.echoStatusBar(msg);
                        return;
                    }
                }

                command.callback(args, extra);
            }
        }
    }

    function executeLocalCommand(args) {
        let commandName = args.shift();
        let commandFile;

        localCommands.some(function ([name, path]) {
                               if (commandName === name)
                               {
                                   commandFile = util.openFile(path);
                                   return true;
                               }
                               return false;
                           });

        if (!commandFile)
        {
            // error
            return;
        }

        let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        process.init(commandFile);

        process.run(false, args, args.length);
    }

    function chomp(text) text.replace(/^[ \t\n]*/, "").replace(/[ \t\n]*$/, "");

    /**
     * Implant a to b
     * @param {} a
     * @param {} b
     */
    function implant(a, b) {
        for (let [k, v] in Iterator(a))
            b[k] = v;

        return b;
    }

    function getLocalCommands() {
        return util.getEnv("PATH").split(":")
            .reduce(
                function (accum, path) accum.concat(
                    util.readDirectory(path)
                        .filter(function (file) file.isExecutable)
                        .map(function (file) [file.leafName, file.path])
                ), []
            ).sort(
                function (a, b) {
                    if (a[0] === b[0])
                        return 0;
                    if (a[0] > b[0])
                        return 1;
                    return -1;
                }
            );
    }

    let self = {
        styles: {
            description: "color:#484848;"
        },

        option: option,

        add  : add,
        init : function () {
            if (KeySnail.windowType !== "navigator:browser")
                return;

            modules = self.modules;

            ext       = modules.ext;
            completer = modules.completer;
            prompt    = modules.prompt;
            util      = modules.util;
            display   = modules.display;

            (function () {
                 const TYPE_ENGINE      = 0;
                 const TYPE_HISTORY     = 1;
                 const TYPE_BM          = 2;

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
                     let uri  = null;
                     let left = completer.utils.unescape(extra.left);

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
                 }

                 function uriCompleter(args, extra) {
                     let options = {
                         flags   : [modules.ICON | modules.IGNORE, 0, 0, modules.HIDDEN],
                         style   : ["", self.styles.description],
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
                     let left  = extra.left;
                     let whole = extra.whole;
                     let query = extra.query;

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
                             )(left, whole);
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
                             cc = {
                                 errorMsg: "No completions found"
                             };
                         }
                     }

                     return cc;
                 }

                 add(["t[abopen]", "tb"], "Open page in new tab", function (args, extra) {
                         uriOpener(args, extra, function (uri, bang) {
                                       if (uri) openUILinkIn(uri, extra.bang ? "tabshifted" : "tab");
                                   });
                     },
                     {
                         bang      : true,
                         completer : uriCompleter
                     });

                 add(["o[pen]"], "Open page in current tab", function (args, extra) {
                         uriOpener(args, extra, function (uri, bang) {
                                       if (uri) openUILinkIn(uri, "current");
                                   });
                     },
                     {
                         completer : uriCompleter
                     });
             })();

            add("!", "Execute shell command",
                function (args) {
                    executeLocalCommand(args);
                },
                {
                    completer : function (args, extra) {
                        if (!localCommands)
                            localCommands = getLocalCommands();

                        return completer.matcher.header(
                            localCommands,
                            {
                                style : ["", self.styles.description]
                            }
                        )(extra.left, extra.whole);
                    }
                });

            add("pwd", "Display present working directory",
                function (args) {
                    display.echoStatusBar(modules.share.pwd);
                },
                { count : 0 }
               );

            add("cd", "Change present working directory",
                function (args, extra) {
                    let dest;
                    let left = args[0];

                    if (left === "-")
                    {
                        if (!modules.share.oldpwd)
                            modules.share.oldpwd = modules.share.pwd;
                        dest = modules.share.oldpwd;
                    }
                    else
                        dest = completer.utils.normalizePath(left);

                    let dir = util.openFile(dest);
                    if (!dir)
                    {
                        display.echoStatusBar("Failed to change current directory");
                        return;
                    }

                    if (!dir.exists())
                    {
                        display.echoStatusBar("No such directory " + dest);
                        return;
                    }

                    if (!dir.isDirectory())
                    {
                        display.echoStatusBar(dest + " is not a directory");
                        return;
                    }

                    modules.share.oldpwd = modules.share.pwd;
                    modules.share.pwd    = dir.path;

                    display.echoStatusBar(dir.path);
                },
                {
                    count     : "?",
                    completer : function (args, extra) completer.fetch.directory()(extra.query || "", extra.query || "")
                });

            add("echo", "Evaluate javascript code and display its result",
                function (args, extra) {
                    let code   = extra.left;
                    let result = util.evalInContext(code);
                    if (typeof result !== 'undefined')
                    {
                        display.echoStatusBar(result);
                        util.message(result);
                    }
                },
                {
                    completer: function (args, extra) completer.fetch.javascript()(extra.left, extra.whole)
                });

            add("inspect", "Inspect object",
                function (args, extra) {
                    let result = util.evalInContext(extra.left);
                    if (typeof result !== 'undefined' && 'inspectObject' in window)
                        window.inspectObject(result);
                },
                {
                    completer: function (args, extra) completer.fetch.javascript()(extra.left, extra.whole)
                });

            add("js", "Evaluate javascript code",
                function (args, extra) {
                    util.evalInContext(extra.left);
                },
                {
                    completer: function (args, extra) completer.fetch.javascript()(extra.left, extra.whole)
                });

            add("ext", "Execute KeySnail's Ext",
                function (args, extra) {
                    window.inspectObject(extra);
                    ext.exec(args[0]);
                },
                {
                    count     : "1",
                    options   : [
                        [["-arguments", "-a"], option.BOOL, null],
                        [["-list", "-l"], option.LIST, null, ["hoge", "huga", "hehe"]]
                    ],
                    completer : function (args, extra) completer.matcher.header(
                        [[n, ext.description(n)] for (n in ext.exts)],
                        {
                            style : ["", self.styles.description]
                        }
                    )(extra.left, extra.whole)
                });
        },

        input: function (init) {
            let currentCommand;
            let currentOrigin;

            prompt.reader(
                {
                    message          : "shell:",
                    initialInput     : init || "",
                    cursorEnd        : init ? init.length : 0,
                    escapeWhiteSpace : true,
                    completer        : function (left, whole) {
                        let parsed = parseCommand(left);

                        let cmdName = parsed.cmd;

                        let cc = {
                            origin : 0
                        };

                        if (!cmdName)
                        {
                            // return list of command name and description pair

                            cc.collection = [];
                            let done      = [];

                            for ([name, cmd] in Iterator(commands))
                            {
                                if (name.indexOf(left) === 0)
                                {
                                    if (cmd.names.every(function (s) done.indexOf(s) === -1 || s.length < name.length))
                                    {
                                        cc.collection.push([name, cmd.description]);
                                        done.push(name);
                                    }
                                }
                            }

                            cc.collection = cc.collection.sort(function ([a], [b]) (a < b) ? -1 : (a > b) ? 1 : 0);

                            cc.style = ["", self.styles.description];
                        }
                        else
                        {
                            // return result of command completer

                            if (cmdName in commands)
                            {
                                let cmd = commands[cmdName];

                                let qLeft  = left.slice(parsed.queryStart);
                                let qWhole = whole.slice(parsed.queryStart);

                                let [args, state] = completer.utils.lex(qLeft, {raw : true});

                                let extra = {
                                    bang  : cmd.bang,
                                    count : cmd.count,
                                    left  : qLeft,
                                    whole : qWhole,
                                    state : state
                                };

                                if (state !== completer.states.NEUTRAL)
                                    extra.query = args.pop();

                                cc.query = extra.query || "";

                                let callCompleter = true;

                                if (cmd.extra.options)
                                {
                                    // complete option
                                    let opts = cmd.extra.options;
                                    let opt;
                                    let query = extra.query, lastArg = args[args.length - 1];

                                    if (lastArg && lastArg[0] === "-")
                                    {
                                        if (opts.some(function (r) r[0].some(function (s) s === lastArg) ? (opt = r, true) : false))
                                        {
                                            // valid option specified

                                            let collection = opt[3];

                                            cc.origin = left.lastIndexOf(lastArg) + lastArg.length + 1;

                                            switch (opt[1])
                                            {
                                            case option.LIST:   // 1 ~
                                                collection = (collection instanceof Array) ? collection : [];

                                                let fragments = (query || "").split(",");
                                                let q         = fragments.pop();
                                                let h         = fragments.length ? fragments.join(",") + "," : "";

                                                cc.collection = collection.filter(function (s) s.indexOf(q) === 0)
                                                    .map(function (s) h + s);

                                                callCompleter = false;
                                                break;
                                            case option.ANY:    // 1
                                            case option.BOOL:   // 1
                                            case option.STRING: // 1
                                            case option.INT:    // 1
                                            case option.FLOAT:  // 1
                                                cc.collection = collection;
                                                callCompleter = false;
                                                break;
                                            case option.NOARG:  // 0
                                                callCompleter = true;
                                            default:
                                                break;
                                            }
                                        }
                                        else
                                        {
                                            // no such option
                                            cc.errorMsg   = "No such option [" + lastArg + "]";
                                            callCompleter = false;
                                        }
                                    }
                                    else if (query && query[0] === "-")
                                    {
                                        // list option names
                                        let names     = opts
                                            .filter(function (opt) opt[OPT_NAMES].every(function (name) (args || []).indexOf(name) === -1))
                                            .reduce(function (a, r) a.concat(r[OPT_NAMES]), [])
                                            .filter(function (r) r.indexOf(query) === 0);
                                        cc.collection = names || [];
                                        cc.origin     = left.lastIndexOf(query);

                                        callCompleter = false;
                                    }

                                    // ============================================================ //
                                    // Parse options
                                    // ============================================================ //

                                    let parseResult = parseOptions(args, opts);

                                    if (parseResult)
                                    {
                                        if (parseResult.errorMsg)
                                        {
                                            cc.errorMsg   = parseResult.errorMsg;
                                            callCompleter = false;
                                        }
                                        else
                                        {
                                            extra.options = parseResult.options;
                                            args          = parseResult.args;
                                        }
                                    }
                                } // option

                                if (callCompleter)
                                {
                                    // return result of each command completer
                                    let commandCompleter = cmd.extra.completer;

                                    // parse command
                                    if (typeof cmd.extra.count !== "undefined")
                                    {
                                        let count    = cmd.extra.count;
                                        let current  = args.length;
                                        let needMore = false;
                                        let errorMsg;

                                        if (!isNaN(+count))
                                        {
                                            let neededCount = +count;

                                            if (current < neededCount)
                                                needMore = true;
                                            else if (current >= neededCount)
                                            {
                                                errorMsg = "Just " + neededCount + " arguments is permitted";
                                            }
                                        }
                                        else
                                        {
                                            switch (count)
                                            {
                                            case "+":
                                            case "*":
                                                needMore = true;
                                                break;
                                            case "?":
                                                needMore = current === 0;
                                                errorMsg = "Only 0 or 1 argument is permitted";
                                                break;
                                            }
                                        }

                                        if (!needMore)
                                        {
                                            cc.errorMsg = errorMsg || "Invalid number of arguments";
                                            return cc;
                                        }
                                    }

                                    let escapedCount = 0;

                                    if (extra.query)
                                    {
                                        let escapedLength = extra.query.length;
                                        extra.query       = completer.utils.unescape(extra.query);
                                        escapedCount      = escapedLength - extra.query.length;
                                    }

                                    let unescapedArgs = args.map(completer.utils.unescape);

                                    escapedCount += unescapedArgs.reduce(function (a, s) a + s.length, 0)
                                        - args.reduce(function (a, s) a + s.length, 0);

                                    let result = commandCompleter ? commandCompleter(unescapedArgs, extra) : {};

                                    if (result)
                                    {
                                        if (typeof result.origin === "number")
                                            result.origin += parsed.queryStart + escapedCount;
                                        cc = result;
                                    }
                                    else
                                    {
                                        cc.errorMsg = cmdName + " returned bad completer context";
                                    }
                                } // callCompleter
                            }
                            else
                            {
                                cc.errorMsg = "No such command " + cmdName;
                            }
                        }

                        return cc;
                    },
                    callback : executeCommand
                }
            );
        }
    };

    return self;
}();
