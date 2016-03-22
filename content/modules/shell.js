var shell =
    (function () {
         const Cc = Components.classes;
         const Ci = Components.interfaces;

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
                             {
                                 let v = {true : true, false : false}[args[i].toLowerCase()];
                                 if (typeof v === "undefined")
                                     parsed.errorMsg = "Option [" + arg + "] expects boolean but invalid value is given";
                                 else
                                     optValue = v;
                             }
                             break;
                         case option.INT:    // 1
                             if (+args[i] === parseInt(args[i]))
                                 optValue = +args[i];
                             else
                                 parsed.errorMsg = "Option [" + arg + "] expects integer but invalid value is given";
                             break;
                         case option.FLOAT:  // 1
                             {
                                 let v = parseFloat(args[i]);
                                 if (isNaN(v))
                                     optValue = v;
                                 else
                                     parsed.errorMsg = "Option [" + arg + "] expects float but invalid value given";
                             }
                             break;
                         default:
                             parsed.errorMsg = "Invalid type is specified for option " + arg;
                         }

                         if (typeof opt[OPT_VALIDATOR] === "function")
                         {
                             let validate = opt[OPT_VALIDATOR](args[i]);
                             if (!validate)
                                 parsed.errorMsg = util.format("Validator of option [%s] returned false", arg);
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

         function validateArgumentsCount(current, argCount) {
             let valid, errorMsg;

             if (!isNaN(+argCount))
             {
                 valid    = current === +argCount;
                 errorMsg = "Just " + argCount + " arguments is permitted";
             }
             else
             {
                 switch (argCount)
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

         function executeCommand(str, prefixArg) {
             let parsed = parseCommand(str, true);

             if (parsed.cmd)
             {
                 if (parsed.cmd in commands)
                 {
                     let command = commands[parsed.cmd];
                     let left    = str.slice(parsed.queryStart);

                     let extra = {
                         bang  : parsed.bang,
                         left  : left,
                         whole : str,
                         count : prefixArg
                     };

                     let commandExtra = command.extra || {};

                     let [args, state] = completer.utils.lex(left);

                     if (commandExtra.options)
                     {
                         let parseResult = parseOptions(args, commandExtra.options);

                         if (parseResult.errorMsg)
                         {

                         }
                         else
                         {
                             args          = parseResult.args;
                             extra.options = parseResult.options;
                         }
                     }

                     // check for argCount
                     if (typeof commandExtra.argCount !== "undefined")
                     {
                         let [valid, msg] = validateArgumentsCount(args.length, commandExtra.argCount);

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

             let localCommands = getLocalCommands();
             let localCommandIndex = localCommands.map(([name, path]) => name).indexOf(commandName);
             if (localCommandIndex < 0) return;
             let commandPath = localCommands[localCommandIndex][1];

             util.launchProcess(commandPath, args);
         }

         function chomp(text) text.replace(/^[ \t\n]*/, "").replace(/[ \t\n]*$/, "");

         /**
          * Implant a to b
          * @param {} a
          * @param {} b
          */
         function implant(a, b) {
             for (let [k, v] of util.keyValues(a))
                 b[k] = v;

             return b;
         }

         function getPathDirectories() {
             var pathString = util.getEnv("PATH");
             var splitter = share.WINDOWS ? ";" : ":";
             return pathString.split(splitter);
         }

         function gatherLocalCommands() {
             return getPathDirectories().reduce((accum, path) => {
                 try {
                     var paths = util.readDirectory(path)
                             .filter(function (file) file.isExecutable)
                             .map(function (file) [file.leafName, file.path]);
                     return accum.concat(paths);
                 } catch (x) {
                     return accum;
                 }
             }, []).sort(util.sortMultiple);
         }

         let cachedLocalCommands = null;
         function getLocalCommands() {
             if (!cachedLocalCommands) cachedLocalCommands = gatherLocalCommands();
             return cachedLocalCommands;
         }

         let self = {
             option: option,

             add  : add,
             init : function () {
                 if (!KeySnail.isMainWindow || !util.getBoolPref("extensions.keysnail.vimp.enabled", true))
                     return;

                 try
                 {
                     modules.vimp = { __proto__ : modules };
                     userscript.loadSubScript("chrome://keysnail/content/modules/vimp.js", modules.vimp);
                 }
                 catch (x)
                 {
                     util.message(x);
                 };

                 add(["!", "run"], "Execute shell command",
                     function (args) {
                         executeLocalCommand(args);
                     },
                     {
                         argCount  : "+",
                         completer : function (args, extra) {
                             return completer.matcher.header(
                                 getLocalCommands(),
                                 {style : ["", style.prompt.description]}
                             )(extra.left);
                         }
                     });

                 add("pw[d]", "Display present working directory",
                     function (args) { display.echoStatusBar(share.pwd); },
                     { argCount : "0" }
                    );

                 add(["cd", "chd[ir]"], "Change present working directory",
                     function (args, extra) {
                         let dir = util.changeDirectory(args[0]);
                         if (dir) display.echoStatusBar(dir.path);
                     },
                     {
                         argCount  : "?",
                         completer : function (args, extra) completer.fetch.directory()(extra.query || "", extra.query || "")
                         // completer : function (args, extra) implant(
                         //     {
                         //         rmessage: util.format("[%s]", share.pwd)
                         //     },
                         //     completer.fetch.directory()(extra.query || "", extra.query || "")
                         // ),
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
                         literal   : 0,
                         completer : function (args, extra) completer.fetch.javascript()(extra.left, extra.whole)
                     });

                 add("inspect", "Inspect object",
                     function (args, extra) {
                         if ('inspectObject' in window)
                             window.inspectObject(util.evalInContext(extra.left));
                     },
                     {
                         literal   : 0,
                         completer : function (args, extra) completer.fetch.javascript()(extra.left, extra.whole)
                     });

                 add("js", "Evaluate javascript code",
                     function (args, extra) {
                         util.evalInContext(extra.left);
                     },
                     {
                         literal   : 0,
                         completer : function (args, extra) completer.fetch.javascript()(extra.left, extra.whole)
                     });

                 add("ext", "Execute KeySnail's Ext",
                     function (args, extra) {
                         ext.exec(args[0], extra.options["-prefix-arguments"]);
                     },
                     {
                         argCount  : "1",
                         options   : [[["-prefix-arguments", "-pa"], option.INT, null]],
                         completer : function (args, extra) completer.matcher.header(
                             [for (n of Object.keys(ext.exts)) [n, ext.description(n)]].sort(util.sortMultiple),
                             { style : ["", style.prompt.description] }
                         )(extra.left, extra.whole)
                     });
             },

             input: function (init, prefixArg) {
                 let currentCommand;
                 let currentOrigin;

                 prompt.reader(
                     {
                         message          : "shell:",
                         initialInput     : init || "",
                         cursorEnd        : init ? init.length : 0,
                         escapeWhiteSpace : true,
                         completer        : function (left, whole) {
                             let parsed  = parseCommand(left);
                             let cmdName = parsed.cmd;

                             let cc = {
                                 origin : 0
                             };

                             if (!cmdName)
                             {
                                 // return list of command name and description pair

                                 cc.query      = left;
                                 cc.collection = [];
                                 let done      = [];

                                 // at most 1 item for 1 command
                                 // ex) command A's name is extracted from ["ho[ge]", "hu[ga]"]
                                 //     if user input
                                 //        "h" <TAB>
                                 //     returned item is will be "hoge".
                                 for (let [name, cmd] of util.keyValues(commands))
                                 {
                                     if (name.indexOf(left) === 0)
                                     {
                                         let found;

                                         if (cmd.names.every(function (s) done.indexOf(s) === -1 || s.length < name.length))
                                         {
                                             cc.collection.push([name, cmd.description]);
                                             done.push(name);
                                         }
                                     }
                                 }

                                 cc.collection = cc.collection.sort(util.sortMultiple);
                                 cc.errorMsg   = "No commands for \"" + left + "\"";
                                 cc.style      = ["", style.prompt.description];
                             }
                             else
                             {
                                 // return result of command completer

                                 if (cmdName in commands)
                                 {
                                     let cmd = commands[cmdName];

                                     let qLeft  = left.slice(parsed.queryStart);
                                     let qWhole = whole.slice(parsed.queryStart);

                                     let commandCompleter = cmd.extra.completer;

                                     let extra = {
                                         bang     : cmd.bang,
                                         argCount : cmd.argCount,
                                         left     : qLeft,
                                         whole    : qWhole,
                                         state    : null
                                     };

                                     let isLiteral = cmd.extra.literal || typeof cmd.extra.literal === "number";

                                     if (isLiteral)
                                     {
                                         let result = commandCompleter(null, extra);
                                         if (typeof result.origin === "number")
                                             result.origin += parsed.queryStart;
                                         return result;
                                     }

                                     let [args, state] = completer.utils.lex(qLeft, {raw : true});

                                     if (state !== completer.states.NEUTRAL)
                                     {
                                         extra.query = args.pop();

                                         if (state === completer.states.QUOTE ||
                                             state === completer.states.ESCAPE)
                                             extra.query = extra.query.slice(0, extra.query.length - 1);
                                     }

                                     cc.query = extra.query || "";

                                     let callCompleter = true;

                                     // ============================================================ //
                                     // Process Option
                                     // ============================================================ //
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
                                         // check arguments count
                                         if (typeof cmd.extra.argCount !== "undefined")
                                         {
                                             let argCount = cmd.extra.argCount;
                                             let current  = args.length;
                                             let needMore = false;
                                             let errorMsg;

                                             if (!isNaN(+argCount))
                                             {
                                                 let neededCount = +argCount;

                                                 if (current < neededCount)
                                                     needMore = true;
                                                 else if (current >= neededCount)
                                                 {
                                                     errorMsg = "Just " + neededCount + " arguments is permitted";
                                                 }
                                             }
                                             else
                                             {
                                                 switch (argCount)
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

                                         // ============================================================ //
                                         // Count Escaped Characters
                                         // ============================================================ //

                                         let escapedCount = 0;

                                         if (extra.query)
                                         {
                                             let escapedLength = extra.query.length;
                                             extra.query       = completer.utils.unescape(extra.query);
                                             escapedCount      = escapedLength - extra.query.length;
                                         }

                                         let unescapedArgs = args.map(completer.utils.unescape);

                                         escapedCount += args.reduce(function (a, s) a + s.length, 0)
                                             - unescapedArgs.reduce(function (a, s) a + s.length, 0);

                                         // ============================================================ //
                                         // Call completer
                                         //
                                         // args[0..n] => unescaped (raw)
                                         //
                                         // extra = {
                                         //     bang         :
                                         //     count        :
                                         //     state        :
                                         //     query        : => unescaped (raw)
                                         //     left         : => escaped
                                         //     whole        : => escaped
                                         //     options[foo] : => unescaped (raw)
                                         // };
                                         //
                                         // You may need call completer.utils.unescape for escaped strings
                                         // e.g. left, whole. left and whole is especially userful for commands
                                         // which uses completely original completer like :js, :open and so forth.
                                         //
                                         // ============================================================ //

                                         let result = commandCompleter ? commandCompleter(unescapedArgs, extra) : {};

                                         if (result)
                                         {
                                             if (typeof result.origin === "number")
                                             {
                                                 result.origin += parsed.queryStart;
                                                 if (!result.supressAdjustOrigin)
                                                     result.origin += escapedCount;
                                             }
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
                                     cc.errorMsg = util.format("No such command \"%s\"", cmdName);
                                 }
                             }

                             return cc;
                         },
                         callback : function (str) {
                             executeCommand(str, prefixArg);
                         }
                     }
                 );
             }
         };

         return self;
     })();
