const PLUGIN_INFO =
<KeySnailPlugin>
    <name>KeySpawn</name>
    <description>Spawn</description>
    <description lang="ja">外部コマンドを実行</description>
    <version>0.0.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/keyspawn.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/keyspawn.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.0</minVersion>
    <include>main</include>
    <detail><![CDATA[
]]></detail>
    <detail lang="ja"><![CDATA[

]]></detail>
</KeySnailPlugin>;

const { classes: Cc, interfaces: Ci } = Components;

let options = plugins.setupOptions("keyspawn", {
    "shell": {
        "default"     : "/bin/sh",
        "description" : M({ja: "シェルのパス", en: "Path to the shell"})
    },
    "shell_flag": {
        "default"     : ["-c"],
        "description" : M({ja: "シェルへ渡すオプション", en: "Optional flags"})
    }
}, PLUGIN_INFO);

function Observer(handlers) {
    this.handlers = handlers;
}

Observer.prototype = {
    QueryInterface: function(aIID) {
        if(!aIID.equals(CI.nsISupports) && !aIID.equals(CI.nsIObserver))
            throw CR.NS_ERROR_NO_INTERFACE;
        return this;
    },

    observe: function (subject, topic, data) {
        if (typeof this.handlers[topic] === "function") {
            this.handlers[topic].apply(this, arguments);
        }
    }
};

let KeySpawn = {
    getProcess: function (file) {
        let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        process.init(file);
        return process;
    },

    spawn: function (file, args, succ, fail) {
        let process = this.getProcess(file);

        let observer = new Observer({
            "process-finished": function () {
                if (typeof succ === "function")
                    succ();
            },
            "process-failed": function () {
                if (typeof fail === "function")
                    fail();
            }
        });

        process.runAsync(args, args.length, observer);
    },

    withTempFiles: function (f, self) {
        let tmpFiles = [for (i of util.range(0, f.length)) i].map(this.createTempFile);

        try {
            return f.apply(self || this, tmpFiles);
        } finally {
            tmpFiles.forEach(function (f) f.remove(false));
        }
    },

    system: function (command, input) {
        return this.withTempFiles(function (stdin, stdout, cmd) {
            if (input)
                this.writeFile(stdin, input);

            let cwd = share.pwd;

            if (WINDOWS) {
                command = "cd /D " + cwd.path + " && " + command + " > " + stdout.path + " 2>&1" + " < " + stdin.path;
                var res = this.run(options["shell"], options["shellcmdflag"].split(/\s+/).concat(command), true);
            } else {
                this.writeFile(cmd,
                               "cd " + escape(cwd.path) + "\n" +
                               ["exec", ">" + escape(stdout.path), "2>&1", "<" + escape(stdin.path),
                                escape(options["shell"]), options["shellcmdflag"], escape(command)].join(" "));
                res = this.run("/bin/sh", ["-e", cmd.path], true);

                // writeFile: function (file, buf, mode, perms, encoding)
            }

            let output = self.readFile(stdout);
            if (res > 0)
                output += "\nshell returned " + res;
            // if there is only one \n at the end, chop it off
            else if (output && output.indexOf("\n") == output.length - 1)
                output = output.substr(0, output.length - 1);

            return output;
        }) || "";
    },

    createTempFile: function () {
        let tmp = util.getSpecialDir("TmpD");
        tmp.append("keyspawn.tmp");
        tmp.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
        return tmp;
    },

    launch: function (cmd, callback, charset) {
        const launcher = util.openFile(getOption("launcher_path"));

        let args = (getOption("launcher_options") || []).concat(cmd);

        if (callback) {
            cmd = cmd + " > " + stdout.path;

            util.message("finally, execute :: " + cmd);
        }

        // sh -c command < input
        // spawn: function (file, args, succ, fail)
        let process = this.spawn(launcher, args, function () {
            if (callback) {
                alert("Returened");
                let result = util.readTextFile(stdout.path, charset);
                callback(result);
            }
        });
    }
};

shell.add(["spawn"], "Execute shell command", function (args, extra) {
    let command = args.join(" ");
    alert(command);
    KeySpawn.launch(command, function (result) {
        alert("Got result :: " + result);
    });
}, {
    bang    : true,
    literal : 0
});

plugins.withProvides(function (provide) {
    provide("keysnail-swapn", function () {
        prompt.read("command: ", function (command) {
            display.prettyPrint("Execute " + command);

            KeySpawn.launch(command, function (result) {
                alert(result);
            });
        });
    }, "swapn Command");

    provide("keyspawn-reload", function () {
        let plugin = util.readDirectory(userscript.pluginDir, true)
            .reduce(function (found, cand)
                    (found ? found : (cand.leafName === "keyspawn.ks.js") ? cand : null),
                    null);
        if (plugin)
            userscript.loadPlugin(plugin);
    }, "reload KeySpawn");
}, PLUGIN_INFO);
