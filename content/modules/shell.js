KeySnail.Shell = function () {
    const Cc = Components.classes;
    const Ci = Components.interfaces;

    let modules;

    let completer, ext, prompt, util, display;

    let localCommands;

    let commands = {};

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

    function addUserCommand(name, description, callback, extra, replace) {
        if (!name)
            return;

        if (!(name instanceof Array))
            name = [name];

        let names = name.reduce(function (accum, str) accum.concat(extractCommandName(str)), []);

        let command = {
            description : description,
            callback    : callback
        };

        if (extra)
        {
            if (extra.completer)
                command.completer = extra.completer;
        }

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

                names = [abbrev, fullname];
            }
            else
            {
                // invalid                
                names = [];
            }
        }
        else
        {
            names= [name];
        }

        return names;
    }

    function executeCommand(commandName, text, args) {
        if (commandName in commands)
            commands[commandName].callback(text, args);
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
        colors: {
            description: "#484848"
        },

        init: function () {
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
                     function (e) [(e.iconURI || { spec: "" }).spec,
                                   e.alias,
                                   e.description,
                                   TYPE_ENGINE]
                 );

                 let memoizedHist = [];

                 // setTimeout(function (max) {
                 //                const history = Cc["@mozilla.org/browser/nav-history-service;1"]
                 //                    .getService(Ci.nsINavHistoryService);

                 //                let query   = history.getNewQuery();
                 //                let options = history.getNewQueryOptions();

                 //                options.sortingMode = options.SORT_BY_DATE_DESCENDING;
                 //                options.resultType  = options.RESULTS_AS_URI;
                 //                options.maxResults  = max || 1000;

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

                 addUserCommand(["t[abopen]", "tb"], "Open tab",
                                function (left, context) {
                                    let [args, state] = completer.utils.lex(left, [" "]);
                                    let uri = null;

                                    if (args.length > 1)
                                    {
                                        // search with engine or google words
                                        let engine = util.suggest.ss.getEngineByAlias(args[0]);

                                        if (engine)
                                            uri = engine.getSubmission(left.slice(left.indexOf(args[1])), null).uri.spec;
                                    }
                                    else
                                    {
                                        if (left.match("^[a-zA-Z]+://"))
                                            uri = left;
                                    }

                                    if (!uri)
                                    {
                                        let engine = util.suggest.ss.getEngineByName("Google");

                                        if (engine)
                                            uri = engine.getSubmission(left, null).uri.spec;
                                    }

                                    if (uri)
                                        openUILinkIn(uri, context.bang ? "tabshifted" : "tab");
                                },
                                {
                                    bang: true,
                                    completer: function (left, whole) {
                                        let [args, state] = completer.utils.lex(left, [" "]);

                                        let options = {
                                            flags   : [modules.ICON | modules.IGNORE, 0, 0, modules.HIDDEN],
                                            style   : ["", util.format("color:%s;", self.colors.description)],
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

                                        if (state !== completer.states.NEUTRAL)
                                        {
                                            // user inputting query

                                            let query  = args[args.length - 1];
                                            let engine = util.suggest.ss.getEngineByAlias(args[0]);

                                            if (args.length && engine)
                                            {
                                                if (engine.supportsResponseType(util.suggest.responseType))
                                                {
                                                    cc = options;

                                                    // with suggest
                                                    let suggestions = util.suggest.getSuggestions(engine, query)
                                                        .map(function (e) [engine.iconURI.spec, e, engine.description, TYPE_ENGINE]);

                                                    cc.collection = suggestions;

                                                    cc.origin = left.indexOf(query);                                                        
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
                                                cc = completer.matcher.substring(engines.concat(bookmarks).concat(memoizedHist),
                                                                                 options)(left, whole);
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
                                });                 
             })();


            addUserCommand("!", "Execute shell command",
                           function (text) {
                               executeLocalCommand(text.split(" "));
                           },
                           {
                               completer : function (left, whole) {
                                   if (!localCommands)
                                   {
                                       localCommands = getLocalCommands();
                                   }

                                   return completer.matcher.header(
                                       localCommands,
                                       {
                                           style : ["", util.format("color:%s;", self.colors.description)]
                                       }
                                   )(left, whole);
                               }
                           });

            addUserCommand("pwd", "Display present working directory",
                           function (text) {
                               display.echoStatusBar(KeySnail.modules.share.pwd);
                           }
                          );

            addUserCommand("cd", "Change present working directory",
                           function (text) {
                               text = completer.utils.normalizePath(chomp(text));
                               util.message(text);

                               let dir = util.openFile(text);
                               if (!dir)
                               {
                                   display.echoStatusBar("Failed to change current directory");
                                   return;
                               }

                               if (!dir.exists())
                               {
                                   display.echoStatusBar("No such directory " + text);
                                   return;
                               }

                               if (!dir.isDirectory())
                               {
                                   display.echoStatusBar(text + " is not a directory");
                                   return;
                               }

                               modules.share.pwd = dir.path;
                               display.echoStatusBar(dir.path);
                           },
                           {
                               completer: function (left, whole) {
                                   return completer.fetch.directory()(left, whole);
                               }
                           });

            addUserCommand("echo", "Evaluate javascript code and display its result",
                           function (code) {
                               let result = util.evalInContext(code);
                               if (typeof result !== 'undefined')
                               {
                                   display.echoStatusBar(result);
                                   util.message(result);
                               }
                           },
                           {
                               completer: function (left, whole) completer.fetch.javascript()(left, whole)
                           });

            addUserCommand("inspect", "Inspect object",
                           function (code) {
                               let result = util.evalInContext(code);
                               if (typeof result !== 'undefined' && 'inspectObject' in window)
                               {
                                   window.inspectObject(result);
                               }
                           },
                           {
                               completer: function (left, whole) completer.fetch.javascript()(left, whole)
                           });

            addUserCommand("js", "Evaluate javascript code",
                           function (code) {
                               util.evalInContext(code);
                           },
                           {
                               completer: function (left, whole) completer.fetch.javascript()(left, whole)
                           });

            addUserCommand("ext", "Execute KeySnail's Ext",
                           function (name) {
                               ext.exec(name);
                           },
                           {
                               completer: function (left, whole) completer.matcher.header(
                                   [[n, ext.description(n)] for (n in ext.exts)],
                                   {
                                       style : ["", util.format("color:%s;", self.colors.description)]
                                   }
                               )(left, whole)
                           });
        },

        input: function (init) {
            let currentCommand;
            let currentOrigin;

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
                    cmd    : cmd,
                    cmdEnd : cmdEnd,
                    bang   : bang
                };
            }

            prompt.reader(
                {
                    message      : "shell:",
                    initialInput : init || "",
                    cursorEnd    : init ? init.length : 0,
                    completer    : function (left, whole) {
                        let parsed = parseCommand(left);

                        let cmdName = parsed.cmd;

                        let cc = {
                            origin : 0
                        };
                        
                        if (!cmdName)
                        {
                            // return list of command name and description pair

                            cc.collection = [[name, cmd.description] for ([name, cmd] in Iterator(commands))
                                                                     if (name.indexOf(left) === 0)];
                            cc.style = ["", util.format("color:%s;", self.colors.description)];
                        }
                        else
                        {
                            // return result of command completer

                            if (cmdName in commands)
                            {
                                // return result of each command completer
                                let commandCompleter = commands[cmdName].completer;

                                let result = commandCompleter ? commandCompleter(
                                    left.slice(parsed.cmdEnd), whole.slice(parsed.cmdEnd)
                                ) : {};

                                if (result)
                                {
                                    if (typeof result.origin === "number")
                                        result.origin += parsed.cmdEnd;
                                    cc = result;
                                }
                                else
                                {
                                    cc.errorMsg = cmdName + " returned bad completer context";
                                }
                            }
                            else
                            {
                                cc.errorMsg = "No such command " + cmdName;
                            }
                        }

                        return cc;
                    },
                    callback : function (query) {
                        if (query)
                        {
                            let parsed = parseCommand(query, true);

                            if (parsed.cmd)
                            {
                                executeCommand(parsed.cmd, chomp(query.slice(parsed.cmdEnd)), {
                                                   bang: parsed.bang
                                               });
                            }
                        }
                    }
                }
            );
        }
    };

    return self;
}();
