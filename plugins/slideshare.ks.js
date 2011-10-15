/*
 Copyright (c) 2011, anekos.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 THE POSSIBILITY OF SUCH DAMAGE.
 */

let PLUGIN_INFO =
<KeySnailPlugin>
    <name>Slideshare</name>
    <description>Manipulate Slideshare</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/slideshare.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/slideshare.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>New BSD License</license>
    <minVersion>1.2.4</minVersion>
    <detail><![CDATA[
===Usage===

With site-local-keymap.ks.js,

>||
local["^http://www.slideshare.net/"] = [
  ['n', function () ext.exec("slideshare-next")],
  ['p', function () ext.exec("slideshare-previous")],
  ['f', function () ext.exec("slideshare-toggle-fullscreen")]
];
||<
]]></detail>
</KeySnailPlugin>;

plugins.withProvides(function (provide) {
  provide("slideshare-next", function () {
    Slideshare(function () this.next());
  }, "Next page");

  provide("slideshare-previous", function () {
    Slideshare(function () this.previous());
  }, "Previous page");

  provide("slideshare-toggle-fullscreen", function () {
    Slideshare(function () this.toggleFullScreen());
  }, "Toggle fullscreen status");
}, PLUGIN_INFO);

function HTML5Slideshare(doc, callback) {
  let win = doc.defaultView;
  let player = win.player;

  callback({
    next: function () {
      player.play(this.current + 1);
    },

    previous: function () {
      if (this.current > 1)
        player.play(this.current - 1);
    },

    get current () player.controller.currentPosition,

    toggleFullScreen: function () {
      doc.querySelector('.btnFullScreen').click();
    }
  });
}

function FlashSlideshare(doc, callback) {
  let player = doc.querySelector('#player');
  let include = doc.querySelector('#h-flashplayer-inclusions').textContent;
  doc.defaultView.eval(include);

  const fullScreenStyle = <><![CDATA[
    position : fixed !important;
    top      : 0px !important;
    left     : 0px !important;
    z-index  : 1000;
    width    : 100% !important;
    height   : 100% !important;
  ]]></>;

  setTimeout(function () {
    player = doc.querySelector('#player');

    const originalPlayerStyle = player.getAttribute('style');
    let isFullScreen = false;

    callback({
      next: function () {
        player.next();
      },

      previous: function () {
        player.previous();
      },

      get current () player.controller.currentPosition,

      toggleFullScreen: function () {
        player.setAttribute('style', originalPlayerStyle + (isFullScreen ? "" : fullScreenStyle));
        isFullScreen = !isFullScreen;
      }
    });
  }, 100);
}

function Slideshare(callback) {
  const PN = '__anekos_slidehare';

  if (content.document.location.host !== 'www.slideshare.net')
    return display.prettyPrint(M({
      ja: "Slideshare のページではないようです",
      en: "This page is not a part of Slideshare"
    }));

  let doc = content.document;
  let docw = doc.wrappedJSObject;

  if (doc[PN])
    return callback.call(doc[PN]);

  let func = docw.defaultView.player ? HTML5Slideshare : FlashSlideshare;
  func(docw, function (instance) {
    doc[PN] = instance;
    callback.call(instance);
  });
}
