var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Builtin command as Ext</name>
    <name>組み込みコマンドをエクステ化</name>
    <description>Make builtin commands to ext</description>
    <description lang="ja">組み込みコマンドをエクステ化します</description>
    <version>1.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/builtin-commands-ext.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/builtin-commands-ext.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0.4</minVersion>
    <include>main</include>
    <detail><![CDATA[
=== What's this ===
==== Make all builtin commands to ext ====
This plugin provides a lot of exts which is fetched from the KeySnail builtin commands.

If you don't have the keybindings to display the ext, go to the preference dialog and

+ Add
+ Builtin commands
+ KeySnail commands
+ List exts and execute selected one

or put codes below to your .keysnail.js.

>|javascript|
key.setGlobalKey('M-x', function (aEvent, aArg) {
    ext.select(aArg, aEvent);
}, 'List exts and execute selected one');
||<

You can list all builtin commands by pressing M-x.

=== Usage ===
You can choose which ext to be fetched from buildin commands by setting ext_list option.

>|javascript|
plugins.options["builtin_commands_ext.ext_list"] = [
    "back",
    "open-url-from-clipboard",
    "restart-firefox"
];
||<

If the value is empty list, no ext is added. If the value is null, all commands are added as ext.
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===
==== 組み込みコマンドのエクステ化 ====
このプラグインをインストールすることにより KeySnail の組み込みコマンドをエクステとして使用することが可能となります。

エクステ一覧を表示するキーバインドを定義していない場合は、設定ダイアログから

+ 追加
+ 組み込みコマンド
+ KeySnail の操作
+ エクステ

として追加するか、次のようなコードを .keysnail.js などの初期化ファイルへ記述して下さい。

>|javascript|
key.setGlobalKey('M-x', function (aEvent, aArg) {
    ext.select(aArg, aEvent);
}, 'エクステ一覧');
||<

こうすることにより M-x を入力することで組み込みコマンドを一覧表示し、実行することが可能となります。

=== Usage ===
ext_list オプションを設定することで、追加するコマンドを指定することができます。

>|javascript|
plugins.options["builtin_commands_ext.ext_list"] = [
    "back",
    "open-url-from-clipboard",
    "restart-firefox"
];
||<

空リストが設定された場合、エクステは追加されません。値として null が設定された場合、すべてのコマンドがエクステとして追加されます。
    ]]></detail>
</KeySnailPlugin>;

let pOptions = plugins.setupOptions("builtin_commands_ext", {
    "ext_list": {
        preset: null,
        description: M({
            ja: "組み込みコマンドから追加するエクステのリスト",
            en: "List of exts you want to fetch from builtin commands"
        }),
        type: "array"
    }
}, PLUGIN_INFO);

function main() {
    var bundleSvc = Components.classes["@mozilla.org/intl/stringbundle;1"]
        .getService(Components.interfaces.nsIStringBundleService);
    const kBundleURI = "chrome://keysnail/locale/functions.properties";
    var stringBundle = bundleSvc.createBundle(kBundleURI);

    function getLocaleString(aStringKey) {
        try {
            return stringBundle.GetStringFromName(aStringKey);
        } catch (x) {
            return aStringKey;
        }
    }

    function propertyToExtName(aProperty) {
        return aProperty.replace(/_/g, "-");
    }

    var context = {
        __proto__ : KeySnail.modules
    };

    try {
        Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Components.interfaces.mozIJSSubScriptLoader)
            .loadSubScript("resource://keysnail-share/functions.js", context);
    } catch (x) {
        return;
    }

    for (let [, commands] in Iterator(context.ksBuiltin)) {
        for (var name in commands) {
            var ename = propertyToExtName(name);


            if (name == "__mode__" || (pOptions["ext_list"] !== null && pOptions["ext_list"].indexOf(ename) < 0))
                continue;

            ext.add(ename,
                    commands[name][0],
                    getLocaleString(name));
        }
    }
}

main();
