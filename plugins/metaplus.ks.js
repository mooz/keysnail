var PLUGIN_INFO =
<KeySnailPlugin>
    <name>MetaPlus</name>
    <description>Make ESC behave as Meta</description>
    <description lang="ja">ESC キーを Meta キーとして</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/metaplus.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/metaplus.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.0</minVersion>
    <detail><![CDATA[
=== Description ===

==== Make ESC key behave as Meta key ====

By installing this plugin, you can call your keybind beginning with Meta with ESC key.

You can dispatch ESC key event by repeating ESC twice like ESC ESC.

    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===

==== ESC キーの Meta キー化 ====

Emacs では M-f などに割り当てられたコマンドは ESC f として呼び出すことができますが、 KeySnail 単体には ESC キーを Meta として扱う機能が備わっていません。

このプラグインをインストールすることにより、 ESC キーを Meta キーのようにふるまわせることが可能となります。

ESC キー自体を入力したい場合は ESC ESC というように ESC を二度続けて入力してください。

=== 注意 ===

このプラグインは Meta キーを含むキーバインドを検出し、そこから ESC キーを使ったキーバインドを新たに定義します。

これは、設定ダイアログから 「設定ファイルを再生成」 した場合に 「ESC キーから始まるキーバインドも一緒に出力される」 ということを意味します。

    ]]></detail>
</KeySnailPlugin>;

// ChangeLog {{ ============================================================= //
//
// ==== 0.0.1 (2010 01/06) ====
//
// * Released
//
// }} ======================================================================= //

for (let [mode, keymap] in Iterator(key.keyMapHolder))
{
    if (!keymap)
        continue;

    for (let [k, f] in Iterator(keymap))
    {
        let matched = k.match(/^(C-)?M-(.+)/);
        if (matched)
        {
            if (!keymap["ESC"])
                keymap["ESC"] = {};

            let prefix = matched[2];

            if (prefix === "C-")
                prefix = prefix + matched[2];

            keymap["ESC"][prefix] = keymap[k];
        }
    }

    if (keymap["ESC"])
    {
        let esc = function(ev, arg) {
            ev.originalTarget.dispatchEvent(key.stringToKeyEvent("ESC", true));
        };
        esc.ksDescription = M({ja: "ESC キーイベントを投げる", en: "Dispatch ESC"});
        keymap["ESC"]["ESC"] = esc;
    }
}
