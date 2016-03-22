// This code is based on the following vimperator plugin
// http://vimperator.g.hatena.ne.jp/teramako/20090327/1238170418


// PLUGIN_INFO {{ =========================================================== //

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>XUL Growl</name>
    <description>Growl like interface using XUL</description>
    <description lang="ja">XUL を用いた Growl のようなインタフェース</description>
    <version>0.0.3</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/_xul-growl.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/_xul-growl.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>MPL</license>
    <minVersion>1.1.3</minVersion>
    <include>main</include>
    <detail><![CDATA[
=== What's this ==='
==== Growl like notification interface ====

>|javascript|
key.setGlobalKey("C-0", function (ev, arg) {
    var length = Math.round(10 * Math.random());
    plugins.lib.xulGrowl.update(
        {
            title   : "Hello!",
            message : Array(length).join("Hello!"),
            link    : "http://www.google.co.jp/"
        }
    );
}, 'Growl', true);
||<
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 説明 ===
==== Growl ライクな通知インタフェース ====

>|javascript|
key.setGlobalKey("C-0", function (ev, arg) {
    var length = Math.round(10 * Math.random());
    plugins.lib.xulGrowl.update(
        {
            title   : "Hello!",
            message : Array(length).join("Hello!"),
            link    : "http://www.google.co.jp/"
        }
    );
}, 'Growl', true);
||<
    ]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// ChangeLog {{ ============================================================= //
//
// ==== 0.0.2 (2009 12/05) ====
//
// * Added transparent effect (not works on Linux)
//
// }} ======================================================================= //

// Main {{ ================================================================== //

var xulGrowl =
    (function() {
         let count = 0;
         let xulNS   = new Namespace("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
         let xhtmlNS = new Namespace("http://www.w3.org/1999/xhtml");

         const Cc = Components.classes;
         const Ci = Components.interfaces;

         const iconData = 'data:image/png;base64,' +
             'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlz' +
             'AAADWwAAA1sB5s3OywAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANKSURB' +
             'VFiFxddbiJVVFMDx34jZjeiG0IOZSQ472OUujKTAHgoDg6KQbg+B0AUsjIoik6gIKgrqIYioIIMK' +
             'klCSkDKIlDQUqp1tcJtT04UwI5Nu0KhoD+eMnhmPx3OmGVxv3157fev/rcve6+v7euuXBzDk2Mjx' +
             'kzEUQzrhWHgvNf87eZxfOB134DzsxqoY0kedbCaNo/O7sAn78S624qlS84pS84lHshuXCJSa5+IR' +
             'XBxD2tGy/jLewKNN/WEyXhFYgsdanUMMaS/uweJS88kTCXAFPmyniCH9jm9w4UQC7MLpHfRT8PdE' +
             'AmzEwnaKUnPEVGybSIAnNPJ8zSjnZ+MtLIsh7WlnOC5dEEPaUWq+FitKzUuxQaMV38fTMaTlR7I9' +
             'DKDUfKpGUQ3h8xjSb11CbC4192MOHse32Iv3OtmNSEGpeQkGsQj3Ykup+fZuAJoQe2JIG7EGM/EO' +
             'bukKoNR8E+7E7BjS9TGkBbgMD5War+oWoikDmKWR/1u7AsBSLI4h/TS8EEP6HvdjWY8A29EfQ/oC' +
             'k0vNbc+A0QAzsLnNns0IPQIMYkapuQ9v6xCFVoBdOKfNnoTai/dmy/2KaU2Am5swHQFewwul5inD' +
             'C6XmU/Bk8yW9ygBmxZAGsBOXt9vU2obP4Xz8WGpei1W4EVtjSK+OAWC7RiF+7FAaPh296WAEYkj7' +
             'Yki3YTbW4vWmwRljcN4KQKMdbyg1H3dEgBaQnTGkN/GVxvl9Uan5gv8DEEP6BVsw/6gALbIec/E8' +
             'Hh4DwAD6W57bdkMngHWYh1dwZal5Zo8Ag5heah72sRLzS80ndQvwGS7RuBNewoO9eG9OQzs0WzuG' +
             '9Cc+wXVdAcSQ/tHo/zl4EQtLzWf1AmFkIdImDUebB9ZjXgxpN5bjvh4Bhu+EYVmDS0vNZ3YLsE7j' +
             'aqZRjItKzaf1ADAiAjGkIazWMj0dDWAD5paaJzUn3pUaU+6YAJoyIg0dAWJIf+AHjfsAnsXdoyu5' +
             'g4xOAY1CnNkc17qaCYfbUQzpO42jtdshZRDTSs0Hj/wY0n6s0BxUugFY71AdwDN4oN2xOlpiSPvw' +
             'M84dpTqYhr4ufs/78BemxpAOQKl5Na7GgS4+YAoWxJA+aF0sNW9D/39baxYS/OKpuAAAAABJRU5E' +
             'rkJggg==';

         // Style {{ ================================================================= //

             // 'color: white;' +

         let containerStyle =
             'padding: 5px; color:white; background-color:rgba(0,0,0,0.8);' +
             'width:300px; margin-left: auto; margin-right: 0; opacity:0;';

         let headerStyle = "border-bottom: thin solid rgba(192,192,192,0.5);";

         let messageStyle = "max-width:250px;";

         let panelStyle = 'border:none; width:300px;';

         {
             let xulRuntime = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
             if (xulRuntime.OS !== "Linux")
             {
                 containerStyle += "-moz-border-radius:5px; margin-top: 10px;";
                 panelStyle     += "background-color:transparent;";
             }
         }

         // }} ======================================================================= //

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

         // original code by piro
         function doAnimation(aAnimator, aInterval, aDuration) {
             var startTime = Date.now();

             var timer = window.setInterval(
                 function () {
                     var progress = Math.min(
                         1,
                         (Date.now() - startTime) / aDuration
                     );

                     aAnimator(progress);

                     if (progress === 1)
                         window.clearInterval(timer);
                 }, aInterval);
         }

         /**
          * Growl Message Class
          * @param {String} title
          * @param {String} message (HTML string)
          * @param {String} link
          */
         function GrowlMessage() {
             this.init.apply(this, arguments);
         }

         GrowlMessage.prototype = {
             init: function () {
                 this.time  = null;
                 this.dom   = null;
                 this.isPin = false;
                 this.count = count++;
                 let xml = this._createXML.apply(this, arguments);
                 this.dom = xmlToDom(xml);
             },

             setTimer: function (sec) {
                 if (!sec)
                     sec = 10;

                 let self = this;

                 let width = 300;

                 doAnimation(
                     function (progress) {
                         if (progress === 1)
                         {
                             self.dom.style.opacity = 1.0;

                             self.time = setTimeout(
                                 function () {
                                     growlManager.remove(self.count);
                                 }, sec * 1000);
                         }
                         else
                         {
                             self.dom.style.opacity = progress;
                         }
                     }, 25, 1000);
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

             _createXML: function (title, message, link, icon) {
                 let iconURL = icon;

                 let xml =
                     <vbox count={this.count}
                           style={containerStyle}
                           flex="1"
                           xmlns={xulNS}>
                         <hbox style={headerStyle} flex="1">
                             <label value={title} flex="1"/>
                             <checkbox label=""
                                       oncommand={"KeySnail.modules.plugins.lib.xulGrowl.pin(" + this.count + ");"}
                                       tooltipText="Pin"
                                       style="-moz-apperance:none;" />
                             <toolbarbutton class="tab-close-button"
                                            oncommand={"KeySnail.modules.plugins.lib.xulGrowl.remove(" + this.count + ");"}
                                            tooltipText="Close" />
                         </hbox>
                         <hbox flex="1">
                             <vbox>
                                 <image src={iconURL}
                                        style="margin: 2px" />
                                 <spacer flex="1"/>
                             </vbox>
                         </hbox>
                     </vbox>;

                 xml.xulNS::hbox[1].appendChild(new XML('<div xmlns="' + xhtmlNS + '" ' +
                                                        'style="' + messageStyle + '">' + message + '</div>'));

                 if (link)
                 {
                     let command = 'openUILinkIn("' + link + '", "tab")';
                     xml.appendChild(
                     <div style="padding: 2px;" xmlns={xhtmlNS}>
                         <a href="#" style="text-decoration:none;"
                            onclick={command}
                            onmouseover="this.style.textDecoration='underline'"
                            onmouseout="this.style.textDecoration='none'">{link}</a>
                     </div>);
                 }

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

                 let gm = new GrowlMessage(message.title, message.message, message.link, message.icon);
                 this.panel.appendChild(gm.dom);
                 gm.setTimer();
                 this.gmList.push(gm);
             },

             gmList: [],
             panel: xmlToDom(<panel noautofocus="true" noautohide="true"
                                    style={panelStyle} xmlns={xulNS}/>),

             getIndexAndMessageByCount: function (count) {
                 for (let [i, gm] of util.keyValues(this.gmList))
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
                 this.panel.openPopup(cb, "overlay",
                                      cb.boxObject.width - this.panel.boxObject.width - 10,
                                      0,
                                      false, true);
             },

             close: function () {
                 this.panel.hidePopup();
                 this.root.removeChild(this.panel);
             }
         };

         growlManager.initialize();

         return growlManager;
     })();

// }} ======================================================================= //

// Export library {{ ======================================================== //

plugins.lib.xulGrowl = xulGrowl;

// }} ======================================================================= //
