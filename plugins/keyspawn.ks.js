const PLUGIN_INFO =
<KeySnailPlugin>
    <name>KeySpawn</name>
    <description>Spawn</description>
    <description lang="ja">外部コマンドを実行</description>
    <version>0.0.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/keyspawn.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/keyspawn.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.0</minVersion>
    <include>main</include>
    <provides>
        <ext></ext>
    </provides>
    <detail><![CDATA[
]]></detail>
    <detail lang="ja"><![CDATA[

]]></detail>
</KeySnailPlugin>;

const { classes: Cc, interfaces: Ci } = Components;

let optionsDefaultValue = {
    launcher_path    : "/bin/sh",
    launcher_options : ["-c"]
};

function getOption(aName) {
    let fullName = "keyspawn." + aName;

    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

// let getOption = plugins.optionGetter("keyspawn", {
//     launcher_path: "/bin/sh",
//     launcher_options: ["-c"]
// });

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

    launch: function (cmd, callback, charset) {
        const launcher = util.openFile(getOption("launcher_path"));

        let args = (getOption("launcher_options") || []).concat(cmd);

        if (callback) {
            var stdout = util.getSpecialDir("TmpD");
            stdout.append("keyspawn_stdout.tmp");

            stdout.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
            util.message("stdout :: " + stdout.path);

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

ext.add("keyspawn-command", function () {
    prompt.read("command: ", function (command) {
        display.prettyPrint("Execute " + command);

        KeySpawn.launch(command, function (result) {
            alert(result);
        });
    });
});

ext.add("keyspawn-reload", function () {
    let plugin = util.readDirectory(userscript.pluginDir, true)
        .reduce(function (found, cand)
                (found ? found : (cand.leafName === "keyspawn.ks.js") ? cand : null),
                null);
    if (plugin)
        userscript.loadPlugin(plugin);
}, "Load keyspawn");
