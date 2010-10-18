let PLUGIN_INFO =
<KeySnailPlugin>
    <name>Set Mac</name>
    <description>Set mark with Ctrl-Space in Mac</description>
    <description lang="ja">Mac でも Ctrl-Space でマークをセット</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/set-mac.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/set-mac.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <detail><![CDATA[
]]></detail>
</KeySnailPlugin>;

(function () {
    const KeyCodes = {
        Space : 32,
        Ctrl  : 17
    };

    let ctrlOn = true;

    function keyDownHandler(ev) {
        switch (ev.keyCode) {
        case KeyCodes.Ctrl:
            ctrlOn = true;
            break;
        case KeyCodes.Space:
            if (ctrlOn) {
                let elem = ev.originalTarget;

                command.setMark(ev);

                function cancelContextMenu(event) {
                    event.preventDefault();
                    elem.removeEventListener("contextmenu", cancelContextMenu, true);
                }

                elem.addEventListener("contextmenu", cancelContextMenu, true);
            }
            break;
        }
    }

    function keyUpHandler(ev) {
        if (ev.keyCode === KeyCodes.Ctrl)
            ctrlOn = false;
    }

    function destructor() {
        window.removeEventListener("keydown", keyDownHandler, true);
        window.removeEventListener("keyup", keyUpHandler, true);
    }

    window.addEventListener("keydown", keyDownHandler, true);
    window.addEventListener("keyup", keyUpHandler, true);
})();
