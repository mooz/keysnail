var PLUGIN_INFO =
<KeySnailPlugin>
    <name>XUL Growl</name>
    <description>Growl like interface using XUL</description>
    <description lang="ja">XUL を用いた Growl のようなインタフェース</description>
    <version>1.0.0</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/unfuck-your-enemies.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/unfuck-your-enemies.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.1.3</minVersion>
    <include>main</include>
    <detail><![CDATA[
=== Usage ===
==== Override the content type ====
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===
==== コンテンツタイプの上書き ====
    ]]></detail>
</KeySnailPlugin>;

var xulGrowl =
    (function() {
         let count = 0;
         let xulNS = new Namespace("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
         let xhtmlNS = new Namespace("http://www.w3.org/1999/xhtml");

         function xmlToDom(xml, xmlns) {
             if (!xmlns)
                 xmlns = xulNS;

             var doc = (new DOMParser).parseFromString('<box xmlns="' + xmlns + '">' + xml.toXMLString() + "</box>",
                                                       "application/xml");
             var imported = document.importNode(doc.documentElement, true);
             var range = document.createRange();
             range.selectNodeContents(imported);
             var fragment = range.extractContents();
             range.detach();

             return fragment.childNodes.length > 1 ? fragment : fragment.firstChild;
         }
         
         /**
          * Growl Message Class
          * @param {String} title
          * @param {String} message(HTML string)
          * @param {String} link
          */
         function GrowlMessage() {
             this.init.apply(this, arguments);
         }

         GrowlMessage.prototype = {
             init: function () {
                 this.time = null;
                 this.dom = null;
                 this.isPin = false;
                 this.count = count++;
                 let xml = this._createXML.apply(this, arguments);
                 this.dom = xmlToDom(xml);
             },

             setTimer: function (sec) {
                 if (!sec)
                     sec = 20;
                 this.time = setTimeout(function (self, manager) {
                                            manager.remove(self.count);
                                        }, sec * 1000, this, growlManager);
             },

             clearTimer: function () {
                 if (this.time)
                 {
                     clearTimeout(this.time);
                     this.time = null;
                     return true;
                 }
                 return false;
             },

             pin: function () {
                 if (this.isPin)
                 {
                     this.setTimer();
                     this.isPin = false;
                 }
                 else
                 {
                     this.clearTimer();
                     this.isPin = true;
                 }
             },

             _createXML: function (title, message, link) {
                 let xml =
                     <vbox count={this.count}
                 style="margin-top:10px;-moz-border-radius:5px;background-color:rgba(0,0,0,0.75);color:white;max-width:300px;padding:5px;"
                 xmlns={xulNS}>
                     <hbox style="border-bottom: thin solid rgba(192,192,192,0.5);">
                     <titlebar flex="1"><label value={this.count + ": " + title} flex="1"/></titlebar>
                     <checkbox label="" oncommand={"liberator.plugins.xulGrowl.pin(" + this.count + ");"} tooltipText="pin" style="-moz-apperance:none;"/>
                     <toolbarbutton oncommand={"liberator.plugins.xulGrowl.remove(" + this.count + ");"} class="tab-close-button"/>
                     </hbox>
                     <hbox><vbox><image src="chrome://vimperator/skin/icon.png" width="32" height="32"/><spacer flex="1"/></vbox></hbox>
                     </vbox>
                     ;
                 xml.xulNS::hbox[1].appendChild(new XML('<div xmlns="http://www.w3.org/1999/xhtml">' + message + '</div>'));
                 if (link)
                     xml.appendChild(<div xmlns={xhtmlNS}><a href="#" onclick="liberator.open(this.textContent,liberator.NEW_TAB);">{link}</a></div>);
                 return xml;
             }
         };

         let growlManager = {
             initialize: function () {
                 this.root.appendChild(this.panel);
             },

             update: function (message) {
                 if (this.panel.state == "closed")
                     this.open();
                 
                 let gm = new GrowlMessage(message.title, message.message, message.link);
                 this.panel.appendChild(gm.dom);
                 gm.setTimer();
                 this.gmList.push(gm);
             },

             gmList: [],
             panel: xmlToDom(<panel noautofocus="true" noautohide="true" width="300" style="background-color:transparent;border:none;" xmlns={xulNS}/>),

             getIndexAndMessageByCount: function (count) {
                 for (let [i, gm] in Iterator(this.gmList))
                 {
                     if (count == gm.count)
                         return [i, gm];
                 }

                 return null;
             },

             pin: function (count) {
                 let indexAndGm = this.getIndexAndMessageByCount(count);
                 if (indexAndGm)
                 {
                     indexAndGm[1].pin();
                 }
             },

             remove: function (count) {
                 count = parseInt(count, 10);
                 let indexAndGm = this.getIndexAndMessageByCount(count);
                 if (indexAndGm)
                 {
                     let [index, gm] = indexAndGm;
                     if (this.panel.childNodes.length <= 1)
                         this.panel.hidePopup();
                     
                     this.panel.removeChild(gm.dom);
                     this.gmList.splice(index, 1);
                     return true;
                 }

                 return false;
             },

             root: document.documentElement,

             open: function () {
                 let cb = getBrowser().mCurrentBrowser;
                 this.panel.openPopup(cb,"overlay",cb.boxObject.width - this.panel.boxObject.width - 10, 0, false, true);
             },

             close: function () {
                 this.panel.hidePopup();
                 this.root.removeChild(this.panel);
             }
         };

         return growlManager;
     })();

plugins.lib.xulGrowl = xulGrowl;

// function onUnload() {
//     try{
//         plugins.xulGrowl.close();
//     } catch(e) {};
// }

// vim:sw=2 ts=2: