// PLUGIN_INFO {{ =========================================================== //

let PLUGIN_INFO =
<KeySnailPlugin>
    <name>Dynamic Macro</name>
    <description>Detect duplicated manipulation. Repeat it easily.</description>
    <description lang="ja">繰り返しを検出し、簡単に再実行</description>
    <version>0.0.2</version>
    <updateURL>http://github.com/mooz/keysnail/raw/master/plugins/dmacro.ks.js</updateURL>
    <iconURL>http://github.com/mooz/keysnail/raw/master/plugins/icon/dmacro.icon.png</iconURL>
    <author mail="stillpedant@gmail.com" homepage="http://d.hatena.ne.jp/mooz/">mooz</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.4.1</minVersion>
    <provides>
        <ext>dmacro-exec</ext>
        <ext>dmacro-reset</ext>
    </provides>
    <include>main</include>
    <options>
        <option>
            <name>dmacro.key_length</name>
            <type>number</type>
            <description>If you want to bind dmacro-exec to key sequence, specify its length (Default: 1)</description>
            <description lang="ja">キーシーケンスへ dmacro-exec を割り当てる場合は、その長さを指定 (デフォルト: 1)</description>
        </option>
        <option>
            <name>dmacro.predicate_length</name>
            <type>number</type>
            <description>Max length of the predicated repetetition (Default: 20)</description>
            <description lang="ja">「次の動作を予測した繰り返し」において「操作の単位」とみなすキー入力数の上限</description>
        </option>
    </options>
    <detail><![CDATA[
=== Usage ===

Here comes the dmacro.el! Detects repeated manipulation and repeat it easily.

- Repeat completly repeated manipulation
- Predicate next manipulation and repeat it

For more details, see dmacro.el's homepage.'

http://www.pitecan.com/DynamicMacro/

==== Settings ====

Pasete settings below to your .keysnail.js.

>||
key.setEditKey('M-@', function (ev) {
    ext.exec("dmacro-exec");
}, 'Dynamic macro');
||<

In this settings, we bound dmacro-exec to M-@ key.

After that, do something on textarea and press M-@ key (or your defined one).
Repetition of the manipulation will be detected automatically and it will be repeated one time. 

If you want detection to be more strictly, paste the settings below to the PRESERVE area in your .keysnail.js file.

>||
plugins.options["dmacro.predicate_length"] = 10;
||<
    ]]></detail>
    <detail lang="ja"><![CDATA[
=== 使い方 ===

==== Dynamic Macro ====

あの dmacro.el が Firefox へやってきました。繰り返しの操作を自動で検出し、簡単に再実行することが可能となります。

- 完全一致による動作の繰り返し
- 次の動作を予測した動作の繰り返し

詳しい説明はぜひ本家のホームページをご覧下さい。

http://www.pitecan.com/DynamicMacro/

==== 設定 ====

次のような設定を .keysnail.js の末尾へ貼り付けておきます。

>||
key.setEditKey('M-@', function (ev) {
    ext.exec("dmacro-exec");
}, 'Dynamic macro');
||<

ここでは M-@ といったキーへ「再実行」コマンドを割り当てています。

設定が終了したら、テキストエリアで適当な操作を行い、今割り当てたキーを入力してみましょう。
繰り返しが自動で検出され、なかなかうまい具合に動作が再実行されるのがお分かりになるかと思います。

繰り返しの誤爆が大きいな、と感じる方は .keysnail.js の PRESERVE エリアへ次のような設定を行っておくと良いでしょう。

>||
plugins.options["dmacro.predicate_length"] = 20;
||<

これは「次の動作を予測した繰り返し」において「操作の単位」とみなすキー入力数の上限を意味します。

デフォルトでは 30 となっていますので、お好みで調節すると良いでしょう。

]]></detail>
</KeySnailPlugin>;

// }} ======================================================================= //

// Change Log {{ ============================================================ //
// 
// ==== 0.0.2 (2010 02/12) ====
// 
// * Added dmacro-reset
// 
// ==== 0.0.1 (2010 02/12) ====
//
// * Released
//
// }} ======================================================================= //

let optionsDefaultValue = {
    "key_length"       : 1,
    "predicate_length" : 30
};

function getOption(aName) {
    let fullName = "dmacro." + aName;

    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

let dmacro =
    (function () {
         let ignoreIt = false;
         let limit = 100;

         function stock(k) {
             let ss = self.stocks;
             ss.push(k);
             if (ss.length > limit)
                 ss.shift();
         }

         function findBlock(haystack, needle) {
             let neelen = needle.length;

             outer:
             for (let i = haystack.length - neelen; i >= 0; --i)
             {
                 for (let j = 0; j < neelen; ++j)
                 {
                     if (haystack[i + j] !== needle[j])
                         continue outer;
                 }

                 return i;
             }

             return -1;
         }

         function seekCompleteRepeat(ss) {
             let found;

             let len = ss.length;
             let to  = len / 2;

             for (let i = len - 1; i >= to; --i)
             {
                 let sublen = len - i;

                 let current = ss.slice(i);
                 let cand    = ss.slice(i - sublen, i);

                 if (current.join("") === cand.join(""))
                     found = current;
             }

             return found;
         }

         /**
          * [s][t][s]
          * @param   {} ss
          * @returns {}
          */
         function seekIncompleteRepeat(ss) {
             let s, t;

             let len = ss.length;

             for (let i = len - 1; i >= 0; --i)
             {
                 let current = ss.slice(i);
                 let remain  = ss.slice(0, i);
                 let found   = findBlock(remain, current);

                 if (found >= 0)
                 {
                     s = current;
                     t = remain.slice(found + current.length);
                 }
             }

             return [s, t];
         }

         let self = {
             stocks: [],

             init: function () {
                 hook.addToHook(
                     'KeyPress',
                     function (ev) {
                         if (util.isWritable(ev) && !ignoreIt)
                             stock(key.keyEventToString(ev));
                     });
             },

             exec: function () {
                 let ss = self.stocks;

                 let trashLen = getOption("key_length");
                 for (let i = 0; i < trashLen; ++i)
                     ss.pop();

                 // Seek for complete repeat.
                 let found = seekCompleteRepeat(ss);

                 if (!found)
                 {
                     // Seek for incomplete repeat
                     let [s, t] = seekIncompleteRepeat(ss);

                     if (s && t && t.length <= getOption("predicate_length"))
                     {
                         t.forEach(stock);
                         found = t;
                     }
                 }

                 if (found)
                 {
                     ignoreIt = true;
                     let originalSleepTime = macro.sleepTime;
                     macro.sleepTime = 1;

                     try {
                         macro.doMacro(found.map(function (k) key.stringToKeyEvent(k)));
                     } catch (x) {}

                     macro.sleepTime = originalSleepTime;
                     ignoreIt = false;
                 }
             }
         };

         return self;
     })();

plugins.dmacro = dmacro;

dmacro.init();

// }} ======================================================================= //

// Add exts {{ ============================================================== //

ext.add("dmacro-exec", function (ev, arg) { dmacro.exec(); }, "Do Dynamic Macro");
ext.add("dmacro-reset", function (ev, arg) {
            dmacro.stocks = [];
            display.echoStatusBar(M({ja: "Dynamic Macro がリセットされました",
                                     en: "Dynamic Macro has been resetted"}),2000);
        }, "Reset Dynamic Macro");

// }} ======================================================================= //
