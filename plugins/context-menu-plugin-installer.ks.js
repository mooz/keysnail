var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Context menu plugin installer</name>
    <description>Install plugin from context menu</description>
    <description lang="ja">右クリックでプラグインをインストール</description>
    <version>1.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/context-menu-plugin-installer.ks.js</updateURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.0</minVersion>
    <detail><![CDATA[
=== Usage ===
==== Install plugin from context menu ====
Right click the link to plugin file and select "Install this plugin".
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===
==== 右クリックからインストール ====
プラグインファイルへのリンクを右クリックし、メニューから「このプラグインをインストール」を選択してください。
    ]]></detail>
</KeySnailPlugin>;

function setMenuDisplay() {
    var item = document.getElementById("keysnail-plugin-installer");
    item.hidden = !gContextMenu.onLink || !gContextMenu.linkURL.match("\\.ks\\.js$");
}

function installPlugin() {
    var url = gContextMenu.linkURL;
    userscript.installPluginFromURL(url);
}

function init() {
    var contextMenu = document.getElementById("contentAreaContextMenu");
    
    var menuitem = document.createElement("menuitem");
    menuitem.id = "keysnail-plugin-installer";
    menuitem.setAttribute("label", M({ja: "このプラグインをインストール", en: "Install this plugin"}));
    menuitem.setAttribute("accesskey", "k");
    menuitem.setAttribute("class", "menuitem-iconim");
    menuitem.setAttribute("src", "chrome://keysnail/skin/notify-icon16.png");
    contextMenu.appendChild(menuitem);

    menuitem.addEventListener("command", installPlugin, false);
    contextMenu.addEventListener("popupshowing", setMenuDisplay, false);
}

init();
