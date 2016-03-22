var PLUGIN_INFO =
<KeySnailPlugin>
    <name>MetaPlus</name>
    <description>Make ESC behave as Meta</description>
    <description lang="ja">ESC キーを Meta キーとして</description>
    <version>0.0.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/metaplus.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/metaplus.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.0</minVersion>
    <options>
        <option>
            <name>metaplus.metakeys</name>
            <type>array</type>
            <description>Array of keys expected to behave as metakey. (Default: ["ESC"])</description>
            <description lang="ja">メタキーとさせたいキーの配列 (デフォルト値: ["ESC"])</description>
        </option>
    </options>
    <detail><![CDATA[
=== Description ===

==== Make ESC key behave as Meta key ====

By installing this plugin, you can call your keybind beginning with Meta with ESC key.

You can dispatch ESC key event by repeating ESC twice like ESC ESC.

==== Make other keys behave as Meta key ====

If you want other keys behave as Meta key, change value of the plugins.optioins["metaplus.metakeys"].

For example, by inserting the setting below to PRESERVE area of your .keysnail.js, you can use C-{ as the another meta key.

>|javascript|
plugins.options["metaplus.metakeys"] = ["C-{"];
||<

The settings below makes both ESC and C-{ behave as meta key.

>|javascript|
plugins.options["metaplus.metakeys"] = ["ESC", "C-{"];
||<

    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===

==== ESC キーの Meta キー化 ====

Emacs では M-f などに割り当てられたコマンドは ESC f として呼び出すことができますが、 KeySnail 単体には ESC キーを Meta として扱う機能が備わっていません。

このプラグインをインストールすることにより、 ESC キーを Meta キーのようにふるまわせることが可能となります。

ESC キー自体を入力したい場合は ESC ESC というように ESC を二度続けて入力してください。

==== ESC キー以外を Meta キーとして使う ====

ESC キー以外を Meta キーとして利用したい場合は metaplus.metakeys の値を変更してください。

例えば .keysnail.js の PRESERVE エリアへ次のような設定を行っておくと、 C-{　を Meta キーとして振る舞わせることが可能となります。

>|javascript|
plugins.options["metaplus.metakeys"] = ["C-{"];
||<

ESC キーと C-{ の両方を Meta キーとして使いたい場合は、以下のようにします。

>|javascript|
plugins.options["metaplus.metakeys"] = ["ESC", "C-{"];
||<

=== 注意 ===

このプラグインは Meta キーを含むキーバインドを検出し、そこから ESC キーを使ったキーバインドを新たに定義します。

これは、設定ダイアログから 「設定ファイルを再生成」 した場合に 「ESC キーから始まるキーバインドも一緒に出力される」 ということを意味します。

    ]]></detail>
</KeySnailPlugin>;

// ChangeLog {{ ============================================================= //
//
// ==== 0.0.2 (2010 01/20) ====
//
// * Added option metaplus.metakeys which allows user to use any keys as meta.
//
// ==== 0.0.1 (2010 01/06) ====
//
// * Released
//
// }} ======================================================================= //

var optionsDefaultValue = {
    "metakeys" : ["ESC"]
};

function getOption(aName) {
    var fullName = "metaplus." + aName;
    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

for (let [mode, keymap] of util.keyValues(key.keyMapHolder))
{
    if (!keymap)
        continue;

    for (let [k, f] of util.keyValues(keymap))
    {
        let matched = k.match(/^(C-)?M-(.+)/);
        if (matched)
        {
            getOption("metakeys").forEach(
                function (meta) {
                    if (typeof keymap[meta] !== "object")
                        keymap[meta] = {};

                    let prefix = matched[2];

                    if (prefix === "C-")
                        prefix = prefix + matched[2];

                    keymap[meta][prefix] = keymap[k];
                });
        }
    }

    if (typeof keymap["ESC"] === "object")
    {
        let esc = function(ev, arg) {
            ev.originalTarget.dispatchEvent(key.stringToKeyEvent("ESC", true));
        };
        esc.ksDescription = M({ja: "ESC キーイベントを投げる", en: "Dispatch ESC"});
        keymap["ESC"]["ESC"] = esc;
    }
}
